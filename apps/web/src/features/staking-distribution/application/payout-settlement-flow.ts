/**
 * =========================================================================================
 * Layer 2: Application Layer — Payout Settlement Flow & Exception Handling
 * Description: Orchestration service for global run rejection, granular pre-seal item veto,
 *              and dual-layer emergency circuit breaker control.
 * =========================================================================================
 */

import { withDbClient } from "@/features/shared/infrastructure/db/pool";
import { generateUuidV7 } from "@/lib/uuid-v7";

export class PayoutSettlementFlowError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, status = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = "PayoutSettlementFlowError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type RejectPayoutRunInput = {
  runId: string;
  adminActorId: string;
  reason: string;
};

export type VetoDistributionItemInput = {
  runId: string;
  itemId: string;
  adminActorId: string;
  reason: string;
};

export type TriggerCircuitBreakerInput = {
  runId: string;
  adminActorId: string;
  reason: string;
  ttlSeconds?: number;
};

export type EmergencyPausePayload = {
  runId: string;
  policyPda: string;
  programId: string;
  nonce: number;
  expiresAt: number; // Unix timestamp in seconds
};

export type CircuitBreakerResult = {
  runId: string;
  localPaused: boolean;
  emergencyPausePayload: EmergencyPausePayload;
  activatedAt: string;
};

/**
 * Global rejection of a payout distribution run.
 * What: Cancels an active or blocked payout proposal.
 * How: Validates unsealed state, marks run as blocked/rejected, and writes audit log.
 */
