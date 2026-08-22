/**
 * =========================================================================================
 * Layer 2: Application Layer — Compliance & Claims Expiry Monitors
 * Description: Background workers and cron monitors for expiring stale claim quotes (48h TTL)
 *              and auto-clawing back long-unclaimed compliance hold balances (12-month TTL).
 * =========================================================================================
 */

import crypto from "node:crypto";

import { withDbClient } from "@/features/shared/infrastructure/db/pool";
import { generateUuidV7 } from "@/lib/uuid-v7";

export const DEFAULT_COMPLIANCE_HOLD_TTL_MS = 365 * 24 * 3600 * 1000; // 12 months (365 days)
export const DEFAULT_CLAIMS_EXPIRY_TTL_MS = 48 * 3600 * 1000; // 48 hours

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

export type ClaimsExpiryResult = {
  claimId: string;
  runId: string;
  walletPublicKey: string;
  expiredAt: string;
};

export type ClaimsExpirySummary = {
  scannedCount: number;
  expiredCount: number;
  expiredClaims: ClaimsExpiryResult[];
};

/**
 * Validates CRON_SECRET using timing-safe constant-time comparison.
 * What: Authenticates incoming cron HTTP requests.
 * How: Compares Authorization header Bearer token against server environment variable.
 */
export function verifyCronSecret(authHeader: string | null | undefined): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authHeader) return false;
  if (!authHeader.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7).trim();
  if (token.length !== secret.length) return false;

  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return crypto.timingSafeEqual(a, b);
}

/**
 * Checks whether a compliance hold duration exceeds maximum retention TTL.
 * What: Evaluates time threshold for compliance clawback.
 * How: Compares reference time against start timestamp plus TTL duration.
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
 * Executes 48-hour claim quote expiry monitor.
 * What: Expires stale claim requests older than 48 hours.
 * How: Scans claims in quote_created/claim_requested status past TTL and updates to expired.
 */
export async function runClaims48hExpiryMonitor(options?: {
  referenceTime?: Date | string;
  ttlMs?: number;
}): Promise<ClaimsExpirySummary> {
  const refTime = options?.referenceTime ? new Date(options.referenceTime) : new Date();
  const ttlMs = options?.ttlMs ?? DEFAULT_CLAIMS_EXPIRY_TTL_MS;

  return withDbClient(async (client) => {
    // Step 1: Select pending claim quotes that have passed expiry time or 48h TTL
    const { rows: pendingClaims } = await client.query<{
      id: string;
      run_id: string;
      wallet_public_key: string;
      quote_expires_at: string | Date;
      created_at: string | Date;
    }>(
      `SELECT id, run_id, wallet_public_key, quote_expires_at, created_at
       FROM distribution_claims
       WHERE status IN ('quote_created', 'claim_requested')`
    );

    const expiredClaims: ClaimsExpiryResult[] = [];

    for (const claim of pendingClaims) {
      const quoteExpiry = new Date(claim.quote_expires_at).getTime();
      const createdMs = new Date(claim.created_at).getTime();
      const isPastExplicitExpiry = !isNaN(quoteExpiry) && refTime.getTime() >= quoteExpiry;
      const isPastTtl = refTime.getTime() - createdMs >= ttlMs;

      if (isPastExplicitExpiry || isPastTtl) {
        const expiredAt = refTime.toISOString();

        // Step 2: Update claim status to expired
        await client.query(
          `UPDATE distribution_claims
           SET status = 'expired', updated_at = NOW()
           WHERE id = $1`,
          [claim.id]
        );

        // Step 3: Insert immutable audit log event
        await client.query(
          `INSERT INTO claim_or_payout_events (
             id, event_type, claim_id, run_id, wallet, amount_minor, token_mint, reason, metadata
           ) VALUES ($1, 'CLAIM_QUOTE_EXPIRED', $2, $3, $4, '0', '', 'quote_ttl_48h_expired', $5)`,
          [
            generateUuidV7(),
            claim.id,
            claim.run_id,
            claim.wallet_public_key,
            JSON.stringify({
              expiredAt,
              ttlMs
            })
          ]
        );

        expiredClaims.push({
          claimId: claim.id,
          runId: claim.run_id,
          walletPublicKey: claim.wallet_public_key,
          expiredAt
        });
      }
    }

    return {
      scannedCount: pendingClaims.length,
      expiredCount: expiredClaims.length,
      expiredClaims
    };
  });
}

/**
 * Runs the daily compliance hold monitor.
 * What: Auto-claws back compliance hold funds older than 12 months.
 * How: Queries claims in compliance_hold status and credits treasury clawback reserve.
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
