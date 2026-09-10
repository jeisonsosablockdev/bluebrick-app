/**
 * ============================================================================
 * @file apps/web/src/features/ai-ingestion/application/actions/trigger-sync-action.ts
 * @description Layer 2: Application - On-Demand Sync Server Action
 * ============================================================================
 * Purpose: Provides an authenticated Server Action to trigger the Google Drive
 * Excel synchronization pipeline on-demand, both from administrative UI actions
 * and internal webhook dispatchers, with Next.js dashboard path revalidation.
 *
 * Invariants:
 *  - Layer 2 boundary: Coordinates application flow and services without UI rendering.
 *  - Zero direct UI or framework coupling except Server Action cache revalidation.
 *  - Enforces RBAC permissions when invoked in administrative user context.
 *  - Encapsulates DashboardSyncService execution and dependency assembly.
 *  - Revalidates Next.js dashboard cache path ('/dashboard') upon successful completion.
 *  - Fails safe with structured error payloads without throwing unhandled exceptions to UI.
 *
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 *
 * @spec BBC-021
 */

'use server';

import { revalidatePath } from 'next/cache';
import {
  DashboardSyncEntityCounts,
  DashboardSyncMetrics,
  type AcquireCooldownParams,
  type AcquireCooldownResult,
  type DashboardSyncState,
} from '../../domain/models/dashboard-sync-models';
import { verifyHitlPermission } from '../../domain/policies/hitl-rbac-policy';
import { DashboardSyncService } from '../services/dashboard-sync-service';
import { GoogleServiceAccountAdapter } from '../../infrastructure/google-service-account-adapter';
import { StreamingSpreadsheetAdapter } from '../../infrastructure/streaming-spreadsheet-adapter';
import { GoogleDriveFolderReaderAdapter } from '../../infrastructure/google-drive-folder-reader-adapter';
import { VercelBlobAdapter } from '../../infrastructure/vercel-blob-adapter';
import {
  fetchDashboardSyncStateFromDb,
  acquireCooldownOrMarkPendingInDb,
  markSyncStarted,
  markSyncCompleted,
  markSyncFailed,
  recordSyncAuditLogInDb,
} from '../../infrastructure/dashboard-sync-state-repository';
import { getDatabasePool } from '@/lib/infrastructure/db/neon-client';

/**
 * Resolves current persistent synchronization state from Layer 4 repository.
 */
export async function getDashboardSyncState(): Promise<DashboardSyncState> {
  return fetchDashboardSyncStateFromDb();
}

/**
 * Checks cooldown and atomically claims execution window or flags trailing-edge pending sync.
 *
 * @param params - Cooldown parameters (cooldownMinutes, source, force)
 */
export async function acquireCooldownOrMarkPending(
  params?: AcquireCooldownParams
): Promise<AcquireCooldownResult> {
  return acquireCooldownOrMarkPendingInDb(params);
}

/**
 * Trigger sync invocation options and context.
 */
export interface TriggerSyncParams {
  /** Source initiating the synchronization: UI admin action, webhook, trailing-edge reconciler, or cron */
  readonly source?: 'ADMIN_UI' | 'WEBHOOK' | 'MANUAL' | 'TRAILING_EDGE' | 'CRON';
  /** Optional user role for RBAC enforcement when triggered from UI */
  readonly userRole?: string;
  /** Optional specific spreadsheet file ID to sync */
  readonly fileId?: string;
  /** Optional flag to force refresh cached OAuth tokens */
  readonly forceRefreshAuth?: boolean;
  /** Optional flag to force immediate execution and bypass cooldown window */
  readonly force?: boolean;
}

/**
 * Standardized synchronization action response payload.
 */
export interface TriggerSyncResult {
  /** Execution outcome flag */
  readonly success: boolean;
  /** Human-readable status or error description */
  readonly message: string;
  /** ISO timestamp of completion */
  readonly timestamp?: string;
  /** Execution duration in milliseconds */
  readonly durationMs?: number;
  /** Total count of database entities upserted */
  readonly totalEntitiesSynced?: number;
  /** Count breakdown per operational table */
  readonly counts?: DashboardSyncEntityCounts;
  /** Operational latency metrics */
  readonly metrics?: DashboardSyncMetrics;
  /** Error diagnostic identifiers or validation failure messages */
  readonly errors?: readonly string[];
}


/**
 * Server action to execute the Google Drive dashboard Excel synchronization pipeline on-demand.
 *
 * @param params - Optional invocation parameters (source, role, fileId)
 * @param injectedSyncService - Optional injected DashboardSyncService instance for testing
 * @returns Standardized action result DTO
 */
