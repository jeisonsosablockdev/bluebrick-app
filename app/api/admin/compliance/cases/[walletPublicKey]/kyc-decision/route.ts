import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { applyKycDecisionForComplianceCase, ComplianceCaseServiceError } from "@/lib/compliance/case-service";
import { getOnboardingRewardForWallet } from "@/lib/onboarding-reward-service";

type RouteParams = {
  params: Promise<{
    walletPublicKey: string;
  }>;
};

type KycDecisionBody = {
  decision?: unknown;
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

function normalizeBody(raw: unknown): { decision: "verified" | "rejected"; reason?: string } {
  if (!raw || typeof raw !== "object") {
    throw new ComplianceCaseServiceError("INVALID_BODY", "Request body must be an object.", 400);
  }

  const body = raw as KycDecisionBody;
  const decision = typeof body.decision === "string" ? body.decision.trim() : "";
  if (decision !== "verified" && decision !== "rejected") {
    throw new ComplianceCaseServiceError("INVALID_DECISION", "decision must be either verified or rejected.", 400);
  }

  const reason = typeof body.reason === "string" ? body.reason : undefined;
  return { decision, reason };
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin" || !role.pubkey) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    const { walletPublicKey } = await params;
    const body = normalizeBody(await request.json().catch(() => null));
    const result = await applyKycDecisionForComplianceCase({
      walletPublicKey,
      adminActorId: role.pubkey,
      decision: body.decision,
      reason: body.reason
    });
    await getOnboardingRewardForWallet(walletPublicKey);

    return NextResponse.json({
      ok: true,
      data: result
    });
  } catch (error) {
    if (error instanceof ComplianceCaseServiceError) {
      return errorResponse(error.status, error.code, error.message, error.details);
    }

    const message = error instanceof Error ? error.message : "Could not apply KYC admin decision.";
    return errorResponse(500, "KYC_DECISION_FAILED", message);
  }
}
