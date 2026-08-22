/**
 * =========================================================================================
 * Layer 2: Application / API Layer — Compliance Payout Overrides Route
 * Route: /api/admin/compliance/overrides
 * Description: Lists pending payout overrides (GET) and submits new wallet override requests (POST).
 *              Enforces strict administrative authorization and Zod schema validations.
 * =========================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getRequestRole } from "@/lib/auth-session";
import {
  listPendingOverridesForCompliance,
  requestPayoutOverride,
  PayoutOverrideServiceError
} from "@/features/staking-distribution/application/payout-override-service";

const RequestOverrideSchema = z.object({
  originalWallet: z.string().min(32).max(44),
  requestedWallet: z.string().min(32).max(44),
  caseNumber: z.string().min(1).max(64),
  reason: z.string().min(1).max(1000)
});

/**
 * Constructs a standardized JSON error response.
 * What: Formats HTTP error payload.
 * How: Returns NextResponse with error code, message, and details.
 */
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

/**
 * Returns a JSON response with proper headers.
 * What: Formats success payload.
 * How: Serializes payload to JSON string.
 */
function jsonResponse(payload: unknown, status = 200): NextResponse {
  return new NextResponse(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

/**
 * Resolves authenticated admin actor identifier.
 * What: Retrieves admin identity.
 * How: Inspects cryptographic session with getRequestRole.
 */
function getAdminActorId(request: NextRequest): string | null {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin") {
    return null;
  }

  return role.pubkey ?? "admin";
}

/**
 * GET /api/admin/compliance/overrides
 * What: Lists pending payout overrides for compliance queue.
 * How: Enforces admin auth and calls listPendingOverridesForCompliance.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Step 1: Enforce admin authorization
  const actorId = getAdminActorId(request);
  if (!actorId) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    // Step 2: Fetch pending overrides from application service
    const pendingOverrides = await listPendingOverridesForCompliance();

    return jsonResponse({
      ok: true,
      data: pendingOverrides
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load pending overrides.";
    return errorResponse(500, "LIST_OVERRIDES_FAILED", message);
  }
}

/**
 * POST /api/admin/compliance/overrides
 * What: Submits a new payout override request in PENDING status.
 * How: Validates body with Zod and invokes requestPayoutOverride.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Step 1: Enforce admin authorization
  const actorId = getAdminActorId(request);
  if (!actorId) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    // Step 2: Parse and validate JSON payload with Zod
    const body = await request.json();
    const parsed = RequestOverrideSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, "INVALID_REQUEST_BODY", "Validation failed for override request.", {
        issues: parsed.error.issues
      });
    }

    // Step 3: Request override via application domain service
    const override = await requestPayoutOverride({
      originalWallet: parsed.data.originalWallet,
      requestedWallet: parsed.data.requestedWallet,
      caseNumber: parsed.data.caseNumber,
      reason: parsed.data.reason,
      requestedBy: actorId
    });

    return jsonResponse(
      {
        ok: true,
        data: override
      },
      201
    );
  } catch (error) {
    if (error instanceof PayoutOverrideServiceError) {
      return errorResponse(error.status, error.code, error.message, error.details);
    }

    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return errorResponse(500, "CREATE_OVERRIDE_FAILED", message);
  }
}
