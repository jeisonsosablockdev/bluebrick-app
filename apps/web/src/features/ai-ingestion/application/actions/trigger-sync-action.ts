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
} from '../../domain/models/dashboard-sync-models';
import { verifyHitlPermission } from '../../domain/policies/hitl-rbac-policy';
import { DashboardSyncService } from '../services/dashboard-sync-service';
import { GoogleServiceAccountAdapter } from '../../infrastructure/google-service-account-adapter';
import { StreamingSpreadsheetAdapter } from '../../infrastructure/streaming-spreadsheet-adapter';
import { GoogleDriveFolderReaderAdapter } from '../../infrastructure/google-drive-folder-reader-adapter';
import { VercelBlobAdapter } from '../../infrastructure/vercel-blob-adapter';
import { getDatabasePool } from '@/lib/infrastructure/db/neon-client';

/**
 * Trigger sync invocation options and context.
 */
export interface TriggerSyncParams {
  /** Source initiating the synchronization: UI admin action, webhook, or script */
  readonly source?: 'ADMIN_UI' | 'WEBHOOK' | 'MANUAL';
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
 * Supports standard Bearer authorization header or Google's X-Goog-Channel-Token header.
 *
 * @param authHeader - Raw Authorization HTTP header (e.g., 'Bearer <secret>')
 * @param channelToken - Optional Google Drive channel token header ('X-Goog-Channel-Token')
 * @param expectedSecret - Configured DRIVE_WEBHOOK_SECRET environment variable
 * @returns True if authorization credentials match in constant time
 */
export function verifyWebhookSecret(
  authHeader: string | null | undefined,
  channelToken: string | null | undefined,
  expectedSecret: string | undefined
): boolean {
  // Step 1: Fail closed if expected secret is not configured in environment
  if (!expectedSecret || typeof expectedSecret !== 'string') {
    return false;
  }

  // Step 2: Check X-Goog-Channel-Token header first if provided
  if (channelToken && typeof channelToken === 'string') {
    if (constantTimeCompare(channelToken.trim(), expectedSecret)) {
      return true;
    }
  }

  // Step 3: Check Authorization Bearer header
  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.trim().split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return constantTimeCompare(parts[1], expectedSecret);
    }
  }

  // Step 4: Reject any request that did not match either token format
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
  try {
    const authProvider = new GoogleServiceAccountAdapter({
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY,
    });

    const syncService =
      injectedSyncService ??
      new DashboardSyncService({
        authProvider,
        spreadsheetParser: new StreamingSpreadsheetAdapter(),
        dbPool: getDatabasePool(),
        folderReader: new GoogleDriveFolderReaderAdapter({ authProvider }),
        blobStorage: new VercelBlobAdapter(),
      });

    // Step 3: Execute synchronization
    const result = await syncService.executeSync({
      fileId: params?.fileId,
      forceRefreshAuth: params?.forceRefreshAuth,
    });

    // Step 4: Invalidate Next.js dashboard cache for instant UI freshness
    try {
      revalidatePath('/dashboard');
    } catch {
      // Non-fatal if executed outside Next.js request context (e.g. unit tests)
    }

    const durationMs = Date.now() - startTime;

    // Step 5: Format and return successful result DTO
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

    return {
      success: false,
      message: `Synchronization failed: ${message}`,
      timestamp: new Date().toISOString(),
      durationMs,
      errors: [message],
    };
  }
}
