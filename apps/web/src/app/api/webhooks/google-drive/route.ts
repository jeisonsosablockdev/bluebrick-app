/**
 * ============================================================================
 * @file apps/web/src/app/api/webhooks/google-drive/route.ts
 * @description Layer 1: Presentation - Google Drive Webhook Route Handler
 * ============================================================================
 * Purpose: Provides a secured, low-latency HTTP POST endpoint invoked by Google
 * Drive push notifications (or Google Apps Script triggers) to execute on-demand
 * Excel dashboard synchronization upon spreadsheet edits.
 *
 * Invariants:
 *  - Layer 1 boundary: Strictly isolates HTTP transport concerns from business logic.
 *  - Zero direct database access: Must NEVER import 'pg', neon, or database drivers directly.
 *  - Consumes exclusively Layer 2 Application Actions / Services via @/features/ai-ingestion.
 *  - Secures endpoint using constant-time verification against DRIVE_WEBHOOK_SECRET.
 *  - Immediate acknowledgment: Responds 200 OK within <150ms to satisfy Google webhook SLAs.
 *  - Debounce protection: Rejects or ignores redundant concurrent triggers within debounce window.
 *  - Configured with maxDuration = 60s and dynamic = 'force-dynamic' for Vercel Serverless.
 *
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 *
 * @spec BBC-021
 */

import { type NextRequest, NextResponse, after } from 'next/server';
import {
  triggerSyncAction,
  verifyWebhookSecret,
  acquireCooldownOrMarkPending,
} from '@/features/ai-ingestion';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Resolves the accumulation cooldown window in minutes from environment variables (defaults to 30 minutes) */
export function getCooldownWindowMinutes(): number {
  const envMinutes = process.env.SYNC_COOLDOWN_MINUTES;
  const minutes = envMinutes ? parseInt(envMinutes, 10) : 30;
  return !Number.isNaN(minutes) && minutes > 0 ? minutes : 30;
}

/**
 * Handles incoming webhook POST requests from Google Drive or Google Apps Script triggers.
 *
 * @param request - Incoming NextRequest with Google Drive headers and payload
 * @returns NextResponse acknowledging receipt or reporting authorization errors
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Step 1: Extract Google Drive push headers and authorization credentials
  const authHeader = request.headers.get('authorization');
  const channelToken = request.headers.get('x-goog-channel-token');
  const customSecret = request.headers.get('x-bluebrick-webhook-secret');
  const resourceState = request.headers.get('x-goog-resource-state');
  const forceHeader = request.headers.get('x-force-sync');
  const expectedSecret = process.env.DRIVE_WEBHOOK_SECRET;

  // Step 2: Constant-time authorization verification via Layer 2 validator
  const isAuthorized = verifyWebhookSecret({
    authHeader,
    channelToken,
    customSecretHeader: customSecret,
    expectedSecret,
  });

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing webhook authorization credentials' },
      { status: 401 }
    );
  }

  // Step 3: Handle Google Drive subscription verification ping (handshake)
  if (resourceState === 'sync') {
    return NextResponse.json(
      {
        status: 'ready',
        message: 'Google Drive webhook channel handshake verified successfully.',
      },
      { status: 200 }
    );
  }

  // Step 3.5: Extract dynamic target fileId if provided in request payload or query parameters
  let targetFileId: string | undefined;
  try {
    const payload = await request.clone().json().catch(() => null);
    if (payload?.fileId && typeof payload.fileId === 'string' && payload.fileId.trim() !== '') {
      targetFileId = payload.fileId.trim();
    }
  } catch {
    // Non-fatal if payload is empty or not JSON
  }
  if (!targetFileId) {
    const queryFileId = request.nextUrl?.searchParams?.get('fileId');
    if (queryFileId && typeof queryFileId === 'string' && queryFileId.trim() !== '') {
      targetFileId = queryFileId.trim();
    }
  }

  // Step 4: Distributed persistent cooldown enforcement (default: 30 minutes)
  const isForce = forceHeader === 'true' || request.nextUrl?.searchParams?.get('force') === 'true';
  const cooldownMinutes = getCooldownWindowMinutes();

  const cooldownResult = await acquireCooldownOrMarkPending({
    cooldownMinutes,
    source: 'WEBHOOK',
    force: isForce,
  });

  // If inside cooldown and not forced, return 200 OK with pending flag and exit in <50ms
  if (!cooldownResult.acquired) {
    return NextResponse.json(
      {
        status: 'cooldown',
        pending: true,
        cooldownUntil: cooldownResult.cooldownUntil,
        message: cooldownResult.message ?? 'Synchronization cooldown active. Changes marked pending.',
      },
      { status: 200 }
    );
  }

  // Step 5: Schedule background synchronization via Layer 2 without blocking HTTP response
  try {
    after(async () => {
      try {
        await triggerSyncAction({ source: 'WEBHOOK', fileId: targetFileId, force: isForce });
      } catch (err) {
        console.error('[GoogleDriveWebhook] Background synchronization error:', err);
      }
    });
  } catch {
    // Non-request context fallback (e.g. test harness / synthetic invokes)
    void triggerSyncAction({ source: 'WEBHOOK', fileId: targetFileId, force: isForce }).catch((err) => {
      console.error('[GoogleDriveWebhook] Background execution failed:', err);
    });
  }

  // Step 6: Return immediate 200 OK acknowledgment within Google webhook SLA (<150ms)
  return NextResponse.json(
    {
      success: true,
      status: 'sync_dispatched',
      cooldownUntil: cooldownResult.cooldownUntil,
      message: 'Google Drive webhook received; background synchronization dispatched.',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
