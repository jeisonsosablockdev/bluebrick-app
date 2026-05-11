import { NextRequest, NextResponse } from "next/server";

import { ensureWalletFirstAccount } from "@/lib/accounts/repository";
import { clearNonceCookie, getNonceFromRequest, getRequestHost, setSessionCookie, verifySiwsPayload } from "@/lib/auth";
import { isWalletRegistered } from "@/lib/compliance/profile-repository";
import { ensureOnboardingRewardRegistered } from "@/lib/onboarding-reward-service";
import { normalizeReferralAttributionSource } from "@/lib/referrals/domain";
import { bindReferralAtFirstAuth } from "@/lib/referrals/repository";

type VerifyRequestBody = {
  message?: unknown;
  signature?: unknown;
  publicKey?: unknown;
  referralCode?: unknown;
  attributionSource?: unknown;
  attributionMetadata?: unknown;
};

function sanitizeReferralMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return { ...(value as Record<string, unknown>) };
}

async function registerOnboardingRewardSafely(walletPublicKey: string): Promise<void> {
  await ensureOnboardingRewardRegistered(walletPublicKey).catch(() => undefined);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as VerifyRequestBody | null;

  if (!body || typeof body.message !== "string" || typeof body.signature !== "string" || typeof body.publicKey !== "string") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const nonceFromCookie = getNonceFromRequest(request);
  const verification = verifySiwsPayload(
    {
      message: body.message,
      signature: body.signature,
      publicKey: body.publicKey
    },
    getRequestHost(request),
    nonceFromCookie
  );

  if (!verification.ok) {
    const errorResponse = NextResponse.json({ error: verification.error }, { status: verification.status });
    clearNonceCookie(errorResponse);
    return errorResponse;
  }

  await ensureWalletFirstAccount(verification.publicKey);

  const isNewUser = !(await isWalletRegistered(verification.publicKey));
  const normalizedReferralCode = typeof body.referralCode === "string" ? body.referralCode.trim() : "";
  let referralBindingOutcome: string | null = null;

  if (isNewUser && normalizedReferralCode) {
    const referralBinding = await bindReferralAtFirstAuth({
      inviteeWalletPublicKey: verification.publicKey,
      referralCode: normalizedReferralCode,
      attributionSource: normalizeReferralAttributionSource(
        typeof body.attributionSource === "string" ? body.attributionSource : "unknown"
      ),
      metadata: sanitizeReferralMetadata(body.attributionMetadata)
    });

    referralBindingOutcome = referralBinding.outcome;
  } else if (!isNewUser && normalizedReferralCode) {
    referralBindingOutcome = "skipped_existing_wallet";
  }

  await registerOnboardingRewardSafely(verification.publicKey);

  const response = NextResponse.json({
    ok: true,
    publicKey: verification.publicKey,
    isNewUser,
    referralBindingOutcome
  });
  setSessionCookie(response, verification.sessionToken);
  clearNonceCookie(response);
  return response;
}
