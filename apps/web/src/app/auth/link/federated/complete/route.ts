import { NextRequest, NextResponse } from "next/server";

import { resolveRawAppAuthContext } from "@/lib/app-auth";
import {
  clearFederatedLinkContextCookie,
  getFederatedLinkContextFromRequest
} from "@/lib/auth";
import {
  mergeFederatedOnlyAccountIntoWalletAccount,
  type AccountIdentityBundle,
  AccountRepositoryError
} from "@/features/profile/infrastructure/accounts-repository";
import { applyFederatedEmailPrefill } from "@/features/profile/infrastructure/profile-repository";

function redirectWithStatus(request: NextRequest, status: string, contextId?: string | null): NextResponse {
  const url = new URL("/protected/perfil", request.url);
  url.searchParams.set("authLinkStatus", status);
  const response = NextResponse.redirect(url);
  clearFederatedLinkContextCookie(response, contextId);
  return response;
}

function isReviewRequiredError(error: AccountRepositoryError): boolean {
  return (
    error.code === "SOURCE_ACCOUNT_NOT_FEDERATED_ONLY"
    || error.code === "TARGET_ACCOUNT_NOT_WALLET_BACKED"
    || error.code === "SOURCE_ACCOUNT_HAS_BOUND_PROFILE_STATE"
    || error.code === "SOURCE_ACCOUNT_HAS_PUSH_STATE"
  );
}

async function finalizeSuccessfulLink(
  request: NextRequest,
  walletPublicKey: string,
  workosEmail: string | null,
  contextId: string
): Promise<NextResponse> {
  await applyFederatedEmailPrefill({
    walletPublicKey,
    email: workosEmail
  });

  return redirectWithStatus(request, "federated_linked", contextId);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const linkContext = getFederatedLinkContextFromRequest(request);

  if (!linkContext) {
    return redirectWithStatus(request, "link_expired");
  }

  const raw = await resolveRawAppAuthContext();

  if (!raw.wallet.authenticated || !raw.wallet.accountId || !raw.wallet.walletPublicKey) {
    return redirectWithStatus(request, "wallet_required", linkContext.contextId);
  }

  if (!raw.workos.authenticated || !raw.workos.accountId || !raw.workos.account) {
    return redirectWithStatus(request, "federated_required", linkContext.contextId);
  }

  if (
    linkContext.accountId !== raw.wallet.accountId
    || linkContext.walletPublicKey !== raw.wallet.walletPublicKey
  ) {
    return redirectWithStatus(request, "link_expired", linkContext.contextId);
  }

  if (raw.wallet.role === "admin") {
    return redirectWithStatus(request, "review_required", linkContext.contextId);
  }

  if (raw.workos.accountId === raw.wallet.accountId) {
    return finalizeSuccessfulLink(
      request,
      raw.wallet.walletPublicKey,
      raw.workos.workosEmail,
      linkContext.contextId
    );
  }

  let merged: AccountIdentityBundle;

  try {
    merged = await mergeFederatedOnlyAccountIntoWalletAccount({
      sourceAccountId: raw.workos.accountId,
      targetAccountId: raw.wallet.accountId
    });
  } catch (error) {
    if (error instanceof AccountRepositoryError && isReviewRequiredError(error)) {
      return redirectWithStatus(request, "review_required", linkContext.contextId);
    }

    throw error;
  }

  const effectiveWalletPublicKey = merged.account.primaryWalletPublicKey ?? raw.wallet.walletPublicKey;

  return finalizeSuccessfulLink(
    request,
    effectiveWalletPublicKey,
    raw.workos.workosEmail,
    linkContext.contextId
  );
}
