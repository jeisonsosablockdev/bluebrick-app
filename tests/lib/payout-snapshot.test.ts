import { describe, it, expect } from 'vitest';
import fixture from '../fixtures/payout-settlement-v1.json';

// Import domain functions from the canonical FDD Layer 3 Domain path
import {
  encodePayoutLeafPreimage,
  hashPayoutLeaf,
  buildPayoutMerkleTree,
  recomputeMerkleRoot,
  computeSnapshotHash,
  type PayoutClaimItemInput,
} from '../../apps/web/src/features/staking-distribution/domain/payout-leaf';

/**
 * SPEC-01 TDD Suite — EPIC-015 Payout Settlement Codec & Merkle Tree Engine
 * 
 * @spec EPIC-015-SOLUTION-ARCHITECTURE §Canonical Codec
 * @spec STORY-015-01-SPEC-01
 */
describe('EPIC-015 Payout Snapshot & Merkle Codec (@spec EPIC-015-CODEC-V1)', () => {
  describe('A. 191-Byte Leaf Encoding & Hashing (@spec EPIC-015-CODEC-LEAF)', () => {
    it('should encode a payout leaf into exactly 191 bytes preimage matching golden fixture', () => {
      // Arrange
      const leafFixture = fixture.leaves[0];
      const itemInput: PayoutClaimItemInput = {
        runId: fixture.runId,
        claimId: leafFixture.claimId,
        mint: fixture.mint,
        tokenProgram: fixture.tokenProgram,
        recipientWallet: leafFixture.recipientWallet,
        recipientAta: leafFixture.recipientAta,
        amountMinor: BigInt(leafFixture.amountMinor),
      };

      // Act
      const preimage = encodePayoutLeafPreimage(itemInput);

      // Assert
      expect(preimage).toBeInstanceOf(Uint8Array);
      expect(preimage.length).toBe(191);
      expect(Buffer.from(preimage).toString('hex')).toBe(leafFixture.preimageHex);
    });

    it('should compute Keccak-256 leaf hash matching golden fixture', () => {
      // Arrange
      const leafFixture = fixture.leaves[0];
      const itemInput: PayoutClaimItemInput = {
        runId: fixture.runId,
        claimId: leafFixture.claimId,
        mint: fixture.mint,
        tokenProgram: fixture.tokenProgram,
        recipientWallet: leafFixture.recipientWallet,
        recipientAta: leafFixture.recipientAta,
        amountMinor: BigInt(leafFixture.amountMinor),
      };

      // Act
      const leafHashHex = hashPayoutLeaf(itemInput);

      // Assert
      expect(leafHashHex).toBe(leafFixture.leafHash);
    });

    it('should reject non-canonical UUIDs for runId or claimId (not RFC-4122 canonical)', () => {
      // Arrange
      const invalidItem: PayoutClaimItemInput = {
        runId: 'invalid-uuid-format',
        claimId: '00000000-0000-4000-8000-000000000001',
        mint: fixture.mint,
        tokenProgram: fixture.tokenProgram,
        recipientWallet: fixture.leaves[0].recipientWallet,
        recipientAta: fixture.leaves[0].recipientAta,
        amountMinor: 1000000n,
      };

      // Act & Assert
      expect(() => encodePayoutLeafPreimage(invalidItem)).toThrow(/UUID/i);
    });
  });

  describe('B. Helium Directional Merkle Tree Construction (@spec EPIC-015-CODEC-MERKLE)', () => {
    it('should build Merkle tree for 1 leaf (itemCount=1) with EMPTY padding sibling matching fixture', () => {
      // Arrange
      const leaf0 = fixture.leaves[0];
      const items: PayoutClaimItemInput[] = [
        {
          runId: fixture.runId,
          claimId: leaf0.claimId,
          mint: fixture.mint,
          tokenProgram: fixture.tokenProgram,
          recipientWallet: leaf0.recipientWallet,
          recipientAta: leaf0.recipientAta,
          amountMinor: BigInt(leaf0.amountMinor),
        },
      ];

      // Act
      const tree = buildPayoutMerkleTree(items);
      const caseFixture = fixture.treeCases.find(c => c.itemCount === 1)!;

      // Assert
      expect(tree.merkleRoot).toBe(caseFixture.root);
      expect(tree.leaves.length).toBe(1);
      expect(tree.leaves[0].proofHex).toEqual(caseFixture.firstLeafProofHex);
    });

    it('should build Merkle tree for 2 leaves (itemCount=2) matching fixture', () => {
      // Arrange
      const items: PayoutClaimItemInput[] = fixture.leaves.slice(0, 2).map(l => ({
        runId: fixture.runId,
        claimId: l.claimId,
        mint: fixture.mint,
        tokenProgram: fixture.tokenProgram,
        recipientWallet: l.recipientWallet,
        recipientAta: l.recipientAta,
        amountMinor: BigInt(l.amountMinor),
      }));

      // Act
      const tree = buildPayoutMerkleTree(items);
      const caseFixture = fixture.treeCases.find(c => c.itemCount === 2)!;

      // Assert
      expect(tree.merkleRoot).toBe(caseFixture.root);
      expect(tree.leaves.length).toBe(2);
      expect(tree.leaves[0].proofHex).toEqual(caseFixture.firstLeafProofHex);
    });

    it('should build Merkle tree for 3 leaves (itemCount=3) with EMPTY padding matching fixture', () => {
      // Arrange
      const items: PayoutClaimItemInput[] = fixture.leaves.map(l => ({
        runId: fixture.runId,
        claimId: l.claimId,
        mint: fixture.mint,
        tokenProgram: fixture.tokenProgram,
        recipientWallet: l.recipientWallet,
        recipientAta: l.recipientAta,
        amountMinor: BigInt(l.amountMinor),
      }));

      // Act
      const tree = buildPayoutMerkleTree(items);

      // Assert
      expect(tree.merkleRoot).toBe(fixture.merkleRoot);
      expect(tree.leaves.length).toBe(3);
      expect(tree.leaves[0].proofHex).toEqual(fixture.leaves[0].proofHex);
      expect(tree.leaves[1].proofHex).toEqual(fixture.leaves[1].proofHex);
      expect(tree.leaves[2].proofHex).toEqual(fixture.leaves[2].proofHex);
    });

    it('should verify proof recomputation against root using index-based direction', () => {
      // Arrange
      const leaf0 = fixture.leaves[0];

      // Act
      const recomputedRoot = recomputeMerkleRoot(
        leaf0.leafHash,
        leaf0.proofHex,
        leaf0.index
      );

      // Assert
      expect(recomputedRoot).toBe(fixture.merkleRoot);
    });

    it('should sort leaves strictly by binary claimId before building tree', () => {
      // Arrange — pass items in reverse order
      const itemsUnsorted: PayoutClaimItemInput[] = fixture.leaves.slice().reverse().map(l => ({
        runId: fixture.runId,
        claimId: l.claimId,
        mint: fixture.mint,
        tokenProgram: fixture.tokenProgram,
        recipientWallet: l.recipientWallet,
        recipientAta: l.recipientAta,
        amountMinor: BigInt(l.amountMinor),
      }));

      // Act
      const tree = buildPayoutMerkleTree(itemsUnsorted);

      // Assert
      expect(tree.merkleRoot).toBe(fixture.merkleRoot);
      expect(tree.leaves[0].claimId).toBe(fixture.leaves[0].claimId);
    });

    it('should reject duplicate claimIds in the same snapshot', () => {
      // Arrange
      const leaf0 = fixture.leaves[0];
      const itemsDuplicate: PayoutClaimItemInput[] = [
        {
          runId: fixture.runId,
          claimId: leaf0.claimId,
          mint: fixture.mint,
          tokenProgram: fixture.tokenProgram,
          recipientWallet: leaf0.recipientWallet,
          recipientAta: leaf0.recipientAta,
          amountMinor: BigInt(leaf0.amountMinor),
        },
        {
          runId: fixture.runId,
          claimId: leaf0.claimId, // duplicate
          mint: fixture.mint,
          tokenProgram: fixture.tokenProgram,
          recipientWallet: leaf0.recipientWallet,
          recipientAta: leaf0.recipientAta,
          amountMinor: BigInt(leaf0.amountMinor),
        },
      ];

      // Act & Assert
      expect(() => buildPayoutMerkleTree(itemsDuplicate)).toThrow(/duplicate/i);
    });
  });

  describe('C. 147-Byte SnapshotHash Calculation (@spec EPIC-015-CODEC-SNAPSHOT-HASH)', () => {
    it('should compute 147-byte snapshotHash matching golden fixture', () => {
      // Arrange
      const snapshotParams = {
        snapshotVersion: fixture.snapshotVersion,
        runId: fixture.runId,
        merkleRoot: fixture.merkleRoot,
        totalAmountMinor: BigInt(fixture.totalAmountMinor),
        itemCount: fixture.itemCount,
        rulesVersion: fixture.rulesVersion,
        mint: fixture.mint,
        tokenProgram: fixture.tokenProgram,
      };

      // Act
      const snapshotHashHex = computeSnapshotHash(snapshotParams);

      // Assert
      expect(snapshotHashHex).toBe(fixture.snapshotHash);
    });
  });
});
