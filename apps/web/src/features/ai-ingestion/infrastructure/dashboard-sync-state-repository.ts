/**
 * ============================================================================
 * @file apps/web/src/features/ai-ingestion/infrastructure/dashboard-sync-state-repository.ts
 * @description Layer 4: Infrastructure - Neon PostgreSQL Persistent Sync State Repository
 * ============================================================================
 * Purpose: Manages distributed synchronization state, cooldown window checks,
 * trailing-edge pending flags, and audit logs in Neon PostgreSQL.
 *
 * Invariants:
 *  - Layer 4 boundary: Strictly encapsulates SQL queries and database connection pools.
 *  - Operates on the 'CANONICAL_DASHBOARD_SYNC' singleton row in table dashboard_sync_state.
 *  - Atomic conditional updates prevent race conditions across serverless containers.
 *  - Immutable audit trail recording every execution attempt into dashboard_sync_logs.
 *  - Fail-safe defaults: Never throws unhandled connection crashes to caller; returns structured fallbacks.
 *
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 *
 * @spec BBC-021
 */

import { Pool } from 'pg';
import { getDatabasePool } from '@/lib/infrastructure/db/neon-client';
import {
  type DashboardSyncState,
  type DashboardSyncStatus,
  type AcquireCooldownParams,
  type AcquireCooldownResult,
} from '../domain/models/dashboard-sync-models';

/** Singleton identifier for the dashboard synchronization pipeline */
export const CANONICAL_SYNC_ID = 'CANONICAL_DASHBOARD_SYNC';

/**
 * Maps raw SQL row from dashboard_sync_state to typed domain DashboardSyncState.
 */
function mapRowToSyncState(row: Record<string, unknown>): DashboardSyncState {
  return {
    id: String(row.id),
    lastSyncStartedAt: row.last_sync_started_at ? new Date(String(row.last_sync_started_at)) : null,
    lastSyncCompletedAt: row.last_sync_completed_at ? new Date(String(row.last_sync_completed_at)) : null,
    lastSyncStatus: (row.last_sync_status as DashboardSyncStatus) || 'IDLE',
    pendingSync: Boolean(row.pending_sync),
    pendingSyncRequestedAt: row.pending_sync_requested_at ? new Date(String(row.pending_sync_requested_at)) : null,
    pendingSyncSource: row.pending_sync_source ? String(row.pending_sync_source) : null,
    cooldownUntil: row.cooldown_until ? new Date(String(row.cooldown_until)) : null,
    activeLockOwner: row.active_lock_owner ? String(row.active_lock_owner) : null,
    currentFileId: row.current_file_id ? String(row.current_file_id) : null,
    lastError: row.last_error ? String(row.last_error) : null,
    consecutiveFailures: Number(row.consecutive_failures || 0),
    version: Number(row.version || 1),
    createdAt: new Date(String(row.created_at || Date.now())),
    updatedAt: new Date(String(row.updated_at || Date.now())),
  };
}

/**
 * Retrieves current distributed synchronization state from PostgreSQL.
 *
 * @param pool - Optional injected PostgreSQL connection pool (defaults to singleton pool)
 * @returns Typed DashboardSyncState domain model
 */
export async function fetchDashboardSyncStateFromDb(pool?: Pool): Promise<DashboardSyncState> {
  // Step 1: Obtain active database connection pool
  const db = pool ?? getDatabasePool();

  // Step 2: Query singleton row, ensuring row exists with ON CONFLICT insert
  const result = await db.query(
    `INSERT INTO dashboard_sync_state (id, last_sync_status, pending_sync, updated_at)
     VALUES ($1, 'IDLE', FALSE, NOW())
     ON CONFLICT (id) DO UPDATE SET updated_at = dashboard_sync_state.updated_at
     RETURNING *;`,
    [CANONICAL_SYNC_ID]
  );

  // Step 3: Map and return domain model
  return mapRowToSyncState(result.rows[0]);
}

/**
 * Atomically checks cooldown status in PostgreSQL. If cooldown has expired (or force=true),
 * acquires the cooldown window and resets pending_sync. If cooldown is active,
 * flags pending_sync = TRUE for trailing-edge consolidation without running sync.
 *
 * @param params - Cooldown options (cooldownMinutes, source, force)
 * @param pool - Optional injected PostgreSQL pool
 * @returns AcquireCooldownResult specifying whether sync is permitted or deferred
 */
