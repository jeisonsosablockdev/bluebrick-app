import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedPublicKeyFromRequest } from "@/lib/auth";
import { getOrCreateProfileBundle } from "@/features/profile/infrastructure/profile-repository";

function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message: "Wallet authentication is required."
      }
    },
    { status: 401 }
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const walletPublicKey = getAuthenticatedPublicKeyFromRequest(request);

  if (!walletPublicKey) {
    return unauthorizedResponse();
  }

  try {
    const profile = await getOrCreateProfileBundle(walletPublicKey);

    return NextResponse.json({
      ok: true,
      data: {
        kycStatus: profile.kycStatus,
        complianceStatus: profile.complianceStatus,
        rejectionReasonCode: profile.rejectionReasonCode,
        kycProviderSessionId: profile.kycProviderSessionId,
        kycProviderReportId: profile.kycProviderReportId,
        complianceStatusUpdatedAt: profile.complianceStatusUpdatedAt
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load KYC status.";

    return NextResponse.json(
      {
        error: {
          code: "KYC_STATUS_FETCH_FAILED",
          message
        }
      },
      { status: 500 }
    );
  }
}
