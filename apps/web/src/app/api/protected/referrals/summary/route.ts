import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedPublicKeyFromRequest } from "@/lib/auth";
import { getReferralDashboardSummary } from "@/lib/referrals/dashboard-service";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const walletPublicKey = getAuthenticatedPublicKeyFromRequest(request);
  if (!walletPublicKey) {
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

  const summary = await getReferralDashboardSummary({
    referrerWalletPublicKey: walletPublicKey
  });

  return NextResponse.json({
    ok: true,
    data: summary
  });
}
