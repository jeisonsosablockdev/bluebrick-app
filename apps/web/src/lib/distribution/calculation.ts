/**
 * SPEC-S03-B (EPIC-014): Final Calculation Pipeline Orchestrator
 *
 * Orchestrates:
 * 1. Provenance asset filtering (validated assets only)
 * 2. Archival RPC interval reconstruction & window clipping
 * 3. Wallet time-weight aggregation
 * 4. Zero-pool guard check
 * 5. Hamilton largest-remainder integer allocation
 * 6. Persistence of DistributionItem records and run status transition
 */

import { withDbClient } from "@/lib/db/pool";
import { generateUuidV7 } from "@/lib/uuid-v7";
import { listValidatedOriginsByProject } from "@/lib/provenance/provenance-repository";
import {
  clipIntervalsToWindow,
  reconstructAssetFreezeIntervals,
  type ValidatedEarningInterval
} from "@/lib/distribution/intervals";
import {
  calculateHamiltonAllocation,
  type WalletTimeWeightInput
} from "@/lib/distribution/hamilton";

export type RunCalculationResult = {
  runId: string;
  status: "ready_for_review" | "blocked";
  blockedReason?: string;
  itemCount: number;
  totalPoolTimeWeightSeconds: bigint;
  totalAllocatedMinor: bigint;
};

export async function executeDistributionCalculation(
  runId: string
): Promise<RunCalculationResult> {
  return withDbClient(async (client) => {
    // 1. Fetch run details
    const { rows: runRows } = await client.query<{
      id: string;
      project_id: string;
      eligibility_start_at: string | Date;
      eligibility_end_at: string | Date;
      distribution_pool_amount_minor: string | bigint;
      status: string;
    }>(
      `SELECT id, project_id, eligibility_start_at, eligibility_end_at,
              distribution_pool_amount_minor, status
       FROM distribution_runs WHERE id = $1`,
      [runId]
    );

    if (runRows.length === 0) {
      throw new Error(`DistributionRun not found: ${runId}`);
    }

    const run = runRows[0]!;
    const projectId = run.project_id;
    const windowStart = new Date(run.eligibility_start_at).toISOString();
    const windowEnd = new Date(run.eligibility_end_at).toISOString();
    const poolAmountMinor = BigInt(run.distribution_pool_amount_minor);

    // Update status to calculating
    await client.query(
      `UPDATE distribution_runs SET status = 'calculating', updated_at = NOW() WHERE id = $1`,
      [runId]
    );

    // 2. Fetch validated asset origins
    const validatedAssets = await listValidatedOriginsByProject(projectId);

    // 3. Reconstruct freeze intervals per asset
    const allClippedIntervals: ValidatedEarningInterval[] = [];

    for (const asset of validatedAssets) {
      try {
        const rawIntervals = await reconstructAssetFreezeIntervals(asset.assetAddress);
        const clipped = clipIntervalsToWindow(rawIntervals, windowStart, windowEnd);
        allClippedIntervals.push(...clipped);
      } catch {
        // Skip asset if reconstruction fails
      }
    }

    // 4. Aggregate time-weight by wallet
    const walletWeights = new Map<string, { seconds: bigint; firstFreezeAt: string }>();

    for (const interval of allClippedIntervals) {
      const existing = walletWeights.get(interval.wallet);
      if (existing) {
        existing.seconds += interval.earningSeconds;
        if (new Date(interval.earningStartAt) < new Date(existing.firstFreezeAt)) {
          existing.firstFreezeAt = interval.earningStartAt;
        }
      } else {
        walletWeights.set(interval.wallet, {
          seconds: interval.earningSeconds,
          firstFreezeAt: interval.earningStartAt
        });
      }
    }

    const walletInputs: WalletTimeWeightInput[] = Array.from(walletWeights.entries()).map(
      ([walletPublicKey, data]) => ({
        walletPublicKey,
        walletTimeWeightSeconds: data.seconds,
        firstFreezeAt: data.firstFreezeAt
      })
    );

    // 5. Execute Hamilton calculation
    const allocationResult = calculateHamiltonAllocation({
      distributionPoolAmountMinor: poolAmountMinor,
      wallets: walletInputs
    });

    if (allocationResult.status === "blocked") {
      await client.query(
        `UPDATE distribution_runs
         SET status = 'blocked', blocked_reason = $1, updated_at = NOW()
         WHERE id = $2`,
        [allocationResult.blockedReason, runId]
      );

      return {
        runId,
        status: "blocked",
        blockedReason: allocationResult.blockedReason,
        itemCount: 0,
        totalPoolTimeWeightSeconds: 0n,
        totalAllocatedMinor: 0n
      };
    }

    // 6. Persist DistributionItems
    for (const item of allocationResult.allocations) {
      await client.query(
        `INSERT INTO distribution_items (
           id, run_id, wallet_public_key, beneficiary_wallet,
           frozen_seconds, wallet_time_weight, pool_time_weight,
           amount_minor, gross_amount_minor, net_amount_minor,
           rounding_remainder_rank, status
         ) VALUES (
           $1, $2, $3, $3, $4, $4, $5, $6, $6, $6, $7, 'calculated'
         )`,
        [
          generateUuidV7(),
          runId,
          item.walletPublicKey,
          item.walletTimeWeightSeconds.toString(),
          allocationResult.poolTimeWeightSeconds.toString(),
          item.grossAmountMinor.toString(),
          item.remainderRank
        ]
      );
    }

    // 7. Update DistributionRun status to ready_for_review
    await client.query(
      `UPDATE distribution_runs
       SET status = 'ready_for_review',
           item_count = $1,
           total_wallets = $1,
           total_pool_time_weight_seconds = $2,
           rounding_remainder_minor = 0,
           updated_at = NOW()
       WHERE id = $3`,
      [
        allocationResult.allocations.length,
        allocationResult.poolTimeWeightSeconds.toString(),
        runId
      ]
    );

    return {
      runId,
      status: "ready_for_review",
      itemCount: allocationResult.allocations.length,
      totalPoolTimeWeightSeconds: allocationResult.poolTimeWeightSeconds,
      totalAllocatedMinor: allocationResult.totalAllocatedMinor
    };
  });
}
