/**
 * SPEC-S03-C (EPIC-014): Distribution Run State Machine
 *
 * Enforces valid state transitions and audit logging for Distribution Run lifecycle:
 * draft -> calculating -> ready_for_review -> committee_review
 *        -> committee_rejected -> draft (recalculation path)
 *        -> approved_for_dispersion -> executing -> executed -> final
 *        -> blocked | failed
 */

import { withDbClient } from "@/lib/db/pool";
import { generateUuidV7 } from "@/lib/uuid-v7";

export type DistributionRunStatus =
  | "draft"
  | "calculating"
  | "ready_for_review"
  | "committee_review"
  | "committee_rejected"
  | "approved_for_dispersion"
  | "executing"
  | "executed"
  | "finalized"
  | "final"
  | "blocked"
  | "failed";

export type StateMachineAction =
  | "START_CALCULATION"
  | "CALCULATION_COMPLETE"
  | "SUBMIT_FOR_COMMITTEE_REVIEW"
  | "APPROVE_DISPERSION"
  | "REJECT_DISPERSION"
  | "START_EXECUTION"
  | "MARK_EXECUTED"
  | "MARK_FINAL";

const VALID_TRANSITIONS: Record<DistributionRunStatus, Partial<Record<StateMachineAction, DistributionRunStatus>>> = {
  draft: { START_CALCULATION: "calculating" },
  calculating: { CALCULATION_COMPLETE: "ready_for_review" },
  ready_for_review: { SUBMIT_FOR_COMMITTEE_REVIEW: "committee_review" },
  committee_review: {
    APPROVE_DISPERSION: "approved_for_dispersion",
    REJECT_DISPERSION: "committee_rejected"
  },
  committee_rejected: { START_CALCULATION: "calculating" },
  approved_for_dispersion: { START_EXECUTION: "executing" },
  executing: { MARK_EXECUTED: "executed" },
  executed: { MARK_FINAL: "final" },
  finalized: {},
  final: {},
  blocked: { START_CALCULATION: "calculating" },
  failed: {}
};

export class InvalidStateTransitionError extends Error {
  readonly code = "INVALID_STATE_TRANSITION";

  constructor(currentStatus: string, action: string) {
    super(`Cannot execute action ${action} from status ${currentStatus}.`);
    this.name = "InvalidStateTransitionError";
  }
}

export async function transitionDistributionRunState(input: {
  runId: string;
  action: StateMachineAction;
  actorId: string;
  payload?: Record<string, unknown>;
}): Promise<{ oldStatus: DistributionRunStatus; newStatus: DistributionRunStatus }> {
  const { runId, action, actorId, payload } = input;

  return withDbClient(async (client) => {
    const { rows } = await client.query<{ id: string; status: DistributionRunStatus }>(
      `SELECT id, status FROM distribution_runs WHERE id = $1 FOR UPDATE`,
      [runId]
    );

    if (rows.length === 0) {
      throw new Error(`DistributionRun not found: ${runId}`);
    }

    const oldStatus = rows[0]!.status;
    const allowedActions = VALID_TRANSITIONS[oldStatus] ?? {};
    const nextStatus = allowedActions[action];

    if (!nextStatus) {
      throw new InvalidStateTransitionError(oldStatus, action);
    }

    await client.query(
      `UPDATE distribution_runs
       SET status = $1,
           committee_review_status = CASE WHEN $2 = 'APPROVE_DISPERSION' THEN 'approved'
                                          WHEN $2 = 'REJECT_DISPERSION' THEN 'rejected'
                                          ELSE committee_review_status END,
           committee_reviewed_at = CASE WHEN $2 IN ('APPROVE_DISPERSION', 'REJECT_DISPERSION') THEN NOW()
                                        ELSE committee_reviewed_at END,
           updated_at = NOW()
       WHERE id = $3`,
      [nextStatus, action, runId]
    );

    await client.query(
      `INSERT INTO distribution_audit_events (id, run_id, event_name, actor_type, actor_id, event_payload)
       VALUES ($1, $2, $3, 'admin', $4, $5)`,
      [
        generateUuidV7(),
        runId,
        `STATE_TRANSITION_${action}`,
        actorId,
        JSON.stringify({
          oldStatus,
          newStatus: nextStatus,
          action,
          payload: payload ?? {}
        })
      ]
    );

    return { oldStatus, newStatus: nextStatus };
  });
}
