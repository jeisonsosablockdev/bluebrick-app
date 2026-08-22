/**
 * =========================================================================================
 * Layer 2: Application / API Layer — Compliance TTL Retention Cron Route
 * Route: /api/cron/compliance-ttl
 * Description: Background cron handler to auto-clawback compliance hold funds older than 12 months.
 *              Enforces timing-safe CRON_SECRET authorization.
 * =========================================================================================
 */

import { NextRequest, NextResponse } from "next/server";

import {
  runComplianceHoldTtlMonitor,
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
 * Executes the 12-month compliance hold TTL monitor.
 * What: Handles cron trigger.
 * How: Verifies cron secret and calls runComplianceHoldTtlMonitor.
 */
async function handleCronExecution(request: NextRequest): Promise<NextResponse> {
  // Step 1: Enforce timing-safe cron authentication
  const authHeader = request.headers.get("authorization");
  if (!verifyCronSecret(authHeader)) {
    return errorResponse(401, "UNAUTHORIZED", "Invalid or missing cron authorization secret.");
  }

  try {
    // Step 2: Execute compliance hold TTL background worker
    const summary = await runComplianceHoldTtlMonitor();

    return NextResponse.json({
      ok: true,
      data: summary
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Compliance TTL monitor run failed.";
    return errorResponse(500, "COMPLIANCE_TTL_CRON_FAILED", message);
  }
}

/**
 * GET /api/cron/compliance-ttl
 * What: Cron trigger endpoint (GET).
 * How: Delegates to handleCronExecution.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleCronExecution(request);
}

/**
 * POST /api/cron/compliance-ttl
 * What: Cron trigger endpoint (POST).
 * How: Delegates to handleCronExecution.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleCronExecution(request);
}
