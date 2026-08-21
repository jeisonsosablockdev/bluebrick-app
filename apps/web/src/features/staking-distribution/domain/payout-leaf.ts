/**
 * Layer 3: Domain / Cryptographic Pipelines
 * Module: Payout Leaf & Merkle Tree Domain Engine — EPIC-015 Canonical Codec
 * 
 * =========================================================================================
 * 🏛️ ARCHITECTURAL CONTEXT & SECURITY INVARIANTS
 * =========================================================================================
 * This module is responsible for the pure, off-chain cryptographic construction of:
 * 1. The 191-Byte Canonical Leaf Preimage (Strict byte concatenation, zero JSON/floating-point).
 * 2. Helium-Style Index-Based Directional Merkle Trees (solana_program::keccak compatible).
 * 3. Sibling Proof Generation & Directional Recomputation for on-chain settlement validation.
 * 4. The 147-Byte Snapshot Preimage & Hash (Signed by dual independent Ed25519 attesters).
 * 
 * 🛡️ Zero External Dependencies Rule:
 * This is Layer 3 Domain code. It contains ZERO database queries, ZERO network/RPC calls,
 * and ZERO external UI/framework couplings. It only relies on @solana/kit for base58/pubkey
 * encoding and @noble/hashes for Keccak-256 computation.
 * 
 * =========================================================================================
 * 📦 191-BYTE CANONICAL LEAF MEMORY LAYOUT (ASCII BITMAP)
 * =========================================================================================
 * 
 *  Byte Range | Field Name        | Type           | Encoding / Endianness
 * ────────────┼───────────────────┼────────────────┼─────────────────────────────────────────
 *  [000..023) | LEAF_DOMAIN       | 23 bytes ASCII | "brids:epic015:payout:v1" (No null term)
 *  [023..039) | runId             | 16 bytes raw   | RFC-4122 Canonical UUID (Big-Endian)
 *  [039..055) | claimId           | 16 bytes raw   | RFC-4122 Canonical UUID (Big-Endian)
 *  [055..087) | mint              | 32 bytes raw   | Solana Pubkey (USDC Mint)
 *  [087..119) | tokenProgram      | 32 bytes raw   | Solana Pubkey (SPL Token Program)
 *  [119..151) | recipientWallet   | 32 bytes raw   | Solana Pubkey (Owner / User Wallet)
 *  [151..183) | recipientAta      | 32 bytes raw   | Solana Pubkey (Associated Token Account)
 *  [183..191) | amountMinor       | 8 bytes (u64)  | Little-Endian Unsigned 64-bit Integer
 * ────────────┴───────────────────┴────────────────┴─────────────────────────────────────────
 *  Total: Exactly 191 Bytes Preimage -> Keccak-256 -> 32 Bytes Leaf Hash
 * 
 * =========================================================================================
 * 🌳 HELIUM DIRECTIONAL MERKLE TREE SPECIFICATION
 * =========================================================================================
 * - Leaf Sorting: Strict ascending lexicographical order by 16-byte binary claimId.
 * - Direction Rule: Direction is derived strictly from leaf index bit:
 *     is_left = (index >> depth) & 1 == 0
 *     if is_left:  parent = keccak256(current || sibling)
 *     else:        parent = keccak256(sibling || current)
 * - Odd Node Padding: Levels are padded to the next power of 2 using EMPTY_NODE ([0u8; 32]).
 * - Single Leaf Edge Case: For itemCount = 1, depth = 1, root = keccak256(leaf || EMPTY_NODE).
 * 
 * @spec EPIC-015-SOLUTION-ARCHITECTURE §Canonical Codec
 */

import { address, getAddressEncoder } from "@solana/kit";
import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

/**
 * Input parameters required to construct a single canonical payout claim leaf.
 */
