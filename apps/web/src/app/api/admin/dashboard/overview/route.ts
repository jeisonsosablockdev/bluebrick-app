import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { getAdminDashboardOverview } from "@/features/checkout-payment/application/purchase-metrics-service";

function readRange(value: string | null): "24h" | "7d" | "30d" {
  return value === "7d" || value === "30d" ? value : "24h";
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
    const range = readRange(request.nextUrl.searchParams.get("range"));
    const overview = await getAdminDashboardOverview({ range });

    return NextResponse.json({
      ok: true,
      data: overview
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load dashboard overview.";
    return NextResponse.json(
      {
        error: {
          code: "DASHBOARD_OVERVIEW_FAILED",
          message
        }
      },
      { status: 500 }
    );
  }
}
