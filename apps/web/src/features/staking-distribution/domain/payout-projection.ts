/**
 * Layer 3: Domain / Staking Distribution & Treasury
 * Module: payout-projection
 * 
 * =========================================================================================
 * 🏛️ ARCHITECTURAL ROLE & DOMAIN RULES
 * =========================================================================================
 * This module contains pure domain computations for projecting the real-time progress
 * of a PayoutRun, filtering unsettled leaves, and batching claims for cranking execution.
 * 
 * Invariants:
 * 1. Zero External Dependencies: No RPC calls, no database access, no framework dependencies.
 * 2. Immutable Data: All functions operate as pure transformations without mutating inputs.
 * 3. Exact Precision: Computes minor unit balances with BigInt to prevent precision loss.
 * 
 * @spec EPIC-015-SOLUTION-ARCHITECTURE §Settlement Cranker & Payout Run Lifecycle
 * @spec STORY-015-01-SPEC-07
 */

/**
 * Summary representation of an individual claim item in a PayoutRun.
 */
export interface PayoutClaimSummary {
  claimId: string;
  recipientWallet: string;
  recipientAta: string;
  amountMinor: bigint;
  index: number;
  proofHex: string[];
}

/**
 * Summary representation of an on-chain ClaimReceipt PDA.
 */
export interface ClaimReceiptSummary {
  claimId: string;
  settledAt: number;
}

/**
 * Projected progress metrics for a PayoutRun.
 */
export interface PayoutRunProgressMetrics {
  totalCount: number;
  settledCount: number;
  pendingCount: number;
  totalAmountMinor: bigint;
  settledAmountMinor: bigint;
  pendingAmountMinor: bigint;
  progressPercentage: number;
  isFullySettled: boolean;
}

/**
 * Computes deterministic progress metrics by comparing committed claims against on-chain ClaimReceipts.
 * 
 * Step-by-Step Logic:
 * // Step 1: Build a Set of settled claim IDs for O(1) lookup.
 * // Step 2: Accumulate total and settled amounts and counts using BigInt arithmetic.
 * // Step 3: Compute progress percentage and completion status.
 * 
 * @param claims - All committed claim items in the PayoutRun
 * @param receipts - All existing on-chain ClaimReceipts for this run
 * @returns Real-time PayoutRunProgressMetrics
 */
export function computePayoutRunProgress(
  claims: PayoutClaimSummary[],
  receipts: ClaimReceiptSummary[]
): PayoutRunProgressMetrics {
  // Step 1: Index settled claim IDs
  const settledIds = new Set(receipts.map((r) => r.claimId));

  let totalAmountMinor = 0n;
  let settledAmountMinor = 0n;
  let settledCount = 0;

  // Step 2: Accumulate values
  for (const claim of claims) {
    totalAmountMinor += claim.amountMinor;
    if (settledIds.has(claim.claimId)) {
      settledCount += 1;
      settledAmountMinor += claim.amountMinor;
    }
  }

  const totalCount = claims.length;
  const pendingCount = totalCount - settledCount;
  const pendingAmountMinor = totalAmountMinor - settledAmountMinor;

  // Step 3: Compute percentage
  const progressPercentage =
    totalCount > 0 ? (settledCount / totalCount) * 100 : 100;
  const isFullySettled = totalCount > 0 && settledCount === totalCount;

  return {
    totalCount,
    settledCount,
    pendingCount,
    totalAmountMinor,
    settledAmountMinor,
    pendingAmountMinor,
    progressPercentage,
    isFullySettled,
  };
}

/**
 * Filters a list of claims, returning only those that have not yet been settled on-chain.
 * 
 * Invariant: Guarantees idempotency by discarding leaves whose ClaimReceipt PDA already exists.
 * 
 * @param claims - Full list of claims
 * @param settledClaimIds - Set of claimId UUID strings that already have a ClaimReceipt
 * @returns Array of pending PayoutClaimSummary items
 */
export function filterUnsettledClaims(
  claims: PayoutClaimSummary[],
  settledClaimIds: Set<string>
): PayoutClaimSummary[] {
  return claims.filter((claim) => !settledClaimIds.has(claim.claimId));
}

/**
 * Partitions a list of claims into fixed-size batches for safe multi-instruction transaction execution.
 * 
 * @param claims - Array of claims to batch
 * @param batchSize - Maximum number of claims per batch (e.g., 4 to 6 per Solana tx)
 * @returns Array of claim batches
 */
export function batchClaimsForCranking(
  claims: PayoutClaimSummary[],
  batchSize: number
): PayoutClaimSummary[][] {
  if (batchSize <= 0 || claims.length === 0) {
    return [];
  }

  const batches: PayoutClaimSummary[][] = [];
  for (let i = 0; i < claims.length; i += batchSize) {
    batches.push(claims.slice(i, i + batchSize));
  }

  return batches;
}
