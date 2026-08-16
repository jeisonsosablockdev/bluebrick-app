import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { ComplianceCaseServiceError, getComplianceCaseByWallet } from "@/features/profile/application/case-service";

type RouteParams = {
  params: Promise<{
    walletPublicKey: string;
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

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin") {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    const { walletPublicKey } = await params;
    const detail = await getComplianceCaseByWallet(walletPublicKey);

    return NextResponse.json({
      ok: true,
      data: detail
    });
  } catch (error) {
    if (error instanceof ComplianceCaseServiceError) {
      return errorResponse(error.status, error.code, error.message, error.details);
    }

    const message = error instanceof Error ? error.message : "Could not load compliance case detail.";
    return errorResponse(500, "COMPLIANCE_CASE_DETAIL_FAILED", message);
  }
}
