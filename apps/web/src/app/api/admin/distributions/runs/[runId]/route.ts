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

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const actorId = getAdminActorId(request);
  if (!actorId) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  const { runId } = await context.params;
  const run = await getDistributionRunDetailForAdmin(runId);

  if (!run) {
    return errorResponse(404, "RUN_NOT_FOUND", `Distribution run ${runId} was not found.`);
  }

  return jsonResponse({
    ok: true,
    data: run
  });
}