export interface PayoutClaimItemInput {
  /** Unique Payout Run UUID (e.g. "550e8400-e29b-41d4-a716-446655440000") */
  runId: string;
  /** Unique Individual Claim UUID (e.g. "00000000-0000-4000-8000-000000000001") */
  claimId: string;
  /** Solana SPL Token Mint address (e.g. USDC Devnet) */
  mint: string;
  /** Solana Token Program ID (e.g. TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA) */
  tokenProgram: string;
  /** Recipient investor main wallet address */
  recipientWallet: string;
  /** Recipient Associated Token Account address where tokens are transferred */
  recipientAta: string;
  /** Gross payout amount in minor units (e.g. 1,000,000 for 1.00 USDC) */
  amountMinor: bigint;
}

/**
 * Result structure for an individual leaf within a computed Merkle tree.
 */
export interface PayoutMerkleLeafResult {
  /** Unique Claim ID string */
  claimId: string;
  /** 64-character hexadecimal Keccak-256 leaf hash */
  leafHash: string;
  /** 0-based index of the leaf in the sorted Merkle tree */
  index: number;
  /** Array of 64-character hexadecimal sibling node hashes forming the verification proof */
  proofHex: string[];
}

/**
 * Result structure of a fully constructed Merkle tree.
 */
export interface PayoutMerkleTreeResult {
  /** 64-character hexadecimal root hash committed on-chain to PayoutRun */
  merkleRoot: string;
  /** Array of all processed leaves with their respective proofs and indices */
  leaves: PayoutMerkleLeafResult[];
}

/**
 * Input parameters required to compute the 147-byte canonical Snapshot Hash.
 */
export interface SnapshotHashInput {
  /** Snapshot schema version (e.g. 1) */
  snapshotVersion: number;
  /** Unique Payout Run UUID */
  runId: string;
  /** 64-character hexadecimal Merkle root */
  merkleRoot: string;
  /** Total aggregated payout amount in minor units */
  totalAmountMinor: bigint;
  /** Total number of eligible items in the snapshot */
  itemCount: number;
  /** Commission and distribution rules engine version */
  rulesVersion: number;
  /** Solana Token Mint address */
  mint: string;
  /** Solana Token Program ID */
  tokenProgram: string;
}

/** Domain separator for 191-byte payout leaf preimages */
const LEAF_DOMAIN = new TextEncoder().encode("brids:epic015:payout:v1"); // 23 bytes

/** Domain separator for 147-byte snapshot attestation preimages */
const SNAPSHOT_DOMAIN = new TextEncoder().encode("brids:snapshot:v1"); // 17 bytes

/** Strict RFC-4122 canonical UUID validation regex (lowercase hexadecimal with hyphens) */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Empty node constant for Helium Merkle tree zero-padding (32 zero bytes) */
const EMPTY_NODE = new Uint8Array(32);

/**
 * Parses and validates an RFC-4122 canonical UUID string into exactly 16 bytes Big-Endian.
 * 
 * Invariant: Rejects non-canonical strings, trailing spaces, or malformed UUIDs
 * to prevent leaf ambiguity and preimage collision attacks.
 * 
 * @param uuidStr - Canonical UUID string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 * @param fieldName - Field name for clear error diagnosis
 * @returns 16-byte Uint8Array
 */
function parseUuidTo16Bytes(uuidStr: string, fieldName: string): Uint8Array {
  if (!uuidStr || !UUID_REGEX.test(uuidStr)) {
    throw new Error(`Invalid RFC-4122 UUID string for ${fieldName}: "${uuidStr}"`);
  }
  const hex = uuidStr.replace(/-/g, "");
  return hexToBytes(hex);
}

/**
 * Converts a Solana public key (base58 string or 64-char hex) into exactly 32 raw bytes.
 * 
 * Invariant: Enforces strict 32-byte representation without allocating extra buffers.
 * 
 * @param pubkeyStr - Solana base58 address string or 64-hex character string
 * @returns 32-byte Uint8Array
 */
function parsePubkeyTo32Bytes(pubkeyStr: string): Uint8Array {
  if (typeof pubkeyStr === "string" && /^[0-9a-f]{64}$/i.test(pubkeyStr)) {
    return hexToBytes(pubkeyStr);
  }
  const addr = address(pubkeyStr);
  return new Uint8Array(getAddressEncoder().encode(addr));
}

