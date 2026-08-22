/**
 * =========================================================================================
 * Layer 2: Application / API Layer — Single Distribution Run Detail Endpoint
 * Route: GET /api/admin/distributions/runs/[runId]
 * Description: Retrieves detailed snapshot, status, and verification metrics for a specific
 *              distribution run by ID. Enforces strict administrative role authorization.
 * =========================================================================================
 */

import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  getDistributionRunDetailForAdmin
} from "@/features/staking-distribution/application/distribution-service";

type RouteContext = {
  params: Promise<{
    runId: string;
  }>;
};

/**
 * Standard error response formatter for API routes.
 */
function errorResponse(status: number, code: string, message: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: null
      }
    },
    { status }
  );
}

/**
 * JSON response serializer handling bigints safely.
 */
function jsonResponse(payload: unknown, status = 200): NextResponse {
  return new NextResponse(JSON.stringify(payload, bigintJsonReplacer), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

function bigintJsonReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}

/**
 * Validates request authentication and extracts administrative actor identity.
 */
function getAdminActorId(request: NextRequest): string | null {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin") {
    return null;
  }

  return role.pubkey ?? "admin";
}

/**
 * GET handler: Fetches a single distribution run by ID.
 */
export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  // Step 1: Enforce admin role authentication
  const actorId = getAdminActorId(request);
  if (!actorId) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  // Step 2: Resolve asynchronous route parameters
  const { runId } = await context.params;

  // Step 3: Fetch distribution run record from application service
  const run = await getDistributionRunDetailForAdmin(runId);

  // Step 4: Validate entity existence (404 Fail-Safe)
  if (!run) {
    return errorResponse(404, "RUN_NOT_FOUND", `Distribution run ${runId} was not found.`);
  }

  // Step 5: Return successful JSON response
  return jsonResponse({
    ok: true,
    data: run
  });
}
