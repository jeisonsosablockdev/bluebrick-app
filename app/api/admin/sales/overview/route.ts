import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { getAdminSalesOverview } from "@/lib/purchase-metrics-service";

function readRange(value: string | null): "24h" | "7d" | "30d" {
  return value === "7d" || value === "30d" ? value : "24h";
}

function readOptional(value: string | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
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
    const range = readRange(params.get("range"));
    const status = readOptional(params.get("status"));
    const wallet = readOptional(params.get("wallet"));
    const candyMachine = readOptional(params.get("candyMachine"));

    const overview = await getAdminSalesOverview({
      range,
      status,
      wallet,
      candyMachine
    });

    return NextResponse.json({
      ok: true,
      data: overview
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load sales overview.";
    return NextResponse.json(
      {
        error: {
          code: "SALES_OVERVIEW_FAILED",
          message
        }
      },
      { status: 500 }
    );
  }
}
