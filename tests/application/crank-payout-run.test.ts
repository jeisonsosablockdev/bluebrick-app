import { describe, it, expect } from 'vitest';
import { address } from '@solana/kit';
import fixture from '../fixtures/payout-settlement-v1.json';
import {
  computePayoutRunProgress,
  filterUnsettledClaims,
  batchClaimsForCranking,
  type PayoutClaimSummary,
  type ClaimReceiptSummary,
} from '../../apps/web/src/features/staking-distribution/domain/payout-projection';
import {
  planCrankExecution,
  encodeSettleClaimInstruction,
  SETTLE_CLAIM_DISCRIMINATOR,
  type SettleClaimInstructionParams,
} from '../../apps/web/src/features/staking-distribution/application/crank-payout-run';

/**
 * =========================================================================================
 * 🛡️ SPEC-07 TDD SUITE — SETTLEMENT CRANKER & RECEIPT PROJECTION ENGINE
 * =========================================================================================
 * 
 * Scope:
 * 1. PayoutRun Progress Metrics (Domain Projection):
 *    - settledCount, pendingCount, settledAmountMinor, pendingAmountMinor, progressPercentage.
 * 2. Unsettled Claims Filtering (Idempotency):
 *    - Prevents resubmitting already settled ClaimReceipt PDAs.
 * 3. Batching Engine:
 *    - Splits large claim runs into transaction-safe batches.
 * 4. Anchor Instruction Encoding for settle_claim:
 *    - Matches 8-byte discriminator sha256("global:settle_claim")[0..8].
 *    - Encodes 191B leaf reconstruction parameters and Merkle proof path.
 * 
 * @spec EPIC-015-SOLUTION-ARCHITECTURE §Settlement Cranker & Payout Run Lifecycle
 * @spec STORY-015-01-SPEC-07
 */
