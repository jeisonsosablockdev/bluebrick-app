import { describe, it, expect } from "vitest";
import {
  encodePayoutLeafPreimage,
  hashPayoutLeaf,
  buildPayoutMerkleTree,
  recomputeMerkleRoot
} from "@/features/staking-distribution/domain/payout-leaf";

/**
 * =========================================================================================
 * 🧪 SPEC-01 (STORY-015-05): CRYPTOGRAPHIC MERKLE TREE VERIFIER TESTS
 * =========================================================================================
 * 
 * Verifies domain invariants:
 * 1. 191-byte canonical leaf preimage encoding.
 * 2. Strict tampering detection: 1 single cent variation breaks root and proof verification.
 * 3. Directional sibling proof verification via recomputeMerkleRoot.
 * 4. Deterministic 32-byte Merkle root generation over large datasets (1,000 leaves).
 * 5. Single leaf edge case.
 */

describe("SPEC-01 (STORY-015-05): Merkle Tree Cryptographic Verifier", () => {
  const sampleRunId = "550e8400-e29b-41d4-a716-446655440000";
  const sampleMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const sampleTokenProgram = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  const sampleWallet = "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd";
  const sampleAta = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

  it("should encode exactly 191 bytes for canonical leaf preimage", () => {
    const preimage = encodePayoutLeafPreimage({
      runId: sampleRunId,
      claimId: "00000000-0000-4000-8000-000000000001",
      mint: sampleMint,
      tokenProgram: sampleTokenProgram,
      recipientWallet: sampleWallet,
      recipientAta: sampleAta,
      amountMinor: 150000000n // 150.00 USDC
    });

    expect(preimage.length).toBe(191);
  });

  it("should reject proof verification if 1 single cent in amount is tampered", () => {
    const items = [
      {
        runId: sampleRunId,
        claimId: "00000000-0000-4000-8000-000000000001",
        mint: sampleMint,
        tokenProgram: sampleTokenProgram,
        recipientWallet: sampleWallet,
        recipientAta: sampleAta,
        amountMinor: 100000000n // 100.00 USDC
      },
      {
        runId: sampleRunId,
        claimId: "00000000-0000-4000-8000-000000000002",
        mint: sampleMint,
        tokenProgram: sampleTokenProgram,
        recipientWallet: sampleWallet,
        recipientAta: sampleAta,
        amountMinor: 200000000n // 200.00 USDC
      }
    ];

    const tree = buildPayoutMerkleTree(items);
    const leaf0 = tree.leaves[0]!;

    // Valid proof recomputes to the exact root
    const validRoot = recomputeMerkleRoot(leaf0.leafHash, leaf0.proofHex, leaf0.index);
    expect(validRoot).toBe(tree.merkleRoot);

    // Tampered leaf (amount altered by 1 cent: 100.01 USDC)
    const tamperedLeafHash = hashPayoutLeaf({
      ...items[0]!,
      amountMinor: 100010000n
    });

    const tamperedRoot = recomputeMerkleRoot(tamperedLeafHash, leaf0.proofHex, leaf0.index);
    expect(tamperedRoot).not.toBe(tree.merkleRoot);
  });

  it("should generate deterministic 32-byte Merkle root across 1,000 items", () => {
    const largeSet = Array.from({ length: 1000 }, (_, i) => {
      const claimIdHex = (i + 1).toString(16).padStart(32, "0");
      const claimId = `${claimIdHex.slice(0, 8)}-${claimIdHex.slice(8, 12)}-${claimIdHex.slice(12, 16)}-${claimIdHex.slice(16, 20)}-${claimIdHex.slice(20, 32)}`;
      return {
        runId: sampleRunId,
        claimId,
        mint: sampleMint,
        tokenProgram: sampleTokenProgram,
        recipientWallet: sampleWallet,
        recipientAta: sampleAta,
        amountMinor: BigInt(i + 1) * 1000000n
      };
    });

    const tree1 = buildPayoutMerkleTree(largeSet);
    const tree2 = buildPayoutMerkleTree(largeSet);

    expect(tree1.merkleRoot.length).toBe(64); // 64 hex chars = 32 bytes
    expect(tree1.merkleRoot).toBe(tree2.merkleRoot);

    // Verify first, middle, and last proofs
    const indicesToVerify = [0, 499, 999];
    for (const idx of indicesToVerify) {
      const leaf = tree1.leaves[idx]!;
      const recomputed = recomputeMerkleRoot(leaf.leafHash, leaf.proofHex, leaf.index);
      expect(recomputed).toBe(tree1.merkleRoot);
    }
  });

  it("should handle single leaf edge case with minimum depth 1 and zero-padded sibling", () => {
    const singleItem = [
      {
        runId: sampleRunId,
        claimId: "00000000-0000-4000-8000-000000000001",
        mint: sampleMint,
        tokenProgram: sampleTokenProgram,
        recipientWallet: sampleWallet,
        recipientAta: sampleAta,
        amountMinor: 50000000n
      }
    ];

    const tree = buildPayoutMerkleTree(singleItem);
    const leaf = tree.leaves[0]!;
    expect(leaf.proofHex.length).toBe(1);
    expect(leaf.proofHex[0]).toBe("0".repeat(64)); // 32 zero bytes in hex

    const recomputed = recomputeMerkleRoot(leaf.leafHash, leaf.proofHex, leaf.index);
    expect(recomputed).toBe(tree.merkleRoot);
  });
});
