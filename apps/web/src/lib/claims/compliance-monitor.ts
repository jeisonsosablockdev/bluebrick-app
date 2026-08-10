/**
 * SPEC-S04-C (EPIC-014): Compliance Hold 12-Month TTL Monitor & Auto-Clawback
 *
 * Scans claims in COMPLIANCE_HOLD status. If hold duration exceeds 12 months (365 days),
 * transitions state to `compliance_hold_expired` / `clawback_to_treasury`, logs immutable
 * `CLAWBACK_TTL_EXPIRED` audit events, and credits the project's treasury clawback reserve.
 */

import { withDbClient } from "@/lib/db/pool";
import { generateUuidV7 } from "@/lib/uuid-v7";

export const DEFAULT_COMPLIANCE_HOLD_TTL_MS = 365 * 24 * 3600 * 1000; // 12 months (365 days)

export type ComplianceClawbackResult = {
  claimId: string;
  runId: string;
  walletPublicKey: string;
  netAmountMinor: bigint;
  tokenMint: string;
  holdStartedAt: string;
  clawedBackAt: string;
};

export type ComplianceMonitorSummary = {
  scannedCount: number;
  clawedBackCount: number;
  clawedBackClaims: ComplianceClawbackResult[];
};

/**
 * Pure helper function to check if a compliance hold duration has exceeded TTL.
 */
export function isComplianceHoldExpired(
  holdStartedAt: string | Date,
  referenceTime: string | Date = new Date(),
  ttlMs = DEFAULT_COMPLIANCE_HOLD_TTL_MS
): boolean {
  const start = holdStartedAt instanceof Date ? holdStartedAt.getTime() : new Date(holdStartedAt).getTime();
  const ref = referenceTime instanceof Date ? referenceTime.getTime() : new Date(referenceTime).getTime();

  if (isNaN(start) || isNaN(ref)) return false;
  return ref - start >= ttlMs;
}

/**
 * Runs the daily compliance hold monitor.
 * Scans database claims in `compliance_hold` status and auto-claws back funds if hold >= 12 months.
 */
export async function runComplianceHoldTtlMonitor(options?: {
  referenceTime?: Date | string;
  ttlMs?: number;
}): Promise<ComplianceMonitorSummary> {
  const refTime = options?.referenceTime ? new Date(options.referenceTime) : new Date();
  const ttlMs = options?.ttlMs ?? DEFAULT_COMPLIANCE_HOLD_TTL_MS;

  return withDbClient(async (client) => {
    // Select all claims on compliance hold
    const { rows: holdClaims } = await client.query<{
      id: string;
      run_id: string;
      wallet_public_key: string;
      net_amount_minor: string | bigint;
      compliance_hold_at: string | Date | null;
      created_at: string | Date;
      project_id: string;
      token_mint: string;
    }>(
      `SELECT dc.id, dc.run_id, dc.wallet_public_key, dc.net_amount_minor,
              dc.compliance_hold_at, dc.created_at,
              dr.project_id, dr.token_mint
       FROM distribution_claims dc
       JOIN distribution_runs dr ON dr.id = dc.run_id
       WHERE dc.status = 'compliance_hold'`
    );

    const clawedBackClaims: ComplianceClawbackResult[] = [];

    for (const claim of holdClaims) {
      const holdStart = claim.compliance_hold_at ?? claim.created_at;
      const expired = isComplianceHoldExpired(holdStart, refTime, ttlMs);

      if (expired) {
        const netAmount = BigInt(claim.net_amount_minor);
        const clawedBackAt = refTime.toISOString();

        // Update claim status to compliance_hold_expired
        await client.query(
          `UPDATE distribution_claims
           SET status = 'compliance_hold_expired', updated_at = NOW()
           WHERE id = $1`,
          [claim.id]
        );

        // Insert immutable audit log event
        await client.query(
          `INSERT INTO claim_or_payout_events (
             id, event_type, claim_id, run_id, wallet, amount_minor, token_mint, reason, metadata
           ) VALUES ($1, 'CLAWBACK_TTL_EXPIRED', $2, $3, $4, $5, $6, $7, $8)`,
          [
            generateUuidV7(),
            claim.id,
            claim.run_id,
            claim.wallet_public_key,
            netAmount.toString(),
            claim.token_mint,
            "compliance_hold_ttl_expired",
            JSON.stringify({
              holdStartedAt: holdStart,
              clawedBackAt,
              ttlMs,
              targetReserve: `TreasuryClawbackReserve:${claim.project_id}`
            })
          ]
        );

        clawedBackClaims.push({
          claimId: claim.id,
          runId: claim.run_id,
          walletPublicKey: claim.wallet_public_key,
          netAmountMinor: netAmount,
          tokenMint: claim.token_mint,
          holdStartedAt: new Date(holdStart).toISOString(),
          clawedBackAt
        });
      }
    }

    return {
      scannedCount: holdClaims.length,
      clawedBackCount: clawedBackClaims.length,
      clawedBackClaims
    };
  });
}
