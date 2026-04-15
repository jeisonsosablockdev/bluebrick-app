import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { listRecentAnalyticsEvents, summarizeAnalytics } from "@/lib/observability";
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

  const minutes = sanitizeInteger(request.nextUrl.searchParams.get("minutes"), 60, 1, 24 * 7);
  const limit = sanitizeInteger(request.nextUrl.searchParams.get("limit"), 30, 1, 200);

  const summary = summarizeAnalytics(minutes);
  const recentEvents = listRecentAnalyticsEvents(limit);

  return NextResponse.json(
    {
      ok: true,
      data: {
        summary,
        recentEvents
      }
    },
    {
      headers: {
        "cache-control": "no-store"
      }
    }
  );
}
