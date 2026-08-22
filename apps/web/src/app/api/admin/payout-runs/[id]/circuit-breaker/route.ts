/**
 * =========================================================================================
 * Layer 2: Application / API Layer — Emergency Circuit Breaker Route
 * Route: /api/admin/payout-runs/[id]/circuit-breaker
 * Description: Activates dual-layer emergency circuit breaker (local bot stop + emergency pause payload).
 *              Enforces admin authorization.
 * =========================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getRequestRole } from "@/lib/auth-session";
import {
  triggerCircuitBreaker,
  PayoutSettlementFlowError
} from "@/features/staking-distribution/application/payout-settlement-flow";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const CircuitBreakerSchema = z.object({
  reason: z.string().min(1).max(1000),
  ttlSeconds: z.number().int().min(1).max(300).optional()
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
 * POST /api/admin/payout-runs/[id]/circuit-breaker
 * What: Triggers emergency circuit breaker for a payout run.
 * How: Validates admin auth, parses reason/ttl, and calls triggerCircuitBreaker.
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
    const parsed = CircuitBreakerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, "INVALID_REQUEST_BODY", "Validation failed for circuit breaker request.");
    }

    // Step 4: Execute circuit breaker via application service
    const result = await triggerCircuitBreaker({
      runId: id,
      adminActorId: auth.pubkey ?? "admin",
      reason: parsed.data.reason,
      ttlSeconds: parsed.data.ttlSeconds
    });

    return NextResponse.json({
      ok: true,
      data: result
    });
  } catch (error) {
    if (error instanceof PayoutSettlementFlowError) {
      return errorResponse(error.status, error.code, error.message);
    }

    const message = error instanceof Error ? error.message : "Failed to trigger circuit breaker.";
    return errorResponse(500, "CIRCUIT_BREAKER_FAILED", message);
  }
}
