/**
 * =========================================================================================
 * Layer 2: Application / API Layer — Cancel Claim Request Route
 * Route: /api/claims/[claimId]/cancel
 * Description: Allows authenticated user to cancel an active claim request in quote_created
 *              or claim_requested status.
 * =========================================================================================
 */

import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  cancelClaimQuote,
  ClaimFlowError
} from "@/features/staking-distribution/application/claim-flow";

type RouteContext = {
  params: Promise<{
    claimId: string;
  }>;
};

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
 * POST /api/claims/[claimId]/cancel
 * What: Cancels a pending user claim request.
 * How: Verifies session authentication, validates ownership, and updates status to canceled.
 */
export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  // Step 1: Enforce user session authentication
  const auth = getRequestRole(request);
  if (!auth.authenticated || !auth.pubkey) {
    return errorResponse(401, "UNAUTHORIZED", "Authentication required to cancel a claim request.");
  }

  try {
    // Step 2: Resolve asynchronous dynamic route parameter
    const { claimId } = await context.params;

    if (!claimId || claimId.trim() === "") {
      return errorResponse(400, "INVALID_CLAIM_ID", "claimId parameter is required.");
    }

    // Step 3: Execute cancellation in application service
    const canceled = await cancelClaimQuote({
      claimId: claimId.trim(),
      userWallet: auth.pubkey
    });

    return NextResponse.json({
      ok: true,
      data: canceled
    });
  } catch (error) {
    if (error instanceof ClaimFlowError) {
      if (error.code === "FORBIDDEN_OWNERSHIP") {
        return errorResponse(403, error.code, error.message);
      }
      if (error.code === "CLAIM_NOT_FOUND") {
        return errorResponse(404, error.code, error.message);
      }
      if (error.code === "INVALID_CLAIM_STATUS") {
        return errorResponse(400, error.code, error.message);
      }
      return errorResponse(400, error.code, error.message);
    }

    const message = error instanceof Error ? error.message : "Failed to cancel claim request.";
    return errorResponse(500, "CANCEL_CLAIM_FAILED", message);
  }
}
