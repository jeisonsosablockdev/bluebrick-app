import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { ComplianceCaseServiceError, suspendComplianceCase } from "@/features/profile/application/case-service";

type RouteParams = {
  params: Promise<{
    walletPublicKey: string;
  }>;
};

type SuspendBody = {
  reason?: unknown;
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

function normalizeReason(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const body = raw as SuspendBody;
  return typeof body.reason === "string" ? body.reason : undefined;
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin" || !role.pubkey) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    const { walletPublicKey } = await params;
    const reason = normalizeReason(await request.json().catch(() => null));
    const result = await suspendComplianceCase({
      walletPublicKey,
      adminActorId: role.pubkey,
      reason
    });

    return NextResponse.json({
      ok: true,
      data: result
    });
  } catch (error) {
    if (error instanceof ComplianceCaseServiceError) {
      return errorResponse(error.status, error.code, error.message, error.details);
    }

    const message = error instanceof Error ? error.message : "Could not suspend compliance case.";
    return errorResponse(500, "COMPLIANCE_SUSPEND_FAILED", message);
  }
}
