/**
 * ============================================================================
 * @file tests/unit/dashboard-sync-state-repository.test.ts
 * @description Layer 4: Infrastructure - Unit Test Suite for DashboardSyncStateRepository
 * ============================================================================
 * Purpose: Verifies SQL statements, parameter mappings, singleton idempotency,
 * and state transitions for Neon PostgreSQL dashboard_sync_state management.
 *
 * Invariants Tested:
 *  - Upserts singleton row with ID 'CANONICAL_DASHBOARD_SYNC'.
 *  - Atomic cooldown acquisition and pending_sync flagging.
 *  - Force bypass ignoring active cooldown.
 *  - State transitions: RUNNING on start, SUCCESS on complete, FAILED on error.
 *
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 *
 * @spec BBC-021:INFRA-STATE
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Pool } from 'pg';
import {
  fetchDashboardSyncStateFromDb,
  acquireCooldownOrMarkPendingInDb,
  markSyncStarted,
  markSyncCompleted,
  markSyncFailed,
  CANONICAL_SYNC_ID,
} from '@/features/ai-ingestion/infrastructure/dashboard-sync-state-repository';

describe('BBC-021: DashboardSyncStateRepository (@spec BBC-021:INFRA-STATE)', () => {
  let mockPool: { query: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = {
      query: vi.fn(),
    };
  });

  it('should query singleton row and map into typed domain DashboardSyncState', async () => {
    // Arrange: Mock DB return row
    const mockRow = {
      id: CANONICAL_SYNC_ID,
      last_sync_started_at: '2026-09-08T20:00:00Z',
      last_sync_completed_at: '2026-09-08T20:02:00Z',
      last_sync_status: 'SUCCESS',
      pending_sync: false,
      pending_sync_requested_at: null,
      pending_sync_source: null,
      cooldown_until: '2026-09-08T20:30:00Z',
      active_lock_owner: null,
      current_file_id: 'file-123',
      last_error: null,
      consecutive_failures: 0,
      version: 2,
      created_at: '2026-09-08T19:00:00Z',
      updated_at: '2026-09-08T20:02:00Z',
    };
    mockPool.query.mockResolvedValueOnce({ rows: [mockRow] });

    // Act
    const state = await fetchDashboardSyncStateFromDb(mockPool as unknown as Pool);

    // Assert
    expect(state.id).toBe(CANONICAL_SYNC_ID);
    expect(state.lastSyncStatus).toBe('SUCCESS');
    expect(state.pendingSync).toBe(false);
    expect(state.version).toBe(2);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO dashboard_sync_state'),
      [CANONICAL_SYNC_ID]
    );
  });

  it('should acquire cooldown and reset pending_sync when cooldown has expired', async () => {
    // Arrange:
    // 1st query: getDashboardSyncState (seed check)
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: CANONICAL_SYNC_ID, last_sync_status: 'IDLE' }],
    });
    // 2nd query: check is_in_cooldown -> false
    mockPool.query.mockResolvedValueOnce({
      rows: [{ cooldown_until: null, is_in_cooldown: false }],
    });
    // 3rd query: UPDATE cooldown_until RETURNING cooldown_until
    const newCooldown = '2026-09-08T22:00:00.000Z';
    mockPool.query.mockResolvedValueOnce({
      rows: [{ cooldown_until: newCooldown }],
    });

    // Act
    const result = await acquireCooldownOrMarkPendingInDb(
      { cooldownMinutes: 30, source: 'WEBHOOK' },
      mockPool as unknown as Pool
    );

    // Assert
    expect(result.acquired).toBe(true);
    expect(result.pending).toBe(false);
    expect(result.cooldownUntil).toBe(newCooldown);
  });

  it('should flag pending_sync = true and deny execution when cooldown is active', async () => {
    const activeCooldown = '2026-09-08T22:30:00.000Z';
    // Arrange:
    // 1st query: seed check
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: CANONICAL_SYNC_ID, last_sync_status: 'IDLE' }],
    });
    // 2nd query: check is_in_cooldown -> true
    mockPool.query.mockResolvedValueOnce({
      rows: [{ cooldown_until: activeCooldown, is_in_cooldown: true }],
    });
    // 3rd query: UPDATE pending_sync = TRUE
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    // Act
    const result = await acquireCooldownOrMarkPendingInDb(
      { cooldownMinutes: 30, source: 'WEBHOOK' },
      mockPool as unknown as Pool
    );

    // Assert
    expect(result.acquired).toBe(false);
    expect(result.pending).toBe(true);
    expect(result.cooldownUntil).toBe(activeCooldown);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('SET pending_sync = TRUE'),
      ['WEBHOOK', CANONICAL_SYNC_ID]
    );
  });

  it('should bypass active cooldown when force: true is specified', async () => {
    // Arrange:
    // 1st query: seed check
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: CANONICAL_SYNC_ID, last_sync_status: 'IDLE' }],
    });
    // 2nd query: direct force UPDATE
    const forcedCooldown = '2026-09-08T22:45:00.000Z';
    mockPool.query.mockResolvedValueOnce({
      rows: [{ cooldown_until: forcedCooldown }],
    });

    // Act
    const result = await acquireCooldownOrMarkPendingInDb(
      { cooldownMinutes: 45, force: true, source: 'ADMIN_UI' },
      mockPool as unknown as Pool
    );

    // Assert
    expect(result.acquired).toBe(true);
    expect(result.pending).toBe(false);
    expect(result.cooldownUntil).toBe(forcedCooldown);
    expect(result.message).toContain('Forced execution');
  });

  it('should update state to RUNNING on markSyncStarted', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await markSyncStarted('WEBHOOK', 'file-abc', mockPool as unknown as Pool);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("last_sync_status = 'RUNNING'"),
      ['file-abc', CANONICAL_SYNC_ID]
    );
  });

  it('should update state to SUCCESS and reset failures on markSyncCompleted', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await markSyncCompleted(mockPool as unknown as Pool);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("last_sync_status = 'SUCCESS'"),
      [CANONICAL_SYNC_ID]
    );
  });

  it('should update state to CIRCUIT_BREAKER_TRIPPED on markSyncFailed with circuit breaker flag', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await markSyncFailed('Drop exceeded 20%', true, mockPool as unknown as Pool);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('consecutive_failures = consecutive_failures + 1'),
      ['CIRCUIT_BREAKER_TRIPPED', 'Drop exceeded 20%', CANONICAL_SYNC_ID]
    );
  });
});
