import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  DistributionServiceError,
  finalizePreparedDistributionRun
} from "@/lib/distributions/distribution-service";

type RouteContext = {
  params: Promise<{
    runId: string;
  }>;
};

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

function getAdminActorId(request: NextRequest): string | null {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin") {
    return null;
  }

  return role.pubkey ?? "admin";
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const actorId = getAdminActorId(request);
  if (!actorId) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    const { runId } = await context.params;
    const body = await request.json();
    const run = await finalizePreparedDistributionRun({
      runId,
      outputChecksum: body.outputChecksum,
      actorId
    });

    return jsonResponse({
      ok: true,
      data: run
    });
  } catch (error) {
    if (error instanceof DistributionServiceError) {
      return errorResponse(error.status, error.code, error.message, error.details);
    }

    const message = error instanceof Error ? error.message : "Could not finalize distribution run.";
    return errorResponse(500, "DISTRIBUTION_RUN_FINALIZE_FAILED", message);
  }
}
