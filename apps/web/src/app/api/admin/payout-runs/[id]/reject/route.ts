/**
 * =========================================================================================
 * Layer 2: Application / API Layer — Reject Payout Run Route
 * Route: /api/admin/payout-runs/[id]/reject
 * Description: Rejects an active payout run proposal and transitions status to blocked.
 *              Enforces admin authorization.
 * =========================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getRequestRole } from "@/lib/auth-session";
import {
  rejectPayoutRun,
  PayoutSettlementFlowError
} from "@/features/staking-distribution/application/payout-settlement-flow";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const RejectSchema = z.object({
  reason: z.string().min(1).max(1000)
});

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
 * POST /api/admin/payout-runs/[id]/reject
 * What: Globally rejects a payout run proposal.
 * How: Validates admin auth, parses reason, and calls rejectPayoutRun service.
 */
export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  // Step 1: Enforce admin authorization
  const auth = getRequestRole(request);
  if (!auth.authenticated || auth.role !== "admin") {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    // Step 2: Resolve dynamic route parameters
    const { id } = await context.params;

    // Step 3: Validate request body
    const body = await request.json();
    const parsed = RejectSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, "INVALID_REQUEST_BODY", "Validation failed for rejection request.");
    }

    // Step 4: Execute rejection via application service
    const result = await rejectPayoutRun({
      runId: id,
      adminActorId: auth.pubkey ?? "admin",
      reason: parsed.data.reason
    });

    return NextResponse.json({
      ok: true,
      data: result
    });
  } catch (error) {
    if (error instanceof PayoutSettlementFlowError) {
      return errorResponse(error.status, error.code, error.message);
    }

    const message = error instanceof Error ? error.message : "Failed to reject payout run.";
    return errorResponse(500, "REJECT_RUN_FAILED", message);
  }
}
