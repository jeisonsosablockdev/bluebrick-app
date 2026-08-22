/**
 * =========================================================================================
 * Layer 3: Domain Layer — Merkle Tree Cryptographic Verifier & Audit Pipeline
 * Description: Pure domain operations for constructing, validating, and recalculating
 *              Helium-compatible Merkle trees for Solana Payout Settlement runs.
 * Security Invariants:
 * - Consumes the single canonical 191-byte leaf codec from payout-leaf.ts (zero code duplication).
 * - Enforces Keccak-256 binary sibling hashing with index-based directional bit checking.
 * - Zero external I/O: no database, RPC, or network dependencies.
 * =========================================================================================
 */

import {
  buildPayoutMerkleTree,
  computeSnapshotHash,
  hashPayoutLeaf,
  recomputeMerkleRoot,
  type PayoutClaimItemInput,
  type PayoutMerkleLeafResult,
  type PayoutMerkleTreeResult,
  type SnapshotHashInput
} from "@/features/staking-distribution/domain/payout-leaf";

export type {
  PayoutClaimItemInput,
  PayoutMerkleLeafResult,
  PayoutMerkleTreeResult,
  SnapshotHashInput
};

/**
 * Builds a canonical Merkle tree from an array of payout claim inputs.
 * What: Computes the on-chain Merkle root and per-leaf directional proofs.
 * How: Sorts items by claimId, applies 191-byte preimage encoding, and executes Helium Keccak-256 tree hashing.
 */
export function generatePayoutMerkleTree(items: PayoutClaimItemInput[]): PayoutMerkleTreeResult {
  return buildPayoutMerkleTree(items);
}

/**
 * Verifies whether a given claim leaf hash and directional proof match the committed Merkle root.
 * What: Validates cryptographic membership of a payout claim in the tree.
 * How: Recomputes the root using sibling hashes and compares against the expected root hex.
 */
export function verifyClaimMerkleProof(
  leafHashHex: string,
  proofHex: string[],
  expectedRootHex: string,
  index: number
): boolean {
  try {
    const recomputed = recomputeMerkleRoot(leafHashHex, proofHex, index);
    return recomputed.toLowerCase() === expectedRootHex.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Verifies the integrity of a 147-byte snapshot attestation hash.
 * What: Validates that snapshot parameters match the expected attestation hash.
 * How: Computes canonical snapshot hash and compares with expected value.
 */
export function verifySnapshotPreimage(
  input: SnapshotHashInput,
  expectedSnapshotHashHex: string
): boolean {
  try {
    const calculated = computeSnapshotHash(input);
    return calculated.toLowerCase() === expectedSnapshotHashHex.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Recalculates Merkle tree after filtering out vetoed claim items (pre-seal only).
 * What: Generates updated root and proofs excluding vetoed leaves.
 * How: Filters items by vetoedClaimIds set, asserts remaining non-empty set, and rebuilds tree.
 */
export function recalculateTreeExcludingVetoedItems(
  items: PayoutClaimItemInput[],
  vetoedClaimIds: Set<string>
): PayoutMerkleTreeResult {
  // Step 1: Filter out items whose claimId is present in the veto set
  const filtered = items.filter((item) => !vetoedClaimIds.has(item.claimId.toLowerCase()));

  if (filtered.length === 0) {
    throw new Error("Cannot recalculate Merkle tree: all items were vetoed.");
  }

  // Step 2: Rebuild Merkle tree with remaining active leaves
  return buildPayoutMerkleTree(filtered);
}

/**
 * Computes 32-byte leaf hash for an individual claim item.
 * What: Hashes 191-byte canonical preimage.
 * How: Invokes hashPayoutLeaf from canonical codec.
 */
export function computeClaimLeafHash(input: PayoutClaimItemInput): string {
  return hashPayoutLeaf(input);
}
