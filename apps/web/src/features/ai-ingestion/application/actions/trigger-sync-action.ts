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
  constantTimeCompare,
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
 * Webhook incoming authentication credentials container.
 */
export interface WebhookCredentials {
  readonly authHeader?: string | null;
  readonly channelToken?: string | null;
  readonly customSecretHeader?: string | null;
  readonly expectedSecret?: string;
}

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
 * Verifies that an incoming webhook request provides valid credentials matching DRIVE_WEBHOOK_SECRET.
 * Supports standard Bearer authorization header, Google's X-Goog-Channel-Token header,
 * or custom x-bluebrick-webhook-secret header from Google Apps Script.
 *
 * @param authHeaderOrCreds - Raw Authorization HTTP header or structured WebhookCredentials
 * @param channelToken - Optional Google Drive channel token header ('X-Goog-Channel-Token')
 * @param expectedSecret - Configured DRIVE_WEBHOOK_SECRET environment variable
 * @param customSecretHeader - Optional custom secret header ('x-bluebrick-webhook-secret')
 * @returns True if authorization credentials match in constant time
 */
export function verifyWebhookSecret(
  authHeaderOrCreds: string | WebhookCredentials | null | undefined,
  channelToken?: string | null | undefined,
  expectedSecret?: string | undefined,
  customSecretHeader?: string | null | undefined
): boolean {
  let authHeader: string | null | undefined;
  let token: string | null | undefined;
  let customHeader: string | null | undefined;
  let secret: string | undefined;

  // Step 1: Normalize arguments depending on invocation signature
  if (typeof authHeaderOrCreds === 'object' && authHeaderOrCreds !== null) {
    authHeader = authHeaderOrCreds.authHeader;
    token = authHeaderOrCreds.channelToken;
    customHeader = authHeaderOrCreds.customSecretHeader;
    secret = authHeaderOrCreds.expectedSecret ?? process.env.DRIVE_WEBHOOK_SECRET;
  } else {
    authHeader = authHeaderOrCreds;
    token = channelToken;
    secret = expectedSecret ?? process.env.DRIVE_WEBHOOK_SECRET;
    customHeader = customSecretHeader;
  }

  // Step 2: Fail closed if expected secret is not configured
  if (!secret || typeof secret !== 'string') {
    return false;
  }

  // Step 3: Check custom Apps Script header if provided
  if (customHeader && typeof customHeader === 'string') {
    if (constantTimeCompare(customHeader.trim(), secret)) {
      return true;
    }
  }

  // Step 4: Check X-Goog-Channel-Token header if provided
  if (token && typeof token === 'string') {
    if (constantTimeCompare(token.trim(), secret)) {
      return true;
    }
  }

  // Step 5: Check Authorization Bearer header
  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.trim().split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return constantTimeCompare(parts[1], secret);
    }
  }

  // Step 6: Reject any request that did not match any token format
  return false;
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
