/**
 * SPEC-S03-C (EPIC-014): Committee Review Package Generator
 *
 * Compiles a structured, reviewable dispersion package JSON containing:
 * - Run metadata (projectId, window, snapshotAt, pool amount)
 * - Totals (gross sum, net sum, time weight sum)
 * - Per-item allocations and evidence references
 * - Compliance exceptions
 * - RPC evidence (archival context slot and provider list)
 */

import { withDbClient } from "@/lib/db/pool";

export type CommitteeItemSummary = {
  walletPublicKey: string;
  frozenSeconds: bigint;
  grossAmountMinor: bigint;
  netAmountMinor: bigint;
  complianceSnapshot: string | null;
};

export type DispersionPackage = {
  run: {
    id: string;
    projectId: string;
    scopeAddress: string;
    eligibilityStartAt: string;
    eligibilityEndAt: string;
    snapshotAt: string;
    poolAmountMinor: bigint;
    status: string;
  };
  totals: {
    totalItems: number;
    totalGrossMinor: bigint;
    totalNetMinor: bigint;
    totalPoolTimeWeightSeconds: bigint;
  };
  items: CommitteeItemSummary[];
  rpcEvidence: {
    commitment: string;
    contextSlot: number | null;
    snapshotAt: string;
  };
};

export async function generateDispersionPackage(runId: string): Promise<DispersionPackage> {
  return withDbClient(async (client) => {
    const { rows: runRows } = await client.query<{
      id: string;
      project_id: string;
      scope_address: string;
      eligibility_start_at: string | Date;
      eligibility_end_at: string | Date;
      snapshot_at: string | Date;
      distribution_pool_amount_minor: string | bigint;
      status: string;
      final_rpc_commitment: string;
      final_rpc_context_slot: string | number | null;
      total_pool_time_weight_seconds: string | bigint;
    }>(
      `SELECT id, project_id, scope_address, eligibility_start_at, eligibility_end_at,
              snapshot_at, distribution_pool_amount_minor, status,
              final_rpc_commitment, final_rpc_context_slot,
              total_pool_time_weight_seconds
       FROM distribution_runs WHERE id = $1`,
      [runId]
    );

    if (runRows.length === 0) {
      throw new Error(`DistributionRun not found: ${runId}`);
    }

    const run = runRows[0]!;

    const { rows: itemRows } = await client.query<{
      wallet_public_key: string;
      frozen_seconds: string | bigint;
      gross_amount_minor: string | bigint;
      net_amount_minor: string | bigint;
      compliance_snapshot: string | null;
    }>(
      `SELECT wallet_public_key, frozen_seconds, gross_amount_minor,
              net_amount_minor, compliance_snapshot
       FROM distribution_items WHERE run_id = $1
       ORDER BY gross_amount_minor DESC`,
      [runId]
    );

    const items: CommitteeItemSummary[] = itemRows.map((row) => ({
      walletPublicKey: row.wallet_public_key,
      frozenSeconds: BigInt(row.frozen_seconds ?? 0),
      grossAmountMinor: BigInt(row.gross_amount_minor ?? 0),
      netAmountMinor: BigInt(row.net_amount_minor ?? 0),
      complianceSnapshot: row.compliance_snapshot
    }));

    const totalGross = items.reduce((acc, i) => acc + i.grossAmountMinor, 0n);
    const totalNet = items.reduce((acc, i) => acc + i.netAmountMinor, 0n);

    return {
      run: {
        id: run.id,
        projectId: run.project_id,
        scopeAddress: run.scope_address,
        eligibilityStartAt: new Date(run.eligibility_start_at).toISOString(),
        eligibilityEndAt: new Date(run.eligibility_end_at).toISOString(),
        snapshotAt: new Date(run.snapshot_at).toISOString(),
        poolAmountMinor: BigInt(run.distribution_pool_amount_minor ?? 0),
        status: run.status
      },
      totals: {
        totalItems: items.length,
        totalGrossMinor: totalGross,
        totalNetMinor: totalNet,
        totalPoolTimeWeightSeconds: BigInt(run.total_pool_time_weight_seconds ?? 0)
      },
      items,
      rpcEvidence: {
        commitment: run.final_rpc_commitment ?? "finalized",
        contextSlot: run.final_rpc_context_slot != null ? Number(run.final_rpc_context_slot) : null,
        snapshotAt: new Date(run.snapshot_at).toISOString()
      }
    };
  });
}