/**
 * Helper to concatenate an array of Uint8Arrays into a single contiguous Uint8Array.
 * 
 * @param arrays - Array of Uint8Arrays to concatenate
 * @returns Combined Uint8Array
 */
function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, a) => acc + a.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Encodes an individual payout claim into the exact 191-byte binary preimage.
 * 
 * Step-by-Step Logic:
 * // Step 1: Validate and decode runId and claimId into 16-byte Big-Endian chunks.
 * // Step 2: Validate and decode mint, tokenProgram, wallet, and ATA into 32-byte public keys.
 * // Step 3: Serialize amountMinor into 8 bytes Little-Endian (u64::to_le_bytes()).
 * // Step 4: Concatenate with LEAF_DOMAIN prefix to guarantee strict domain separation.
 * 
 * @param input - The payout claim item parameters
 * @returns Exactly 191 bytes Uint8Array preimage
 */
export function encodePayoutLeafPreimage(input: PayoutClaimItemInput): Uint8Array {
  // Step 1: Parse UUIDs (16 bytes each)
  const runIdBytes = parseUuidTo16Bytes(input.runId, "runId");
  const claimIdBytes = parseUuidTo16Bytes(input.claimId, "claimId");

  // Step 2: Parse Solana Public Keys (32 bytes each)
  const mintBytes = parsePubkeyTo32Bytes(input.mint);
  const tokenProgramBytes = parsePubkeyTo32Bytes(input.tokenProgram);
  const recipientWalletBytes = parsePubkeyTo32Bytes(input.recipientWallet);
  const recipientAtaBytes = parsePubkeyTo32Bytes(input.recipientAta);

  // Step 3: Parse Amount as Little-Endian u64 (8 bytes)
  const amountBuffer = new Uint8Array(8);
  new DataView(amountBuffer.buffer).setBigUint64(0, BigInt(input.amountMinor), true);

  // Step 4: Assemble contiguous 191-byte buffer
  const preimage = concatUint8Arrays([
    LEAF_DOMAIN,           // [000..023) - 23 bytes
    runIdBytes,            // [023..039) - 16 bytes
    claimIdBytes,          // [039..055) - 16 bytes
    mintBytes,             // [055..087) - 32 bytes
    tokenProgramBytes,     // [087..119) - 32 bytes
    recipientWalletBytes,  // [119..151) - 32 bytes
    recipientAtaBytes,     // [151..183) - 32 bytes
    amountBuffer,          // [183..191) - 8 bytes
  ]);

  if (preimage.length !== 191) {
    throw new Error(`Leaf preimage length invariant violated: expected 191, got ${preimage.length}`);
  }

  return preimage;
}

/**
 * Computes the Keccak-256 32-byte leaf hash for a claim item and returns it as a 64-char hex string.
 * 
 * @param input - The payout claim item parameters
 * @returns 64-character hexadecimal Keccak-256 leaf hash
 */
export function hashPayoutLeaf(input: PayoutClaimItemInput): string {
  const preimage = encodePayoutLeafPreimage(input);
  const hash = keccak_256(preimage);
  return bytesToHex(hash);
}

/**
 * Builds a Helium-compatible directional Merkle tree from an array of payout items.
 * 
 * Step-by-Step Logic:
 * // Step 1: Lexicographically sort items by 16-byte binary claimId (deterministic ordering).
 * // Step 2: Verify uniqueness of claimIds (fail closed on duplicates).
 * // Step 3: Hash each sorted item into a 32-byte leaf hash.
 * // Step 4: Calculate tree depth and zero-pad leaves with EMPTY_NODE to the next power of 2.
 * // Step 5: Iteratively hash pairs from bottom to root: keccak256(left || right).
 * // Step 6: Extract directional sibling proofs for each leaf using bitwise index inspection.
 * 
 * @param items - Array of payout claim inputs
 * @returns PayoutMerkleTreeResult containing merkleRoot and per-leaf directional proofs
 */
