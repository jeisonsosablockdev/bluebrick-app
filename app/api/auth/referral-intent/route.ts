import { NextRequest, NextResponse } from "next/server";

import { resolveAppAuthContext } from "@/lib/app-auth";
import { upsertReferralIntentForAccount } from "@/features/referral-marketing/infrastructure/referrals-repository";
import { normalizeReferralAttributionSource, type ReferralAttributionSource } from "@/features/referral-marketing/domain/referrals-domain";

type ReferralIntentRequestBody = {
  referralCode?: unknown;
  attributionSource?: unknown;
  capturedAt?: unknown;
  metadata?: unknown;
};

function invalidRequest(message = "Invalid request body."): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as ReferralIntentRequestBody | null;

  if (!body || typeof body.referralCode !== "string") {
    return invalidRequest();
  }

  const auth = await resolveAppAuthContext();
  if (!auth.federatedAuthenticated || !auth.accountAuthenticated || !auth.accountId) {
    return NextResponse.json({ error: "An active account session is required." }, { status: 401 });
  }

  if (auth.walletAuthenticated) {
    return NextResponse.json(
      { error: "Referral intents are only accepted before a wallet-authenticated session exists." },
      { status: 409 }
    );
  }

  const attributionSource = normalizeReferralAttributionSource(
    typeof body.attributionSource === "string"
      ? (body.attributionSource as ReferralAttributionSource)
      : "unknown"
  );

  const result = await upsertReferralIntentForAccount({
    accountId: auth.accountId,
    referralCode: body.referralCode,
    attributionSource,
    capturedAt: typeof body.capturedAt === "string" ? body.capturedAt : undefined,
    metadata:
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : undefined
  });

  if (result.outcome === "rejected_invalid_code") {
    return NextResponse.json(
      { error: "Referral code is invalid.", referralCode: result.referralCode },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    intent: result.intent
  });
}
