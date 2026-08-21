import { address, getAddressEncoder } from "@solana/kit";
import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

/**
 * Payout Leaf & Merkle Tree Domain Engine — EPIC-015 Canonical Codec
 * 
 * Implements the 191-byte leaf encoding, Keccak-256 Merkle tree (Helium directional format),
 * and 147-byte snapshotHash. Zero external dependencies beyond @solana/kit and @noble/hashes.
 * 
 * @spec EPIC-015-SOLUTION-ARCHITECTURE §Canonical Codec
 */

export interface PayoutClaimItemInput {
  runId: string;
  claimId: string;
  mint: string;
  tokenProgram: string;
  recipientWallet: string;
  recipientAta: string;
  amountMinor: bigint;
}

export interface PayoutMerkleLeafResult {
  claimId: string;
  leafHash: string;
  index: number;
  proofHex: string[];
}

export interface PayoutMerkleTreeResult {
  merkleRoot: string;
  leaves: PayoutMerkleLeafResult[];
}

export interface SnapshotHashInput {
  snapshotVersion: number;
  runId: string;
  merkleRoot: string;
  totalAmountMinor: bigint;
  itemCount: number;
  rulesVersion: number;
  mint: string;
  tokenProgram: string;
}

const LEAF_DOMAIN = new TextEncoder().encode("brids:epic015:payout:v1"); // 23 bytes
const SNAPSHOT_DOMAIN = new TextEncoder().encode("brids:snapshot:v1"); // 17 bytes
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMPTY_NODE = new Uint8Array(32);

/**
 * Validates canonical RFC-4122 UUID and converts it to 16 bytes big-endian.
 */
function parseUuidTo16Bytes(uuidStr: string, fieldName: string): Uint8Array {
  if (!uuidStr || !UUID_REGEX.test(uuidStr)) {
    throw new Error(`Invalid RFC-4122 UUID string for ${fieldName}: "${uuidStr}"`);
  }
  const hex = uuidStr.replace(/-/g, "");
  return hexToBytes(hex);
}

/**
 * Converts a Solana public key address string to 32 raw bytes.
 */
function parsePubkeyTo32Bytes(pubkeyStr: string): Uint8Array {
  if (typeof pubkeyStr === "string" && /^[0-9a-f]{64}$/i.test(pubkeyStr)) {
    return hexToBytes(pubkeyStr);
  }
  const addr = address(pubkeyStr);
  return getAddressEncoder().encode(addr);
}

/**
 * Helper to concatenate multiple Uint8Arrays.
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
 * Encodes a payout leaf into exactly 191 bytes preimage per canonical codec:
 * 1. LEAF_DOMAIN (23 bytes)
 * 2. runId (16 bytes UUID)
 * 3. claimId (16 bytes UUID)
 * 4. mint (32 bytes Pubkey)
 * 5. tokenProgram (32 bytes Pubkey)
 * 6. recipientWallet (32 bytes Pubkey)
 * 7. recipientAta (32 bytes Pubkey)
 * 8. amountMinor (8 bytes u64 LE)
 */
export function encodePayoutLeafPreimage(input: PayoutClaimItemInput): Uint8Array {
  const runIdBytes = parseUuidTo16Bytes(input.runId, "runId");
  const claimIdBytes = parseUuidTo16Bytes(input.claimId, "claimId");
  const mintBytes = parsePubkeyTo32Bytes(input.mint);
  const tokenProgramBytes = parsePubkeyTo32Bytes(input.tokenProgram);
  const recipientWalletBytes = parsePubkeyTo32Bytes(input.recipientWallet);
  const recipientAtaBytes = parsePubkeyTo32Bytes(input.recipientAta);

  const amountBuffer = new Uint8Array(8);
  new DataView(amountBuffer.buffer).setBigUint64(0, BigInt(input.amountMinor), true);

  return concatUint8Arrays([
    LEAF_DOMAIN,
    runIdBytes,
    claimIdBytes,
    mintBytes,
    tokenProgramBytes,
    recipientWalletBytes,
    recipientAtaBytes,
    amountBuffer,
  ]);
}

/**
 * Computes 64-character hex string of Keccak-256 hash over 191-byte leaf preimage.
 */
export function hashPayoutLeaf(input: PayoutClaimItemInput): string {
  const preimage = encodePayoutLeafPreimage(input);
  const hash = keccak_256(preimage);
  return bytesToHex(hash);
}

