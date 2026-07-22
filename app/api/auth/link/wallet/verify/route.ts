import { NextRequest, NextResponse } from "next/server";

import {
  linkWalletIdentityToAccount,
  mergeFederatedOnlyAccountIntoWalletAccount,
  findAccountByWalletPublicKey,
  AccountRepositoryError
} from "@/lib/accounts/repository";
import { applyFederatedEmailPrefill } from "@/lib/compliance/profile-repository";
import { promoteReferralIntentForAccountWallet } from "@/lib/referrals/repository";
import { getRoleForWallet } from "@/lib/rbac";
import { consumeNonce } from "@/lib/state/auth-store";
import {
  clearWalletLinkContextCookie,
  getRequestHost,
  getWalletLinkContextFromRequest,
  setSessionCookie,
  verifySiwsPayload
} from "@/lib/auth";
import { resolveAppAuthContext } from "@/lib/app-auth";

type VerifyRequestBody = {
  message?: unknown;
  signature?: unknown;
  publicKey?: unknown;
};

function invalidRequest() {
  return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
}

function clearFailedContext(
  status: number,
  error: string,
  contextId?: string | null
): NextResponse {
  const response = NextResponse.json({ error }, { status });
  clearWalletLinkContextCookie(response, contextId);
  return response;
}

function isNonBlockingReferralPromotionError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? (error as { code?: unknown }).code : undefined;
  return typeof code === "string";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as VerifyRequestBody | null;

  if (!body || typeof body.message !== "string" || typeof body.signature !== "string" || typeof body.publicKey !== "string") {
    return invalidRequest();
  }

  const auth = await resolveAppAuthContext();
  const linkContext = getWalletLinkContextFromRequest(request);

  if (!auth.federatedAuthenticated || !auth.accountId || !auth.workosUserId || !linkContext) {
    return clearFailedContext(401, "Wallet link session is missing or expired.", linkContext?.contextId ?? null);
  }

  if (
    linkContext.accountId !== auth.accountId
    || linkContext.workosUserId !== auth.workosUserId
  ) {
    return clearFailedContext(409, "Wallet link session no longer matches the active account.", linkContext.contextId);
  }

  const verification = verifySiwsPayload(
    {
      message: body.message,
      signature: body.signature,
      publicKey: body.publicKey
    },
    getRequestHost(request),
    linkContext.nonce
  );

  if (!verification.ok) {
    return clearFailedContext(verification.status, verification.error, linkContext.contextId);
  }

  if (!consumeNonce(linkContext.nonce)) {
    return clearFailedContext(409, "Invalid or expired nonce.", linkContext.contextId);
  }

  let effectiveAccountId = auth.accountId;
  let merged = false;

  try {
    await linkWalletIdentityToAccount({
      accountId: auth.accountId,
      walletPublicKey: verification.publicKey
    });
  } catch (error) {
    if (error instanceof AccountRepositoryError && error.code === "WALLET_ALREADY_LINKED") {
      const walletAccount = await findAccountByWalletPublicKey(verification.publicKey);

      if (!walletAccount) {
        return clearFailedContext(409, error.message, linkContext.contextId);
      }

      if (getRoleForWallet(verification.publicKey) === "admin") {
        return clearFailedContext(409, "This account requires manual review before it can be consolidated.", linkContext.contextId);
      }

      try {
        const consolidated = await mergeFederatedOnlyAccountIntoWalletAccount({
          sourceAccountId: auth.accountId,
          targetAccountId: walletAccount.account.id
        });

        effectiveAccountId = consolidated.account.id;
        merged = true;
      } catch (mergeError) {
        if (mergeError instanceof AccountRepositoryError) {
          return clearFailedContext(
            409,
            "This account requires manual review before it can be consolidated.",
            linkContext.contextId
          );
        }

        throw mergeError;
      }
    } else {
      throw error;
    }
  }

  await applyFederatedEmailPrefill({
    walletPublicKey: verification.publicKey,
    email: auth.workosEmail ?? null
  });

  let referralBindingOutcome: string | null = null;

  try {
    const referralIntentResult = await promoteReferralIntentForAccountWallet({
      accountId: effectiveAccountId,
      walletPublicKey: verification.publicKey
    });

    referralBindingOutcome =
      referralIntentResult.outcome === "promoted"
        ? "promoted"
        : referralIntentResult.outcome === "discarded_wallet_already_attributed"
          ? "already_bound"
          : referralIntentResult.outcome === "discarded_self_referral"
            ? "self_referral"
            : referralIntentResult.outcome === "discarded_invalid_code"
              ? "invalid_code"
              : null;
  } catch (error) {
    if (!isNonBlockingReferralPromotionError(error)) {
      throw error;
    }
  }

  const response = NextResponse.json({
    ok: true,
    publicKey: verification.publicKey,
    linked: true,
    merged,
    referralBindingOutcome
  });
  setSessionCookie(response, verification.sessionToken);
  clearWalletLinkContextCookie(response, linkContext.contextId);
  return response;
}
