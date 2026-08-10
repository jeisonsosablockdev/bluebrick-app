import { NextResponse } from "next/server";

import { resolveAppAuthContext } from "@/lib/app-auth";

type WalletBoundAuthContext = {
  accountId: string;
  walletPublicKey: string;
};

function errorResponse(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function requireWalletBoundAuth(): Promise<WalletBoundAuthContext | NextResponse> {
  const auth = await resolveAppAuthContext();

  if (auth.sessionConflict) {
    return errorResponse(409, "SESSION_CONFLICT", "WorkOS and wallet sessions do not resolve to the same BRIDS account.");
  }

  if (!auth.accountAuthenticated) {
    return errorResponse(401, "UNAUTHORIZED", "An authenticated BRIDS session is required.");
  }

  if (!auth.walletAuthenticated || !auth.accountId || !auth.walletPublicKey) {
    return errorResponse(403, "WALLET_AUTH_REQUIRED", "A wallet-authenticated SIWS session is required for push subscription ownership.");
  }

  return {
    accountId: auth.accountId,
    walletPublicKey: auth.walletPublicKey
  };
}
