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
  type TriggerSyncResult,
} from '@/features/ai-ingestion';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Resolves the accumulation cooldown window in milliseconds from environment variables (defaults to 30 minutes) */
export function getCooldownWindowMs(): number {
  const envMinutes = process.env.SYNC_COOLDOWN_MINUTES;
  const minutes = envMinutes ? parseInt(envMinutes, 10) : 30;
  return (!Number.isNaN(minutes) && minutes > 0 ? minutes : 30) * 60 * 1000;
}

/** Timestamp of the last accepted sync invocation */
let lastSyncTimestamp = 0;

/** Resets the in-memory cooldown timestamp (exposed for unit testing) */
export function resetLastSyncTimestampForTesting(): void {
  lastSyncTimestamp = 0;
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
  const resourceState = request.headers.get('x-goog-resource-state');
  const expectedSecret = process.env.DRIVE_WEBHOOK_SECRET;

  // Step 2: Constant-time authorization verification via Layer 2 validator
  const isAuthorized = verifyWebhookSecret(authHeader, channelToken, expectedSecret);
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

  // Step 4: Cooldown enforcement (default: 30 minutes) to consolidate changes and protect Vercel quota
  const now = Date.now();
  const cooldownWindowMs = getCooldownWindowMs();
  if (now - lastSyncTimestamp < cooldownWindowMs) {
    const elapsedMinutes = Math.round((now - lastSyncTimestamp) / 60000);
    const totalMinutes = Math.round(cooldownWindowMs / 60000);
    return NextResponse.json(
      {
        status: 'cooldown',
        message: `Synchronization cooldown active (${elapsedMinutes}/${totalMinutes} min). Changes consolidated for next run.`,
      },
      { status: 200 }
    );
  }
  lastSyncTimestamp = now;

  // Step 5: Schedule background synchronization via Layer 2 without blocking HTTP response
  try {
    after(async () => {
      try {
        await triggerSyncAction({ source: 'WEBHOOK' });
      } catch (err) {
        console.error('[GoogleDriveWebhook] Background synchronization error:', err);
      }
    });
  } catch {
    // Non-request context fallback (e.g. test harness / synthetic invokes)
    void triggerSyncAction({ source: 'WEBHOOK' }).catch((err) => {
      console.error('[GoogleDriveWebhook] Background execution failed:', err);
    });
  }

  // Step 6: Return immediate 200 OK acknowledgment within Google webhook SLA (<150ms)
  return NextResponse.json(
    {
      success: true,
      message: 'Google Drive webhook received; background synchronization dispatched.',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
