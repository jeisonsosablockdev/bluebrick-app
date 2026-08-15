import { NextRequest, NextResponse } from "next/server";

import { buildHealthSnapshot, recordOperabilityLog } from "@/lib/observability";
import { sanitizeInteger } from "@/lib/security";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const minutes = sanitizeInteger(request.nextUrl.searchParams.get("minutes"), 60, 1, 24 * 7);
  const snapshot = buildHealthSnapshot({ analyticsWindowMinutes: minutes });

  recordOperabilityLog({
    level: snapshot.status === "ok" ? "info" : "warn",
    event: "health.snapshot",
    message: "Health endpoint requested.",
    context: {
      status: snapshot.status,
      analyticsWindowMinutes: snapshot.observability.analyticsWindowMinutes,
      analyticsTotalEvents: snapshot.observability.analyticsTotalEvents
    }
  });

  return NextResponse.json(
    {
      ok: snapshot.status === "ok",
      data: snapshot
    },
    {
      status: snapshot.status === "ok" ? 200 : 503,
      headers: {
        "cache-control": "no-store"
      }
    }
  );
}
