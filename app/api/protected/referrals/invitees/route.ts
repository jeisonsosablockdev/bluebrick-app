import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedPublicKeyFromRequest } from "@/lib/auth";
import { listReferralDashboardInvitees } from "@/lib/referrals/dashboard-service";
import { sanitizeInteger } from "@/lib/security";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

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

  const limit = sanitizeInteger(request.nextUrl.searchParams.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT);
  const offset = sanitizeInteger(request.nextUrl.searchParams.get("offset"), 0, 0, Number.MAX_SAFE_INTEGER);
  const inviteesPage = await listReferralDashboardInvitees({
    referrerWalletPublicKey: walletPublicKey,
    limit,
    offset
  });

  return NextResponse.json(
    {
      ok: true,
      data: inviteesPage
    },
    {
      headers: {
        "cache-control": "no-store"
      }
    }
  );
}
