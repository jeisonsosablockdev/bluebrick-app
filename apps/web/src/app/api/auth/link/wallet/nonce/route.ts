import { NextResponse } from "next/server";

import { resolveAppAuthContext } from "@/lib/app-auth";
import { setWalletLinkContextCookie } from "@/lib/auth";

function unauthorizedResponse() {
  return NextResponse.json(
    {
      error: {
        code: "ACCOUNT_SESSION_REQUIRED",
        message: "An active WorkOS account session is required to link a wallet."
      }
    },
    { status: 401 }
  );
}

export async function GET(): Promise<NextResponse> {
  const auth = await resolveAppAuthContext();

  if (!auth.federatedAuthenticated || !auth.accountId || !auth.workosUserId) {
    return unauthorizedResponse();
  }

  const response = NextResponse.json({ ok: true, walletAuthenticated: auth.walletAuthenticated });
  const context = setWalletLinkContextCookie(response, {
    accountId: auth.accountId,
    workosUserId: auth.workosUserId,
    workosSessionId: auth.workosSessionId
  });

  return NextResponse.json(
    {
      ok: true,
      nonce: context.nonce,
      expiresAt: new Date(context.expiresAt).toISOString(),
      walletAuthenticated: auth.walletAuthenticated
    },
    {
      status: 200,
      headers: response.headers
    }
  );
}