export function buildPayoutMerkleTree(items: PayoutClaimItemInput[]): PayoutMerkleTreeResult {
  if (!items || items.length === 0) {
    throw new Error("Cannot build Merkle tree for empty items array");
  }

  // Step 1: Sort items strictly by binary claimId
  const sortedItems = [...items].sort((a, b) => {
    const hexA = a.claimId.replace(/-/g, "").toLowerCase();
    const hexB = b.claimId.replace(/-/g, "").toLowerCase();
    return hexA.localeCompare(hexB);
  });

  // Step 2: Prevent duplicate claimIds in the same distribution run
  const seenClaimIds = new Set<string>();
  for (const item of sortedItems) {
    const normalizedId = item.claimId.toLowerCase();
    if (seenClaimIds.has(normalizedId)) {
      throw new Error(`Duplicate claimId found in payout snapshot: "${item.claimId}"`);
    }
    seenClaimIds.add(normalizedId);
  }

  // Step 3: Compute leaf hashes
  const leafNodes: Uint8Array[] = sortedItems.map((item) =>
    keccak_256(encodePayoutLeafPreimage(item))
  );

  // Step 4: Calculate power-of-2 depth (minimum depth 1 for single-leaf trees)
  const itemCount = sortedItems.length;
  let targetPower = 1;
  while (targetPower < itemCount) {
    targetPower *= 2;
  }
  const paddedSize = Math.max(2, targetPower);
  const treeDepth = Math.round(Math.log2(paddedSize));

  // Step 5: Initialize Level 0 with padded leaves
  const levels: Uint8Array[][] = [];
  const level0: Uint8Array[] = new Array(paddedSize);
  for (let i = 0; i < paddedSize; i++) {
    level0[i] = i < itemCount ? leafNodes[i]! : EMPTY_NODE;
  }
  levels.push(level0);

  // Iteratively compute parent levels up to the root
  for (let d = 0; d < treeDepth; d++) {
    const currentLevel = levels[d]!;
    const nextLevel: Uint8Array[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i]!;
      const right = currentLevel[i + 1]!;
      const parentHash = keccak_256(concatUint8Arrays([left, right]));
      nextLevel.push(parentHash);
    }
    levels.push(nextLevel);
  }

  const merkleRoot = bytesToHex(levels[treeDepth]![0]!);

  // Step 6: Generate directional proof for each original item
  const leavesResult: PayoutMerkleLeafResult[] = sortedItems.map((item, index) => {
    const proofHex: string[] = [];
    for (let d = 0; d < treeDepth; d++) {
      const siblingIndex = (index >> d) ^ 1;
      const siblingHash = levels[d]![siblingIndex]!;
      proofHex.push(bytesToHex(siblingHash));
    }
    return {
      claimId: item.claimId,
      leafHash: bytesToHex(leafNodes[index]!),
      index,
      proofHex,
    };
  });

  return {
    merkleRoot,
    leaves: leavesResult,
  };
}

/**
 * Recomputes the Merkle root given a leaf hash, directional proof, and index.
 * Matches on-chain Rust `recompute()` verification logic in `programs/payout_settlement`.
 * 
 * Directional Logic:
 * is_left = (index >> depth) & 1 == 0
 * if is_left:  parent = keccak256(current || sibling)
 * else:        parent = keccak256(sibling || current)
 * 
 * @param leafHashHex - 64-char hexadecimal leaf hash
 * @param proofHex - Array of 64-char hexadecimal sibling hashes
 * @param index - Index of the leaf in the tree
 * @returns Recomputed 64-character hexadecimal Merkle root
 */
export function recomputeMerkleRoot(
  leafHashHex: string,
  proofHex: string[],
  index: number
): string {
  let current = hexToBytes(leafHashHex);

  for (let d = 0; d < proofHex.length; d++) {
    const sibling = hexToBytes(proofHex[d]!);
    const isLeft = ((index >> d) & 1) === 0;

    const parentPreimage = isLeft
      ? concatUint8Arrays([current, sibling])
      : concatUint8Arrays([sibling, current]);

    current = keccak_256(parentPreimage);
  }

  return bytesToHex(current);
}

