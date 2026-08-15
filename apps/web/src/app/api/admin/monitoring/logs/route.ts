import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { listOperabilityLogs } from "@/lib/observability";
import { sanitizeInteger } from "@/lib/security";

function forbiddenResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "FORBIDDEN",
        message: "Admin role is required."
      }
    },
    { status: 403 }
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated || requestRole.role !== "admin") {
    return forbiddenResponse();
  }

  const limit = sanitizeInteger(request.nextUrl.searchParams.get("limit"), 100, 1, 200);
  const entries = listOperabilityLogs(limit);

  return NextResponse.json(
    {
      ok: true,
      data: {
        entries
      }
    },
    {
      headers: {
        "cache-control": "no-store"
      }
    }
  );
}
