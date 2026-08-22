/**
 * =========================================================================================
 * Layer 2: Application / API Layer — Approve Payout Override Route
 * Route: /api/admin/compliance/overrides/[id]/approve
 * Description: Approves a pending payout override with multisig execution signature and optimistic locking.
 * =========================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getRequestRole } from "@/lib/auth-session";
import {
  approvePayoutOverrideWithMultisig,
  PayoutOverrideServiceError
} from "@/features/staking-distribution/application/payout-override-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ApproveOverrideSchema = z.object({
  expectedVersion: z.number().int().positive(),
  approvalTxSignature: z.string().min(32).max(128),
  isRunSealed: z.boolean().optional()
});

function errorResponse(status: number, code: string, message: string, details?: Record<string, unknown>): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: details ?? null
      }
    },
    { status }
  );
}

function jsonResponse(payload: unknown, status = 200): NextResponse {
  return new NextResponse(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

function getAdminActorId(request: NextRequest): string | null {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin") {
    return null;
  }

  return role.pubkey ?? "admin";
}

/**
 * POST /api/admin/compliance/overrides/[id]/approve
 * What: Approves a pending override with on-chain signature proof.
 * How: Validates expectedVersion and signature with Zod, then executes approvePayoutOverrideWithMultisig.
 */
export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  // Step 1: Enforce admin authorization
  const actorId = getAdminActorId(request);
  if (!actorId) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    // Step 2: Resolve dynamic route parameters
    const { id } = await context.params;

    // Step 3: Validate request body with Zod
    const body = await request.json();
    const parsed = ApproveOverrideSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, "INVALID_REQUEST_BODY", "Validation failed for override approval.", {
        issues: parsed.error.issues
      });
    }

    // Step 4: Execute approval in application domain service
    const approved = await approvePayoutOverrideWithMultisig({
      overrideId: id,
      expectedVersion: parsed.data.expectedVersion,
      approvedBy: actorId,
      approvalTxSignature: parsed.data.approvalTxSignature,
      isRunSealed: parsed.data.isRunSealed
    });

    return jsonResponse({
      ok: true,
      data: approved
    });
  } catch (error) {
    if (error instanceof PayoutOverrideServiceError) {
      return errorResponse(error.status, error.code, error.message, error.details);
    }

    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return errorResponse(500, "APPROVE_OVERRIDE_FAILED", message);
  }
}