/**
 * Builds Helium directional Merkle tree for payout items:
 * - Items are sorted strictly by 16-byte binary claimId.
 * - Rejects duplicate claimIds.
 * - Leaves padded with EMPTY (32 zero bytes) to next power of 2.
 * - For itemCount=1, depth=1, root = keccak256(leaf || EMPTY).
 * - Sibling proof uses index-based direction: is_left = (index >> depth) & 1 == 0.
 */
export function buildPayoutMerkleTree(items: PayoutClaimItemInput[]): PayoutMerkleTreeResult {
  if (!items || items.length === 0) {
    throw new Error("Cannot build Merkle tree for empty items array");
  }

  // Sort items strictly by binary claimId (hex comparison of canonical UUID without dashes)
  const sortedItems = [...items].sort((a, b) => {
    const hexA = a.claimId.replace(/-/g, "").toLowerCase();
    const hexB = b.claimId.replace(/-/g, "").toLowerCase();
    return hexA.localeCompare(hexB);
  });

  // Check for duplicate claimIds
  const seenClaimIds = new Set<string>();
  for (const item of sortedItems) {
    const normalizedId = item.claimId.toLowerCase();
    if (seenClaimIds.has(normalizedId)) {
      throw new Error(`Duplicate claimId found in payout snapshot: "${item.claimId}"`);
    }
    seenClaimIds.add(normalizedId);
  }

  // Compute leaf hashes
  const leafNodes: Uint8Array[] = sortedItems.map((item) =>
    keccak_256(encodePayoutLeafPreimage(item))
  );

  // Depth calculation: treeDepth = max(1, Math.ceil(Math.log2(nextPowerOfTwo(itemCount))))
  const itemCount = sortedItems.length;
  let targetPower = 1;
  while (targetPower < itemCount) {
    targetPower *= 2;
  }
  // For itemCount=1, targetPower=1, but depth must be at least 1 (padded to 2 nodes: leaf + EMPTY)
  const paddedSize = Math.max(2, targetPower);
  const treeDepth = Math.round(Math.log2(paddedSize));

  // Build tree levels (level 0 = padded leaves, level depth = root)
  const levels: Uint8Array[][] = [];
  const level0: Uint8Array[] = new Array(paddedSize);
  for (let i = 0; i < paddedSize; i++) {
    level0[i] = i < itemCount ? leafNodes[i]! : EMPTY_NODE;
  }
  levels.push(level0);

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

  // Generate directional proof for each item
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
 * Recomputes Merkle root from leaf hash, directional proof, and leaf index.
 * Helium directional logic:
 * is_left = (index >> depth) & 1 == 0
 * if is_left: parent = keccak256(current || sibling)
 * else: parent = keccak256(sibling || current)
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
 * Computes 147-byte snapshotHash:
 * 1. SNAPSHOT_DOMAIN ("brids:snapshot:v1" = 17 bytes)
 * 2. snapshotVersion (u32 LE = 4 bytes)
 * 3. runId (16 bytes UUID)
 * 4. merkleRoot (32 bytes raw)
 * 5. totalAmountMinor (u64 LE = 8 bytes)
 * 6. itemCount (u32 LE = 4 bytes)
 * 7. rulesVersion (u16 LE = 2 bytes)
 * 8. mint (32 bytes Pubkey)
 * 9. tokenProgram (32 bytes Pubkey)
 */
export function computeSnapshotHash(input: SnapshotHashInput): string {
  const runIdBytes = parseUuidTo16Bytes(input.runId, "runId");
  const merkleRootBytes = hexToBytes(input.merkleRoot);
  const mintBytes = parsePubkeyTo32Bytes(input.mint);
  const tokenProgramBytes = parsePubkeyTo32Bytes(input.tokenProgram);

  const vBuffer = new Uint8Array(4);
  new DataView(vBuffer.buffer).setUint32(0, input.snapshotVersion, true);

  const amountBuffer = new Uint8Array(8);
  new DataView(amountBuffer.buffer).setBigUint64(0, BigInt(input.totalAmountMinor), true);

  const countBuffer = new Uint8Array(4);
  new DataView(countBuffer.buffer).setUint32(0, input.itemCount, true);

  const rulesBuffer = new Uint8Array(2);
  new DataView(rulesBuffer.buffer).setUint16(0, input.rulesVersion, true);

  const preimage = concatUint8Arrays([
    SNAPSHOT_DOMAIN,
    vBuffer,
    runIdBytes,
    merkleRootBytes,
    amountBuffer,
    countBuffer,
    rulesBuffer,
    mintBytes,
    tokenProgramBytes,
  ]);

  if (preimage.length !== 147) {
    throw new Error(`Snapshot preimage length mismatch: expected 147, got ${preimage.length}`);
  }

  const hash = keccak_256(preimage);
  return bytesToHex(hash);
}
