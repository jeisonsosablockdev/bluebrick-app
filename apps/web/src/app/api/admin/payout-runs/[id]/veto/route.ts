/**
 * =========================================================================================
 * Layer 2: Application / API Layer — Veto Distribution Item Route
 * Route: /api/admin/payout-runs/[id]/veto
 * Description: Granular pre-seal veto of an individual distribution item.
 *              Strictly prohibited post-seal.
 * =========================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getRequestRole } from "@/lib/auth-session";
import {
  vetoDistributionItem,
  PayoutSettlementFlowError
} from "@/features/staking-distribution/application/payout-settlement-flow";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const VetoSchema = z.object({
  itemId: z.string().min(1),
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
 * POST /api/admin/payout-runs/[id]/veto
 * What: Vetoes a specific item from an unsealed payout run.
 * How: Validates admin auth, parses itemId/reason, and executes veto in application service.
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
    const parsed = VetoSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, "INVALID_REQUEST_BODY", "Validation failed for veto request.");
    }

    // Step 4: Execute veto via application service
    const result = await vetoDistributionItem({
      runId: id,
      itemId: parsed.data.itemId,
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

    const message = error instanceof Error ? error.message : "Failed to veto distribution item.";
    return errorResponse(500, "VETO_ITEM_FAILED", message);
  }
}
