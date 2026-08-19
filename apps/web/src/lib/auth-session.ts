import { NextRequest } from "next/server";

import { getSessionPublicKey } from "@/features/shared/auth/domain/auth-store";
import { getRoleForWallet, type UserRole } from "@/lib/rbac";

const AUTH_COOKIE_NAME = "siws_session";

type RequestRoleResult = {
  authenticated: boolean;
  role?: UserRole;
  pubkey?: string;
};

export function getAuthenticatedWalletFromRequest(request: NextRequest): string | null {
  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  return getSessionPublicKey(sessionToken);
}

export function getRequestRole(request: NextRequest): RequestRoleResult {
  const pubkey = getAuthenticatedWalletFromRequest(request);

  if (!pubkey) {
    return { authenticated: false };
  }

  return {
    authenticated: true,
    role: getRoleForWallet(pubkey),
    pubkey
  };
}
