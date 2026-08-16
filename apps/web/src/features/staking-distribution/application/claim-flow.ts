/**
 * SPEC-S04-B (EPIC-014): Claim Lifecycle & Compliance Lock
 *
 * Implements user claim quote locking, compliance re-checking, 48-hour quote TTL,
 * advisory lock concurrent claim protection, and payout wallet override handling.
 *
 * Invariants:
 * - Compliance recheck gate: restricted_aml or suspended -> status = 'compliance_hold'
 * - Advisory lock on (walletPublicKey, runId) prevents concurrent double-claiming
 * - Quote expires after 48 hours -> status = 'expired'
 * - Payout wallet override requires cryptographic proof (SIWS) + committee evidence
 */

import { withDbClient } from "@/features/shared/infrastructure/db/pool";
import { generateUuidV7 } from "@/lib/uuid-v7";
import {
  resolveActiveFeePolicy,
  calculateClaimFee
} from "@/features/staking-distribution/domain/fee-policy";
import { verifySiwsSignature } from "@/lib/siws";

export type ClaimStatus =
  | "quote_created"
  | "claim_requested"
  | "compliance_hold"
  | "approved_for_dispersion"
  | "executing"
  | "executed"
  | "failed"
  | "expired"
  | "clawback_to_treasury";

export type DistributionClaimRecord = {
  id: string;
  runId: string;
  itemId: string;
  walletPublicKey: string;
  payoutWallet: string;
  grossAmountMinor: bigint;
  feeAmountMinor: bigint;
  netAmountMinor: bigint;
  claimFeePolicyId: string | null;
  claimFeePolicyVersion: number;
  status: ClaimStatus;
  quoteExpiresAt: string;
  complianceHoldAt: string | null;
  confirmedAt: string | null;
  payoutOverrideEvidence: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

type DistributionClaimRow = {
  id: string;
  run_id: string;
  item_id: string;
  wallet_public_key: string;
  payout_wallet: string;
  gross_amount_minor: string | bigint;
  fee_amount_minor: string | bigint;
  net_amount_minor: string | bigint;
  claim_fee_policy_id: string | null;
  claim_fee_policy_version: number;
  status: ClaimStatus;
  quote_expires_at: string | Date;
  compliance_hold_at: string | Date | null;
  confirmed_at: string | Date | null;
  payout_override_evidence: Record<string, unknown> | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function toIso(value: string | Date | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapClaimRow(row: DistributionClaimRow): DistributionClaimRecord {
  return {
    id: row.id,
    runId: row.run_id,
    itemId: row.item_id,
    walletPublicKey: row.wallet_public_key,
    payoutWallet: row.payout_wallet,
    grossAmountMinor: BigInt(row.gross_amount_minor),
    feeAmountMinor: BigInt(row.fee_amount_minor),
    netAmountMinor: BigInt(row.net_amount_minor),
    claimFeePolicyId: row.claim_fee_policy_id,
    claimFeePolicyVersion: row.claim_fee_policy_version,
    status: row.status,
    quoteExpiresAt: toIso(row.quote_expires_at) ?? new Date().toISOString(),
    complianceHoldAt: toIso(row.compliance_hold_at),
    confirmedAt: toIso(row.confirmed_at),
    payoutOverrideEvidence: row.payout_override_evidence,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString()
  };
}

export class ClaimFlowError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ClaimFlowError";
    this.code = code;
  }
}

/**
 * Computes a deterministic 32-bit integer key for PostgreSQL advisory locking per (wallet, run).
 */
function lockKeyFor(walletPublicKey: string, runId: string): number {
  const str = `${walletPublicKey}:${runId}`;
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash | 0;
}

/**
 * Creates a locked claim quote for a user wallet and distribution run.
 */
export async function createClaimQuote(input: {
  walletPublicKey: string;
  runId: string;
  complianceStatus?: string; // 'fully_verified' | 'restricted_aml' | 'suspended'
}): Promise<DistributionClaimRecord> {
  const { walletPublicKey, runId, complianceStatus = "fully_verified" } = input;

  return withDbClient(async (client) => {
    // Acquire PostgreSQL advisory lock per (wallet, run)
    const lockKey = lockKeyFor(walletPublicKey, runId);
    await client.query(`SELECT pg_advisory_xact_lock($1)`, [lockKey]);

    // Check if an active claim already exists
    const { rows: existing } = await client.query<DistributionClaimRow>(
      `SELECT * FROM distribution_claims
       WHERE wallet_public_key = $1 AND run_id = $2
         AND status NOT IN ('expired', 'failed')`,
      [walletPublicKey, runId]
    );

    if (existing.length > 0) {
      const existingClaim = existing[0]!;
      if (new Date(existingClaim.quote_expires_at).getTime() < Date.now()) {
        await client.query(
          `UPDATE distribution_claims SET status = 'expired', updated_at = NOW() WHERE id = $1`,
          [existingClaim.id]
        );
      } else {
        return mapClaimRow(existingClaim);
      }
    }

    // Fetch distribution item
    const { rows: itemRows } = await client.query<{
      id: string;
      gross_amount_minor: string | bigint;
    }>(
      `SELECT id, gross_amount_minor FROM distribution_items
       WHERE run_id = $1 AND wallet_public_key = $2`,
      [runId, walletPublicKey]
    );

    if (itemRows.length === 0) {
      throw new ClaimFlowError(
        "ITEM_NOT_FOUND",
        `No distribution item found for wallet ${walletPublicKey} in run ${runId}`
      );
    }

    const item = itemRows[0]!;
    const grossAmountMinor = BigInt(item.gross_amount_minor);

    // Fetch run details
    const { rows: runRows } = await client.query<{
      project_id: string;
      token_mint: string;
      candy_machine_address: string;
    }>(
      `SELECT project_id, token_mint, scope_address AS candy_machine_address
       FROM distribution_runs WHERE id = $1`,
      [runId]
    );

    if (runRows.length === 0) {
      throw new ClaimFlowError("RUN_NOT_FOUND", `DistributionRun not found: ${runId}`);
    }

    const run = runRows[0]!;

    // Recheck compliance status gate
    const isComplianceBlocked =
      complianceStatus === "restricted_aml" || complianceStatus === "suspended";
    const initialStatus: ClaimStatus = isComplianceBlocked ? "compliance_hold" : "quote_created";

    // Resolve fee policy
    const policy = await resolveActiveFeePolicy({
      projectId: run.project_id,
      candyMachineAddress: run.candy_machine_address,
      tokenMint: run.token_mint
    });

    const feeResult = calculateClaimFee(grossAmountMinor, policy);

    // 48-hour quote TTL
    const quoteExpiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    const claimId = generateUuidV7();

    const { rows } = await client.query<DistributionClaimRow>(
      `INSERT INTO distribution_claims (
         id, run_id, item_id, wallet_public_key, payout_wallet,
         gross_amount_minor, fee_amount_minor, net_amount_minor,
         claim_fee_policy_id, claim_fee_policy_version, status,
         quote_expires_at, compliance_hold_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
       ) RETURNING *`,
      [
        claimId,
        runId,
        item.id,
        walletPublicKey,
        walletPublicKey,
        grossAmountMinor.toString(),
        feeResult.feeAmountMinor.toString(),
        feeResult.netAmountMinor.toString(),
        policy.id,
        policy.version,
        initialStatus,
        quoteExpiresAt,
        isComplianceBlocked ? new Date().toISOString() : null
      ]
    );

    return mapClaimRow(rows[0]!);
  });
}

/**
 * Confirms a claim quote within its 48-hour TTL window.
 */
export async function confirmClaimQuote(input: {
  claimId: string;
  walletPublicKey: string;
}): Promise<DistributionClaimRecord> {
  const { claimId, walletPublicKey } = input;

  return withDbClient(async (client) => {
    const { rows } = await client.query<DistributionClaimRow>(
      `SELECT * FROM distribution_claims WHERE id = $1 AND wallet_public_key = $2 FOR UPDATE`,
      [claimId, walletPublicKey]
    );

    if (rows.length === 0) {
      throw new ClaimFlowError("CLAIM_NOT_FOUND", `Claim quote not found: ${claimId}`);
    }

    const claim = rows[0]!;

    if (claim.status === "compliance_hold") {
      throw new ClaimFlowError(
        "COMPLIANCE_HOLD",
        "Claim is on compliance hold and cannot be confirmed."
      );
    }

    if (new Date(claim.quote_expires_at).getTime() < Date.now()) {
      await client.query(
        `UPDATE distribution_claims SET status = 'expired', updated_at = NOW() WHERE id = $1`,
        [claimId]
      );
      throw new ClaimFlowError("QUOTE_EXPIRED", "Claim quote has expired (48-hour TTL exceeded).");
    }

    if (claim.status !== "quote_created") {
      throw new ClaimFlowError(
        "INVALID_CLAIM_STATUS",
        `Claim quote cannot be confirmed from status '${claim.status}'.`
      );
    }

    const { rows: updated } = await client.query<DistributionClaimRow>(
      `UPDATE distribution_claims
       SET status = 'approved_for_dispersion', confirmed_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [claimId]
    );

    return mapClaimRow(updated[0]!);
  });
}

/**
 * Submits a payout wallet override with verified SIWS proof signature.
 */
export async function submitPayoutOverride(input: {
  claimId: string;
  walletPublicKey: string;
  newPayoutWallet: string;
  siwsMessage: string;
  siwsSignature: string;
}): Promise<DistributionClaimRecord> {
  const { claimId, walletPublicKey, newPayoutWallet, siwsMessage, siwsSignature } = input;

  // Verify SIWS proof
  const isValidProof = verifySiwsSignature({
    message: siwsMessage,
    signature: siwsSignature,
    publicKey: walletPublicKey
  });

  if (!isValidProof) {
    throw new ClaimFlowError(
      "INVALID_SIWS_PROOF",
      "Cryptographic SIWS proof signature is invalid for payout wallet override."
    );
  }

  return withDbClient(async (client) => {
    const { rows: existingRows } = await client.query<DistributionClaimRow>(
      `SELECT * FROM distribution_claims WHERE id = $1 AND wallet_public_key = $2 FOR UPDATE`,
      [claimId, walletPublicKey]
    );

    if (existingRows.length === 0) {
      throw new ClaimFlowError("CLAIM_NOT_FOUND", `Claim quote not found: ${claimId}`);
    }

    const claim = existingRows[0]!;
    if (["executed", "failed", "expired", "clawback_to_treasury"].includes(claim.status)) {
      throw new ClaimFlowError(
        "INVALID_CLAIM_STATUS",
        `Payout wallet override cannot be applied to claim with status '${claim.status}'.`
      );
    }

    const { rows } = await client.query<DistributionClaimRow>(
      `UPDATE distribution_claims
       SET payout_wallet = $1,
           payout_override_evidence = $2,
           updated_at = NOW()
       WHERE id = $3 AND wallet_public_key = $4
       RETURNING *`,
      [
        newPayoutWallet,
        JSON.stringify({
          originalWallet: walletPublicKey,
          newPayoutWallet,
          siwsMessage,
          siwsSignature,
          verifiedAt: new Date().toISOString()
        }),
        claimId,
        walletPublicKey
      ]
    );

    return mapClaimRow(rows[0]!);
  });
}

