/**
 * ============================================================================
 * @file tests/unit/dashboard-lazy-reconciler.test.ts
 * @description Unit Test Suite for Lazy Reconciler & Dead-Letter Audit Logging
 * ============================================================================
 * Purpose: Verifies the stale-while-revalidate lazy reconciliation logic
 * and persistent execution audit logging in dashboard_sync_logs.
 *
 * Invariants Tested:
 *  - Dispatches trailing-edge sync if pending_sync = TRUE and cooldown expired.
 *  - Skips sync if pending_sync = FALSE.
 *  - Skips sync if cooldown_until is still in the future.
 *  - Records execution audit log to dashboard_sync_logs on successful sync.
 *  - Flags dead-letter record in dashboard_sync_logs on sync failure.
 *
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 *
 * @spec BBC-021
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  reconcilePendingDashboardSync,
  triggerSyncAction,
} from '@/features/ai-ingestion/application/actions/trigger-sync-action';
import {
  fetchDashboardSyncStateFromDb,
  recordSyncAuditLogInDb,
} from '@/features/ai-ingestion/infrastructure/dashboard-sync-state-repository';

vi.mock('@/features/ai-ingestion/infrastructure/dashboard-sync-state-repository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/ai-ingestion/infrastructure/dashboard-sync-state-repository')>();
  return {
    ...actual,
    fetchDashboardSyncStateFromDb: vi.fn(),
    recordSyncAuditLogInDb: vi.fn(),
  };
});

vi.mock('@/lib/infrastructure/db/neon-client', () => ({
  getDatabasePool: () => ({
    query: vi.fn().mockResolvedValue({ rows: [] }),
  }),
}));

describe('BBC-021: Dashboard Lazy Reconciler & Audit Trail (@spec BBC-021)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[@spec BBC-021:LAZY-RECONCILER-01] should dispatch trailing-edge sync when pendingSync is true and cooldown expired', async () => {
    // Arrange: State with pending_sync = true and expired cooldown
    vi.mocked(fetchDashboardSyncStateFromDb).mockResolvedValue({
      id: 'CANONICAL_DASHBOARD_SYNC',
      lastSyncStartedAt: new Date(Date.now() - 3600000),
      lastSyncCompletedAt: new Date(Date.now() - 3500000),
      lastSyncStatus: 'SUCCESS',
      pendingSync: true,
      pendingSyncRequestedAt: new Date(Date.now() - 1800000),
      pendingSyncSource: 'GOOGLE_APPS_SCRIPT_TRAILING_EDGE',
      cooldownUntil: new Date(Date.now() - 60000), // 1 minute in the past
      activeLockOwner: null,
      currentFileId: null,
      lastError: null,
      consecutiveFailures: 0,
      version: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockSyncService = {
      executeSync: vi.fn().mockResolvedValue({
        success: true,
        totalEntitiesSynced: 42,
        counts: { proyectos: 1, fases: 2 },
      }),
    };

    // Act
    const result = await reconcilePendingDashboardSync(mockSyncService as any);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.success).toBe(true);
    expect(mockSyncService.executeSync).toHaveBeenCalledTimes(1);
  });

  it('[@spec BBC-021:LAZY-RECONCILER-02] should NOT dispatch sync when pendingSync is false', async () => {
    // Arrange: No pending sync
    vi.mocked(fetchDashboardSyncStateFromDb).mockResolvedValue({
      id: 'CANONICAL_DASHBOARD_SYNC',
      lastSyncStartedAt: new Date(Date.now() - 3600000),
      lastSyncCompletedAt: new Date(Date.now() - 3500000),
      lastSyncStatus: 'SUCCESS',
      pendingSync: false,
      pendingSyncRequestedAt: null,
      pendingSyncSource: null,
      cooldownUntil: new Date(Date.now() - 60000),
      activeLockOwner: null,
      currentFileId: null,
      lastError: null,
      consecutiveFailures: 0,
      version: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockSyncService = {
      executeSync: vi.fn(),
    };

    // Act
    const result = await reconcilePendingDashboardSync(mockSyncService as any);

    // Assert
    expect(result).toBeNull();
    expect(mockSyncService.executeSync).not.toHaveBeenCalled();
  });

  it('[@spec BBC-021:LAZY-RECONCILER-03] should NOT dispatch sync when cooldownUntil is still in the future', async () => {
    // Arrange: Pending sync exists, but cooldown still active for 15 more minutes
    vi.mocked(fetchDashboardSyncStateFromDb).mockResolvedValue({
      id: 'CANONICAL_DASHBOARD_SYNC',
      lastSyncStartedAt: new Date(Date.now() - 900000),
      lastSyncCompletedAt: new Date(Date.now() - 800000),
      lastSyncStatus: 'SUCCESS',
      pendingSync: true,
      pendingSyncRequestedAt: new Date(Date.now() - 300000),
      pendingSyncSource: 'WEBHOOK',
      cooldownUntil: new Date(Date.now() + 900000), // 15 mins in future
      activeLockOwner: null,
      currentFileId: null,
      lastError: null,
      consecutiveFailures: 0,
      version: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockSyncService = {
      executeSync: vi.fn(),
    };

    // Act
    const result = await reconcilePendingDashboardSync(mockSyncService as any);

    // Assert
    expect(result).toBeNull();
    expect(mockSyncService.executeSync).not.toHaveBeenCalled();
  });

  it('[@spec BBC-021:AUDIT-LOG-01] should record execution audit log on successful sync', async () => {
    const mockSyncService = {
      executeSync: vi.fn().mockResolvedValue({
        success: true,
        totalEntitiesSynced: 10,
        counts: { proyectos: 2 },
      }),
    };

    // Act
    const result = await triggerSyncAction({ source: 'TRAILING_EDGE' }, mockSyncService as any);

    // Assert
    expect(result.success).toBe(true);
    expect(recordSyncAuditLogInDb).toHaveBeenCalledWith(
      expect.objectContaining({
        triggerSource: 'TRAILING_EDGE',
        status: 'SUCCESS',
        isDeadLetter: false,
        totalEntitiesSynced: 10,
      })
    );
  });

  it('[@spec BBC-021:AUDIT-LOG-02] should record dead-letter log on sync error', async () => {
    const mockSyncService = {
      executeSync: vi.fn().mockRejectedValue(new Error('Simulated Drive API 500 error')),
    };

    // Act
    const result = await triggerSyncAction({ source: 'WEBHOOK' }, mockSyncService as any);

    // Assert
    expect(result.success).toBe(false);
    expect(recordSyncAuditLogInDb).toHaveBeenCalledWith(
      expect.objectContaining({
        triggerSource: 'WEBHOOK',
        status: 'FAILED',
        isDeadLetter: true,
        errorMessage: expect.stringContaining('Simulated Drive API 500 error'),
      })
    );
  });
});
