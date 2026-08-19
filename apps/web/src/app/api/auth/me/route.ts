import { NextResponse } from "next/server";

import { resolveAppAuthContext } from "@/lib/app-auth";

export async function GET(): Promise<NextResponse> {
  const auth = await resolveAppAuthContext();

  return NextResponse.json({
    authenticated: auth.walletAuthenticated,
    federatedAvailable: auth.federatedAvailable,
    accountAuthenticated: auth.accountAuthenticated,
    federatedAuthenticated: auth.federatedAuthenticated,
    walletAuthenticated: auth.walletAuthenticated,
    sessionConflict: auth.sessionConflict,
    authMethod: auth.authMethod,
    accountId: auth.accountId,
    workosUserId: auth.workosUserId,
    email: auth.workosEmail,
    pubkey: auth.walletPublicKey,
    role: auth.role
  });
}
