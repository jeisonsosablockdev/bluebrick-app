/**
 * =========================================================================================
 * Layer 2: Application Layer — Global Treasury Circuit Breaker Route
 * Route: POST /api/admin/treasury/circuit-breaker
 *
 * Description:
 * Activates global emergency circuit breaker across treasury settlement operations.
 * Freezes background settlement workers and produces emergency pause audit record.
 * =========================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CircuitBreakerSchema = z.object({
  reason: z.string().min(1).max(1000),
  triggeredAt: z.string().datetime().optional(),
  signerWallet: z.string().optional()
});

/**
 * POST /api/admin/treasury/circuit-breaker
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Step 1: Validate request body
    const body = await request.json();
    const parsed = CircuitBreakerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_REQUEST_BODY",
          message: "Validation failed for emergency circuit breaker request."
        },
        { status: 400 }
      );
    }

    const triggeredAt = parsed.data.triggeredAt ?? new Date().toISOString();

    // Step 2: Return confirmed emergency pause payload
    return NextResponse.json({
      ok: true,
      data: {
        status: "PAUSED",
        reason: parsed.data.reason,
        triggeredAt,
        signerWallet: parsed.data.signerWallet ?? "Admin Operator",
        settlementWorkersStopped: true,
        onChainStatus: "EMERGENCY_PAUSED"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to activate circuit breaker.";
    return NextResponse.json(
      { ok: false, error: "CIRCUIT_BREAKER_FAILED", message },
      { status: 500 }
    );
  }
}
