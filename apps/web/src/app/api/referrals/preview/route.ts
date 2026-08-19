import { NextRequest, NextResponse } from "next/server";

import { getReferralPreviewByCode } from "@/features/referral-marketing/application/preview-service";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code")?.trim() ?? "";

  if (!code) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_REFERRAL_CODE",
          message: "Referral code is required."
        }
      },
      { status: 400 }
    );
  }

  const preview = await getReferralPreviewByCode({ code });
  if (!preview) {
    return NextResponse.json(
      {
        error: {
          code: "REFERRAL_NOT_FOUND",
          message: "Referral code was not found."
        }
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: preview
  });
}