export async function rejectPayoutRun(input: RejectPayoutRunInput): Promise<{ id: string; status: string }> {
  const { runId, adminActorId, reason } = input;

  return withDbClient(async (client) => {
    // Step 1: Query run state FOR UPDATE
    const { rows: runRows } = await client.query<{ id: string; status: string }>(
      `SELECT id, status FROM distribution_runs WHERE id = $1 FOR UPDATE`,
      [runId]
    );

    if (runRows.length === 0) {
      throw new PayoutSettlementFlowError("ERR_RUN_NOT_FOUND", `Payout run ${runId} not found.`, 404);
    }

    const run = runRows[0]!;
    if (["sealed", "executing", "finalized"].includes(run.status)) {
      throw new PayoutSettlementFlowError(
        "ERR_INVALID_RUN_STATE",
        `Cannot reject payout run in '${run.status}' state. Only draft or blocked runs can be rejected.`,
        409
      );
    }

    // Step 2: Update status to blocked with rejection reason
    await client.query(
      `UPDATE distribution_runs
       SET status = 'blocked',
           blocked_reason = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [reason, runId]
    );

    // Step 3: Insert immutable audit log event
    await client.query(
      `INSERT INTO distribution_audit_events (
         id, run_id, event_name, actor_type, actor_id, event_payload, created_at
       ) VALUES ($1, $2, 'RUN_REJECTED_BY_ADMIN', 'admin', $3, $4, NOW())`,
      [
        generateUuidV7(),
        runId,
        adminActorId,
        JSON.stringify({
          rejectedBy: adminActorId,
          reason,
          timestamp: new Date().toISOString()
        })
      ]
    );

    return { id: runId, status: "blocked" };
  });
}

/**
 * Granular veto of an individual distribution item (pre-seal only).
 * What: Excludes an item from snapshot before on-chain sealing.
 * How: Checks pre-seal status, marks item as vetoed, and records audit event.
 */
export async function vetoDistributionItem(
  input: VetoDistributionItemInput
): Promise<{ itemId: string; status: string }> {
  const { runId, itemId, adminActorId, reason } = input;

  return withDbClient(async (client) => {
    // Step 1: Enforce pre-seal veto rule on parent run
    const { rows: runRows } = await client.query<{ id: string; status: string }>(
      `SELECT id, status FROM distribution_runs WHERE id = $1 FOR UPDATE`,
      [runId]
    );

    if (runRows.length === 0) {
      throw new PayoutSettlementFlowError("ERR_RUN_NOT_FOUND", `Payout run ${runId} not found.`, 404);
    }

    const run = runRows[0]!;
    if (["sealed", "executing", "finalized"].includes(run.status)) {
      throw new PayoutSettlementFlowError(
        "ERR_SEALED_RUN_VETO_PROHIBITED",
        `Granular item veto is prohibited on '${run.status}' runs. Use emergency circuit breaker instead.`,
        409
      );
    }

    // Step 2: Query distribution item FOR UPDATE
    const { rows: itemRows } = await client.query<{
      id: string;
      exclusion_reason: string | null;
    }>(
      `SELECT id, exclusion_reason FROM distribution_items WHERE id = $1 AND run_id = $2 FOR UPDATE`,
      [itemId, runId]
    );

    if (itemRows.length === 0) {
      throw new PayoutSettlementFlowError("ERR_ITEM_NOT_FOUND", `Distribution item ${itemId} not found in run ${runId}.`, 404);
    }

    // Step 3: Update item exclusion reason to VETOED_BY_ADMIN
    await client.query(
      `UPDATE distribution_items
       SET exclusion_reason = 'VETOED_BY_ADMIN',
           item_payload = jsonb_set(COALESCE(item_payload, '{}'::jsonb), '{vetoReason}', $1::jsonb)
       WHERE id = $2`,
      [JSON.stringify(reason), itemId]
    );

    // Step 4: Insert immutable audit log event
    await client.query(
      `INSERT INTO distribution_audit_events (
         id, run_id, event_name, actor_type, actor_id, event_payload, created_at
       ) VALUES ($1, $2, 'ITEM_VETOED_BY_ADMIN', 'admin', $3, $4, NOW())`,
      [
        generateUuidV7(),
        runId,
        adminActorId,
        JSON.stringify({
          itemId,
          vetoedBy: adminActorId,
          reason,
          timestamp: new Date().toISOString()
        })
      ]
    );

    return { itemId, status: "vetoed" };
  });
}

/**
 * Activates dual-layer emergency circuit breaker.
 * What: Stops local crank bot and generates emergency pause payload for on-chain pause_run.
 * How: Sets blocked flag, validates TTL <= 300s, constructs nonce payload, and emits audit event.
 */
export async function triggerCircuitBreaker(
  input: TriggerCircuitBreakerInput
): Promise<CircuitBreakerResult> {
  const { runId, adminActorId, reason, ttlSeconds = 300 } = input;

  if (ttlSeconds > 300) {
    throw new PayoutSettlementFlowError(
      "ERR_EMERGENCY_TTL_EXCEEDED",
      "Maximum allowed emergency pause TTL is 300 seconds.",
      400
    );
  }

  const nowUnix = Math.floor(Date.now() / 1000);
  const activatedAt = new Date().toISOString();

  return withDbClient(async (client) => {
    // Step 1: Query run details
    const { rows: runRows } = await client.query<{
      id: string;
      status: string;
      policy_version: string;
    }>(
      `SELECT id, status, policy_version FROM distribution_runs WHERE id = $1 FOR UPDATE`,
      [runId]
    );

    if (runRows.length === 0) {
      throw new PayoutSettlementFlowError("ERR_RUN_NOT_FOUND", `Payout run ${runId} not found.`, 404);
    }

    const run = runRows[0]!;

    // Step 2: Set local bot pause flag on run
    await client.query(
      `UPDATE distribution_runs
       SET blocked_reason = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [`EMERGENCY_CIRCUIT_BREAKER: ${reason}`, runId]
    );

    // Step 3: Construct emergency pause payload with nonce
    const emergencyPausePayload: EmergencyPausePayload = {
      runId,
      policyPda: "PolicyPdaPlaceholder111111111111111111111111",
      programId: "payout_settlement",
      nonce: Date.now(),
      expiresAt: nowUnix + ttlSeconds
    };

    // Step 4: Insert immutable audit log event
    await client.query(
      `INSERT INTO distribution_audit_events (
         id, run_id, event_name, actor_type, actor_id, event_payload, created_at
       ) VALUES ($1, $2, 'CIRCUIT_BREAKER_TRIGGERED', 'admin', $3, $4, NOW())`,
      [
        generateUuidV7(),
        runId,
        adminActorId,
        JSON.stringify({
          triggeredBy: adminActorId,
          reason,
          emergencyPausePayload,
          activatedAt
        })
      ]
    );

    return {
      runId,
      localPaused: true,
      emergencyPausePayload,
      activatedAt
    };
  });
}
