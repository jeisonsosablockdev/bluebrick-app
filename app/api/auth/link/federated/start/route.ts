import { NextRequest, NextResponse } from "next/server";

import { resolveAppAuthContext } from "@/lib/app-auth";
import { setFederatedLinkContextCookie } from "@/lib/auth";

function redirectToProfile(request: NextRequest, status: string): NextResponse {
  const url = new URL("/protected/perfil", request.url);
  url.searchParams.set("authLinkStatus", status);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await resolveAppAuthContext();

  if (!auth.walletAuthenticated || !auth.accountId || !auth.walletPublicKey) {
    return redirectToProfile(request, "wallet_required");
  }

  if (!auth.federatedAvailable) {
    return redirectToProfile(request, "federated_unavailable");
  }

  if (auth.federatedAuthenticated) {
    return redirectToProfile(request, "already_linked");
  }

  const completionPath = "/auth/link/federated/complete";
  const signInUrl = new URL(`/sign-in?returnTo=${encodeURIComponent(completionPath)}`, request.url);
  const response = NextResponse.redirect(signInUrl);

  setFederatedLinkContextCookie(response, {
    accountId: auth.accountId,
    walletPublicKey: auth.walletPublicKey
  });

  return response;
}