describe('SPEC-07 Settlement Cranker & Receipt Projection (@spec SPEC-015-CRANKER-PROJECTION)', () => {
  const DEPLOYED_PROGRAM_ID = address('HLp7YXKZZ8uPuzwN3CtuDxtgYoWhc5Fb1FHj5bHEe9zE');

  const claims: PayoutClaimSummary[] = fixture.leaves.map((l) => ({
    claimId: l.claimId,
    recipientWallet: l.recipientWallet,
    recipientAta: l.recipientAta,
    amountMinor: BigInt(l.amountMinor),
    index: l.index,
    proofHex: l.proofHex,
  }));

  describe('A. Domain Projection & Progress Metrics (@spec SPEC-015-PROJECTION-METRICS)', () => {
    it('should compute 0% progress when no receipts exist', () => {
      // Act
      const metrics = computePayoutRunProgress(claims, []);

      // Assert
      expect(metrics.totalCount).toBe(3);
      expect(metrics.settledCount).toBe(0);
      expect(metrics.pendingCount).toBe(3);
      expect(metrics.totalAmountMinor).toBe(7000000n);
      expect(metrics.settledAmountMinor).toBe(0n);
      expect(metrics.pendingAmountMinor).toBe(7000000n);
      expect(metrics.progressPercentage).toBe(0);
      expect(metrics.isFullySettled).toBe(false);
    });

    it('should compute partial progress when leaf 0 is settled', () => {
      // Arrange
      const receipts: ClaimReceiptSummary[] = [
        {
          claimId: claims[0].claimId,
          settledAt: 1724200000,
        },
      ];

      // Act
      const metrics = computePayoutRunProgress(claims, receipts);

      // Assert
      expect(metrics.settledCount).toBe(1);
      expect(metrics.pendingCount).toBe(2);
      expect(metrics.settledAmountMinor).toBe(1000000n);
      expect(metrics.pendingAmountMinor).toBe(6000000n);
      expect(metrics.progressPercentage).toBeCloseTo(33.33, 1);
      expect(metrics.isFullySettled).toBe(false);
    });

    it('should compute 100% progress when all leaves are settled', () => {
      // Arrange
      const receipts: ClaimReceiptSummary[] = claims.map((c) => ({
        claimId: c.claimId,
        settledAt: 1724200000,
      }));

      // Act
      const metrics = computePayoutRunProgress(claims, receipts);

      // Assert
      expect(metrics.settledCount).toBe(3);
      expect(metrics.pendingCount).toBe(0);
      expect(metrics.settledAmountMinor).toBe(7000000n);
      expect(metrics.pendingAmountMinor).toBe(0n);
      expect(metrics.progressPercentage).toBe(100);
      expect(metrics.isFullySettled).toBe(true);
    });
  });

  describe('B. Filtering Unsettled Claims & Batching Engine (@spec SPEC-015-CRANK-BATCHING)', () => {
    it('should filter out already settled claims from cranking queue', () => {
      // Arrange
      const settledIds = new Set([claims[0].claimId]);

      // Act
      const unsettled = filterUnsettledClaims(claims, settledIds);

      // Assert
      expect(unsettled.length).toBe(2);
      expect(unsettled.map((u) => u.claimId)).toEqual([
        claims[1].claimId,
        claims[2].claimId,
      ]);
    });

    it('should batch claims into chunks respecting batchSize', () => {
      // Act
      const batches = batchClaimsForCranking(claims, 2);

      // Assert
      expect(batches.length).toBe(2);
      expect(batches[0].length).toBe(2);
      expect(batches[1].length).toBe(1);
    });

    it('should handle empty claims array gracefully', () => {
      const batches = batchClaimsForCranking([], 5);
      expect(batches).toEqual([]);
    });
  });

  describe('C. Anchor settle_claim Instruction Encoding (@spec SPEC-015-SETTLE-INSTRUCTION-ENCODING)', () => {
    it('should match canonical 8-byte discriminator for settle_claim', () => {
      // Discriminator = sha256("global:settle_claim")[0..8]
      expect(SETTLE_CLAIM_DISCRIMINATOR.length).toBe(8);
      expect(Buffer.from(SETTLE_CLAIM_DISCRIMINATOR).toString('hex')).toBe(
        '50efef1d768605fa'
      );
    });

    it('should encode settle_claim instruction data with proof array', async () => {
      // Arrange
      const leaf0 = fixture.leaves[0];
      const params: SettleClaimInstructionParams = {
        settlementProgramId: DEPLOYED_PROGRAM_ID,
        runId: fixture.runId,
        claimId: leaf0.claimId,
        amountMinor: BigInt(leaf0.amountMinor),
        leafIndex: leaf0.index,
        merkleProofHex: leaf0.proofHex,
        escrowAta: 'H1AviagU5Y17z77v1F9qZPJ9kCbCsL4ewiZABNfGYoRs',
        recipientWallet: leaf0.recipientWallet,
        recipientAta: leaf0.recipientAta,
        mint: fixture.mint,
        payer: leaf0.recipientWallet,
      };

      // Act
      const ix = await encodeSettleClaimInstruction(params);

      // Assert
      expect(ix.programAddress).toBe(DEPLOYED_PROGRAM_ID);
      expect(ix.accounts.length).toBe(9);
      // Data contains: 8B discriminator + 16B claim_id + 8B amount + 4B leaf_index + 4B proof_len + (2 * 32B proof)
      expect(ix.data.length).toBe(8 + 16 + 8 + 4 + 4 + (2 * 32));
    });
  });

  describe('D. Execution Planner Idempotency (@spec SPEC-015-PLAN-CRANK)', () => {
    it('should plan execution batches only for pending claims', async () => {
      // Arrange: Leaf 0 and 1 settled, only leaf 2 pending
      const existingReceipts = new Set([claims[0].claimId, claims[1].claimId]);

      // Act
      const plan = await planCrankExecution({
        settlementProgramId: DEPLOYED_PROGRAM_ID,
        runId: fixture.runId,
        mint: fixture.mint,
        escrowAta: 'H1AviagU5Y17z77v1F9qZPJ9kCbCsL4ewiZABNfGYoRs',
        payer: claims[0].recipientWallet,
        claims,
        settledClaimIds: existingReceipts,
        batchSize: 5,
      });

      // Assert
      expect(plan.totalClaims).toBe(3);
      expect(plan.settledCount).toBe(2);
      expect(plan.pendingCount).toBe(1);
      expect(plan.batches.length).toBe(1);
      expect(plan.batches[0].instructions.length).toBe(1);
    });

    it('should return 0 batches if all claims are already settled', async () => {
      const allSettled = new Set(claims.map((c) => c.claimId));

      const plan = await planCrankExecution({
        settlementProgramId: DEPLOYED_PROGRAM_ID,
        runId: fixture.runId,
        mint: fixture.mint,
        escrowAta: 'H1AviagU5Y17z77v1F9qZPJ9kCbCsL4ewiZABNfGYoRs',
        payer: claims[0].recipientWallet,
        claims,
        settledClaimIds: allSettled,
        batchSize: 5,
      });

      expect(plan.pendingCount).toBe(0);
      expect(plan.batches.length).toBe(0);
    });
  });
});