/**
 * =========================================================================================
 * 📦 147-BYTE CANONICAL SNAPSHOT PREIMAGE LAYOUT (ASCII BITMAP)
 * =========================================================================================
 * 
 *  Byte Range | Field Name        | Type           | Encoding / Endianness
 * ────────────┼───────────────────┼────────────────┼─────────────────────────────────────────
 *  [000..017) | SNAPSHOT_DOMAIN   | 17 bytes ASCII | "brids:snapshot:v1" (No null term)
 *  [017..021) | snapshotVersion   | 4 bytes (u32)  | Little-Endian
 *  [021..037) | runId             | 16 bytes raw   | RFC-4122 Canonical UUID (Big-Endian)
 *  [037..069) | merkleRoot        | 32 bytes raw   | Raw Merkle Root Hash
 *  [069..077) | totalAmountMinor  | 8 bytes (u64)  | Little-Endian Unsigned 64-bit Integer
 *  [077..081) | itemCount         | 4 bytes (u32)  | Little-Endian Unsigned 32-bit Integer
 *  [081..083) | rulesVersion      | 2 bytes (u16)  | Little-Endian Unsigned 16-bit Integer
 *  [083..115) | mint              | 32 bytes raw   | Solana Pubkey (USDC Mint)
 *  [115..147) | tokenProgram      | 32 bytes raw   | Solana Pubkey (SPL Token Program)
 * ────────────┴───────────────────┴────────────────┴─────────────────────────────────────────
 *  Total: Exactly 147 Bytes Preimage -> Keccak-256 -> 32 Bytes Snapshot Hash
 * 
 * Computes the 147-byte canonical snapshot hash for independent dual Ed25519 attestation.
 * 
 * @param input - Snapshot hash input parameters
 * @returns 64-character hexadecimal Keccak-256 snapshot hash
 */
export function computeSnapshotHash(input: SnapshotHashInput): string {
  // Step 1: Decode binary components
  const runIdBytes = parseUuidTo16Bytes(input.runId, "runId");
  const merkleRootBytes = hexToBytes(input.merkleRoot);
  const mintBytes = parsePubkeyTo32Bytes(input.mint);
  const tokenProgramBytes = parsePubkeyTo32Bytes(input.tokenProgram);

  // Step 2: Encode Little-Endian integers
  const vBuffer = new Uint8Array(4);
  new DataView(vBuffer.buffer).setUint32(0, input.snapshotVersion, true);

  const amountBuffer = new Uint8Array(8);
  new DataView(amountBuffer.buffer).setBigUint64(0, BigInt(input.totalAmountMinor), true);

  const countBuffer = new Uint8Array(4);
  new DataView(countBuffer.buffer).setUint32(0, input.itemCount, true);

  const rulesBuffer = new Uint8Array(2);
  new DataView(rulesBuffer.buffer).setUint16(0, input.rulesVersion, true);

  // Step 3: Concatenate into exact 147-byte preimage
  const preimage = concatUint8Arrays([
    SNAPSHOT_DOMAIN,    // [000..017) - 17 bytes
    vBuffer,            // [017..021) - 4 bytes
    runIdBytes,         // [021..037) - 16 bytes
    merkleRootBytes,    // [037..069) - 32 bytes
    amountBuffer,       // [069..077) - 8 bytes
    countBuffer,        // [077..081) - 4 bytes
    rulesBuffer,        // [081..083) - 2 bytes
    mintBytes,          // [083..115) - 32 bytes
    tokenProgramBytes,  // [115..147) - 32 bytes
  ]);

  if (preimage.length !== 147) {
    throw new Error(`Snapshot preimage length mismatch: expected 147, got ${preimage.length}`);
  }

  // Step 4: Return Keccak-256 hash
  const hash = keccak_256(preimage);
  return bytesToHex(hash);
}

