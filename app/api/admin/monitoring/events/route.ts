import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { getAdminMonitoringEvents } from "@/lib/purchase-metrics-service";

function readOptional(value: string | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function readPositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin") {
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

  try {
    const params = request.nextUrl.searchParams;
    const payload = await getAdminMonitoringEvents({
      eventType: readOptional(params.get("eventType")),
      status: readOptional(params.get("status")),
      wallet: readOptional(params.get("wallet")),
      asset: readOptional(params.get("asset")),
      signature: readOptional(params.get("signature")),
      page: readPositiveInt(params.get("page"), 1),
      limit: readPositiveInt(params.get("limit"), 20)
    });

    return NextResponse.json({
      ok: true,
      data: payload
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load monitoring events.";
    return NextResponse.json(
      {
        error: {
          code: "MONITORING_EVENTS_FAILED",
          message
        }
      },
      { status: 500 }
    );
  }
}
