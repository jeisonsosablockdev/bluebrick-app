import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { ComplianceCaseServiceError, getComplianceCasesQueue } from "@/features/profile/application/case-service";

function toOptionalString(value: string | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function toOptionalPositiveInt(value: string | null): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin") {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    const status = toOptionalString(request.nextUrl.searchParams.get("status"));
    const cursor = toOptionalString(request.nextUrl.searchParams.get("cursor"));
    const limit = toOptionalPositiveInt(request.nextUrl.searchParams.get("limit"));
    const result = await getComplianceCasesQueue({ status, cursor, limit });

    return NextResponse.json({
      ok: true,
      data: result
    });
  } catch (error) {
    if (error instanceof ComplianceCaseServiceError) {
      return errorResponse(error.status, error.code, error.message, error.details);
    }

    const message = error instanceof Error ? error.message : "Could not load compliance cases.";
    return errorResponse(500, "COMPLIANCE_CASES_FETCH_FAILED", message);
  }
}