export async function acquireCooldownOrMarkPendingInDb(
  params: AcquireCooldownParams = {},
  pool?: Pool
): Promise<AcquireCooldownResult> {
  // Step 1: Resolve parameters with safe defaults
  const db = pool ?? getDatabasePool();
  const cooldownMinutes = params.cooldownMinutes && params.cooldownMinutes > 0 ? params.cooldownMinutes : 30;
  const source = params.source ?? 'WEBHOOK';
  const force = Boolean(params.force);

  // Step 2: Ensure singleton row exists
  await fetchDashboardSyncStateFromDb(db);

  // Step 3: Handle explicit force bypass
  if (force) {
    const updateRes = await db.query(
      `UPDATE dashboard_sync_state
       SET cooldown_until = NOW() + ($1 || ' minutes')::INTERVAL,
           pending_sync = FALSE,
           pending_sync_requested_at = NULL,
           pending_sync_source = NULL,
           version = version + 1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING cooldown_until;`,
      [cooldownMinutes, CANONICAL_SYNC_ID]
    );

    const cooldownUntil = updateRes.rows[0]?.cooldown_until
      ? new Date(updateRes.rows[0].cooldown_until).toISOString()
      : null;

    return {
      acquired: true,
      pending: false,
      cooldownUntil,
      message: 'Forced execution: Cooldown window acquired immediately.',
    };
  }

  // Step 4: Atomic conditional check against cooldown_until
  const checkRes = await db.query(
    `SELECT cooldown_until, (cooldown_until > NOW()) AS is_in_cooldown
     FROM dashboard_sync_state
     WHERE id = $1;`,
    [CANONICAL_SYNC_ID]
  );

  const isInCooldown = Boolean(checkRes.rows[0]?.is_in_cooldown);
  const currentCooldownUntil = checkRes.rows[0]?.cooldown_until
    ? new Date(checkRes.rows[0].cooldown_until).toISOString()
    : null;

  // Step 5: If currently inside cooldown, coalesce edit into trailing-edge flag
  if (isInCooldown) {
    await db.query(
      `UPDATE dashboard_sync_state
       SET pending_sync = TRUE,
           pending_sync_requested_at = NOW(),
           pending_sync_source = $1,
           version = version + 1,
           updated_at = NOW()
       WHERE id = $2;`,
      [source, CANONICAL_SYNC_ID]
    );

    return {
      acquired: false,
      pending: true,
      cooldownUntil: currentCooldownUntil,
      message: `Cooldown active until ${currentCooldownUntil}. Trailing-edge pending flag recorded.`,
    };
  }

  // Step 6: Cooldown expired or not set -> Acquire lock & set new cooldown window
  const acquireRes = await db.query(
    `UPDATE dashboard_sync_state
     SET cooldown_until = NOW() + ($1 || ' minutes')::INTERVAL,
         pending_sync = FALSE,
         pending_sync_requested_at = NULL,
         pending_sync_source = NULL,
         version = version + 1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING cooldown_until;`,
    [cooldownMinutes, CANONICAL_SYNC_ID]
  );

  const newCooldownUntil = acquireRes.rows[0]?.cooldown_until
    ? new Date(acquireRes.rows[0].cooldown_until).toISOString()
    : null;

  return {
    acquired: true,
    pending: false,
    cooldownUntil: newCooldownUntil,
    message: 'Cooldown window acquired. Background synchronization dispatched.',
  };
}

/**
 * Updates persistent state when a synchronization run begins.
 *
 * @param source - Trigger source initiating execution
 * @param fileId - Target Google Drive spreadsheet file ID
 * @param pool - Optional injected PostgreSQL pool
 */
export async function markSyncStarted(
  source: string,
  fileId?: string,
  pool?: Pool
): Promise<void> {
  const db = pool ?? getDatabasePool();
  await db.query(
    `UPDATE dashboard_sync_state
     SET last_sync_started_at = NOW(),
         last_sync_status = 'RUNNING',
         current_file_id = $1,
         version = version + 1,
         updated_at = NOW()
     WHERE id = $2;`,
    [fileId ?? null, CANONICAL_SYNC_ID]
  );
}

/**
 * Updates persistent state when a synchronization run successfully completes.
 *
 * @param pool - Optional injected PostgreSQL pool
 */
export async function markSyncCompleted(pool?: Pool): Promise<void> {
  const db = pool ?? getDatabasePool();
  await db.query(
    `UPDATE dashboard_sync_state
     SET last_sync_completed_at = NOW(),
         last_sync_status = 'SUCCESS',
         consecutive_failures = 0,
         last_error = NULL,
         version = version + 1,
         updated_at = NOW()
     WHERE id = $1;`,
    [CANONICAL_SYNC_ID]
  );
}

/**
 * Updates persistent state when a synchronization run fails or trips circuit-breaker.
 *
 * @param error - Formatted error message
 * @param isCircuitBreaker - Whether failure was caused by circuit breaker trip
 * @param pool - Optional injected PostgreSQL pool
 */
export async function markSyncFailed(
  error: string,
  isCircuitBreaker = false,
  pool?: Pool
): Promise<void> {
  const db = pool ?? getDatabasePool();
  const status: DashboardSyncStatus = isCircuitBreaker ? 'CIRCUIT_BREAKER_TRIPPED' : 'FAILED';
  await db.query(
    `UPDATE dashboard_sync_state
     SET last_sync_completed_at = NOW(),
         last_sync_status = $1,
         consecutive_failures = consecutive_failures + 1,
         last_error = $2,
         version = version + 1,
         updated_at = NOW()
     WHERE id = $3;`,
    [status, error, CANONICAL_SYNC_ID]
  );
}
