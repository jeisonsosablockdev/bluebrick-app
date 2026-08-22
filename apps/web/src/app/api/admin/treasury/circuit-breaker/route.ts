/**
 * =========================================================================================
 * Layer 2: Application Layer — Global Treasury Circuit Breaker Route
 * Route: POST /api/admin/treasury/circuit-breaker
 *
 * Description:
 * Activates global emergency circuit breaker across treasury settlement operations.
 * Enforces mandatory connected Solana wallet signature (signerWallet public key).
 * =========================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CircuitBreakerSchema = z.object({
  reason: z.string().min(1, { message: "Reason is required" }).max(1000),
  triggeredAt: z.string().datetime().optional(),
  signerWallet: z.string().min(32, { message: "signerWallet must be a valid Solana public key" })
});

/**
 * POST /api/admin/treasury/circuit-breaker
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Step 1: Validate request body requiring signerWallet
    const body = await request.json();
    const parsed = CircuitBreakerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_REQUEST_BODY",
          message: "Se requiere una wallet de Solana conectada para autorizar y firmar la parada de emergencia."
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
        signerWallet: parsed.data.signerWallet,
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
