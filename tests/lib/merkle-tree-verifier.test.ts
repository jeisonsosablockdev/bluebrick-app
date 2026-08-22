import { describe, it, expect } from "vitest";
import {
  encodePayoutLeafPreimage,
  computeSnapshotHash
} from "@/features/staking-distribution/domain/payout-leaf";
import {
  generatePayoutMerkleTree,
  verifyClaimMerkleProof,
  verifySnapshotPreimage,
  recalculateTreeExcludingVetoedItems,
  computeClaimLeafHash
} from "@/features/staking-distribution/domain/merkle-tree";

/**
 * =========================================================================================
 * 🧪 SPEC-02 (STORY-015-05): CRYPTOGRAPHIC MERKLE TREE DOMAIN VERIFIER TESTS
 * =========================================================================================
 * 
 * Verifies domain invariants:
 * 1. 191-byte canonical leaf preimage encoding.
 * 2. Strict tampering detection: 1 single cent variation breaks root and proof verification.
 * 3. Directional sibling proof verification via verifyClaimMerkleProof.
 * 4. Deterministic 32-byte Merkle root generation over large datasets (1,000 leaves).
 * 5. Pre-seal recalculation excluding vetoed items.
 * 6. Snapshot attestation preimage verification via verifySnapshotPreimage.
 */

describe("SPEC-02 (STORY-015-05): Merkle Tree Cryptographic Verifier", () => {
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

    const tree = generatePayoutMerkleTree(items);
    const leaf0 = tree.leaves[0]!;

    // Valid proof verification passes
    const isValid = verifyClaimMerkleProof(leaf0.leafHash, leaf0.proofHex, tree.merkleRoot, leaf0.index);
    expect(isValid).toBe(true);

    // Tampered leaf (amount altered by 1 cent: 100.01 USDC)
    const tamperedLeafHash = computeClaimLeafHash({
      ...items[0]!,
      amountMinor: 100010000n
    });

    const isTamperedValid = verifyClaimMerkleProof(tamperedLeafHash, leaf0.proofHex, tree.merkleRoot, leaf0.index);
    expect(isTamperedValid).toBe(false);
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

    const tree1 = generatePayoutMerkleTree(largeSet);
    const tree2 = generatePayoutMerkleTree(largeSet);

    expect(tree1.merkleRoot.length).toBe(64); // 64 hex chars = 32 bytes
    expect(tree1.merkleRoot).toBe(tree2.merkleRoot);

    // Verify first, middle, and last proofs
    const indicesToVerify = [0, 499, 999];
    for (const idx of indicesToVerify) {
      const leaf = tree1.leaves[idx]!;
      expect(verifyClaimMerkleProof(leaf.leafHash, leaf.proofHex, tree1.merkleRoot, leaf.index)).toBe(true);
    }
  });

  it("should recalculate tree excluding vetoed items (pre-seal)", () => {
    const items = [
      {
        runId: sampleRunId,
        claimId: "00000000-0000-4000-8000-000000000001",
        mint: sampleMint,
        tokenProgram: sampleTokenProgram,
        recipientWallet: sampleWallet,
        recipientAta: sampleAta,
        amountMinor: 100000000n
      },
      {
        runId: sampleRunId,
        claimId: "00000000-0000-4000-8000-000000000002",
        mint: sampleMint,
        tokenProgram: sampleTokenProgram,
        recipientWallet: sampleWallet,
        recipientAta: sampleAta,
        amountMinor: 200000000n
      },
      {
        runId: sampleRunId,
        claimId: "00000000-0000-4000-8000-000000000003",
        mint: sampleMint,
        tokenProgram: sampleTokenProgram,
        recipientWallet: sampleWallet,
        recipientAta: sampleAta,
        amountMinor: 300000000n
      }
    ];

    const initialTree = generatePayoutMerkleTree(items);
    expect(initialTree.leaves.length).toBe(3);

    // Veto item 2
    const vetoSet = new Set(["00000000-0000-4000-8000-000000000002"]);
    const recalculatedTree = recalculateTreeExcludingVetoedItems(items, vetoSet);

    expect(recalculatedTree.leaves.length).toBe(2);
    expect(recalculatedTree.merkleRoot).not.toBe(initialTree.merkleRoot);
    expect(recalculatedTree.leaves.find((l) => l.claimId === "00000000-0000-4000-8000-000000000002")).toBeUndefined();
  });

  it("should verify snapshot attestation preimage integrity", () => {
    const snapshotInput = {
      snapshotVersion: 1,
      runId: sampleRunId,
      merkleRoot: "0".repeat(64),
      totalAmountMinor: 1000000000n,
      itemCount: 10,
      rulesVersion: 1,
      mint: sampleMint,
      tokenProgram: sampleTokenProgram
    };

    const hash = computeSnapshotHash(snapshotInput);
    const isValid = verifySnapshotPreimage(snapshotInput, hash);
    expect(isValid).toBe(true);

    const isInvalid = verifySnapshotPreimage(snapshotInput, "f".repeat(64));
    expect(isInvalid).toBe(false);
  });
});