export async function triggerSyncAction(
  params?: TriggerSyncParams,
  injectedSyncService?: DashboardSyncService
): Promise<TriggerSyncResult> {
  // Step 1: RBAC Permission Check when triggered from UI
  if (params?.source === 'ADMIN_UI' && params.userRole) {
    if (!verifyHitlPermission(params.userRole)) {
      return {
        success: false,
        message: 'Unauthorized: Only ADMIN or COMPLIANCE roles can trigger synchronization.',
        errors: ['UNAUTHORIZED_ROLE'],
      };
    }
  }

  // Step 2: Assemble synchronization service dependencies (or use injected)
  const startTime = Date.now();
  const syncId = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const triggerSource = params?.source ?? 'MANUAL';

  try {
    let syncService: DashboardSyncService;
    if (injectedSyncService) {
      syncService = injectedSyncService;
    } else {
      const authProvider = new GoogleServiceAccountAdapter({
        clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        privateKey: process.env.GOOGLE_PRIVATE_KEY,
      });

      syncService = new DashboardSyncService({
        authProvider,
        spreadsheetParser: new StreamingSpreadsheetAdapter(),
        dbPool: getDatabasePool(),
        folderReader: new GoogleDriveFolderReaderAdapter({ authProvider }),
        blobStorage: new VercelBlobAdapter(),
      });
    }

    // Step 3: Record sync started in persistent state
    try {
      await markSyncStarted(triggerSource, params?.fileId);
    } catch {
      // Non-fatal if state repository is unconfigured or in testing
    }

    // Step 4: Execute synchronization
    const result = await syncService.executeSync({
      fileId: params?.fileId,
      forceRefreshAuth: params?.forceRefreshAuth,
    });

    // Step 5: Mark sync completed in persistent state
    try {
      await markSyncCompleted();
    } catch {
      // Non-fatal
    }

    const durationMs = Date.now() - startTime;

    // Step 5.5: Record audit log in dashboard_sync_logs
    try {
      await recordSyncAuditLogInDb({
        syncId,
        triggerSource,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        status: 'SUCCESS',
        durationMs,
        totalEntitiesSynced: result.totalEntitiesSynced,
        entityCounts: result.counts as unknown as Record<string, number> | undefined,
        metrics: result.metrics as unknown as Record<string, number> | undefined,
        driveFileId: params?.fileId,
        isDeadLetter: false,
      });
    } catch {
      // Non-fatal
    }

    // Step 6: Invalidate Next.js dashboard cache for instant UI freshness
    try {
      revalidatePath('/dashboard');
    } catch {
      // Non-fatal if executed outside Next.js request context (e.g. unit tests)
    }

    // Step 7: Format and return successful result DTO
    return {
      success: true,
      message: `Dashboard synchronization completed successfully in ${durationMs}ms.`,
      timestamp: new Date().toISOString(),
      durationMs,
      totalEntitiesSynced: result.totalEntitiesSynced,
      counts: result.counts,
      metrics: result.metrics,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message =
      error instanceof Error ? error.message : 'Unexpected synchronization error';
    const isCircuitBreaker =
      message.includes('Circuit breaker') ||
      (error as any)?.code === 'CIRCUIT_BREAKER_TRIPPED';

    try {
      await markSyncFailed(message, isCircuitBreaker);
    } catch {
      // Non-fatal
    }

    // Step 5.6: Record dead-letter audit log in dashboard_sync_logs
    try {
      await recordSyncAuditLogInDb({
        syncId,
        triggerSource,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        status: isCircuitBreaker ? 'CIRCUIT_BREAKER_TRIPPED' : 'FAILED',
        durationMs,
        errorMessage: message,
        errorStack: error instanceof Error ? error.stack : undefined,
        circuitBreakerReason: isCircuitBreaker ? message : undefined,
        driveFileId: params?.fileId,
        isDeadLetter: true,
      });
    } catch {
      // Non-fatal
    }

    return {
      success: false,
      message: `Synchronization failed: ${message}`,
      timestamp: new Date().toISOString(),
      durationMs,
      errors: [message],
    };
  }
}

/**
 * Lazy reconciler called on dashboard page access (via Next.js after()) to process
 * pending trailing-edge synchronizations once their accumulation cooldown has elapsed.
 *
 * @param injectedSyncService - Optional injected DashboardSyncService for unit testing
 * @returns TriggerSyncResult if reconciliation ran, or null if no pending sync or still in cooldown
 */
export async function reconcilePendingDashboardSync(
  injectedSyncService?: DashboardSyncService
): Promise<TriggerSyncResult | null> {
  // Step 1: Query current persistent synchronization state
  const state = await fetchDashboardSyncStateFromDb();

  // Step 2: Check if there is a pending sync requested
  if (!state.pendingSync) {
    return null;
  }

  // Step 3: Check if cooldown has expired (cooldownUntil <= now or null)
  const now = new Date();
  if (state.cooldownUntil && state.cooldownUntil > now) {
    // Cooldown is still active, defer execution until future visits or nightly cron
    return null;
  }

  // Step 4: Dispatch trailing-edge synchronization
  return triggerSyncAction({ source: 'TRAILING_EDGE' }, injectedSyncService);
}
