import type { AuthMeResponse } from "@/lib/auth-client";

export function areAuthMeResponsesEquivalent(previous: AuthMeResponse, next: AuthMeResponse): boolean {
  return previous.authenticated === next.authenticated
    && previous.federatedAvailable === next.federatedAvailable
    && previous.accountAuthenticated === next.accountAuthenticated
    && previous.federatedAuthenticated === next.federatedAuthenticated
    && previous.walletAuthenticated === next.walletAuthenticated
    && previous.sessionConflict === next.sessionConflict
    && previous.authMethod === next.authMethod
    && previous.accountId === next.accountId
    && previous.workosUserId === next.workosUserId
    && previous.email === next.email
    && previous.pubkey === next.pubkey
    && previous.role === next.role;
}
