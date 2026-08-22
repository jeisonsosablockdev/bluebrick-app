/**
 * =========================================================================================
 * Layer 2: Application / API Layer — Claims Expiry Cron Route
 * Route: /api/cron/claims-expiry
 * Description: Background cron handler to expire stale claims quotes older than 48 hours.
 *              Enforces timing-safe CRON_SECRET authorization.
 * =========================================================================================
 */

import { NextRequest, NextResponse } from "next/server";

import {
  runClaims48hExpiryMonitor,
  verifyCronSecret
} from "@/features/staking-distribution/application/compliance-monitor";

/**
 * Constructs a standardized JSON error response.
 * What: Formats HTTP error response.
 * How: Returns NextResponse with error code and status.
 */
function errorResponse(status: number, code: string, message: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message
      }
    },
    { status }
  );
}

/**
 * Executes the 48-hour claims expiry monitor.
 * What: Handles cron trigger.
 * How: Verifies cron secret and calls runClaims48hExpiryMonitor.
 */
async function handleCronExecution(request: NextRequest): Promise<NextResponse> {
  // Step 1: Enforce timing-safe cron authentication
  const authHeader = request.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return errorResponse(401, "UNAUTHORIZED", "Invalid or missing cron authorization secret.");
  }

  try {
    // Step 2: Execute claims expiry background worker
    const summary = await runClaims48hExpiryMonitor();

    return NextResponse.json({
      ok: true,
      data: summary
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Claims expiry monitor run failed.";
    return errorResponse(500, "CLAIMS_EXPIRY_CRON_FAILED", message);
  }
}

/**
 * GET /api/cron/claims-expiry
 * What: Cron trigger endpoint (GET).
 * How: Delegates to handleCronExecution.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleCronExecution(request);
}

/**
 * POST /api/cron/claims-expiry
 * What: Cron trigger endpoint (POST).
 * How: Delegates to handleCronExecution.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleCronExecution(request);
}
