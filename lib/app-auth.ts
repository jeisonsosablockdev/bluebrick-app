import "server-only";

import { withAuth } from "@workos-inc/authkit-nextjs";

import { getAuthenticatedPublicKeyFromCookies } from "@/lib/auth";
import { ensureFederatedAccount, ensureWalletFirstAccount } from "@/lib/accounts/repository";
import { getRoleForWallet, type UserRole } from "@/lib/rbac";
import { isWorkosConfigured } from "@/lib/workos/config";

export type AppAuthContext = {
  federatedAvailable: boolean;
  accountAuthenticated: boolean;
  federatedAuthenticated: boolean;
  walletAuthenticated: boolean;
  accountId: string | null;
  workosUserId: string | null;
  workosSessionId: string | null;
  workosEmail: string | null;
  walletPublicKey: string | null;
  sessionConflict: boolean;
  role?: UserRole;
  authMethod: "anonymous" | "federated" | "wallet" | "hybrid";
};

async function readWorkosAuthContext(): Promise<{
  authenticated: boolean;
  accountId: string | null;
  workosUserId: string | null;
  workosSessionId: string | null;
  workosEmail: string | null;
}> {
  if (!isWorkosConfigured()) {
    return {
      authenticated: false,
      accountId: null,
      workosUserId: null,
      workosSessionId: null,
      workosEmail: null
    };
  }

  const session = await withAuth();

  if (!session.user) {
    return {
      authenticated: false,
      accountId: null,
      workosUserId: null,
      workosSessionId: null,
      workosEmail: null
    };
  }

  const account = await ensureFederatedAccount({
    workosUserId: session.user.id,
    email: session.user.email,
    emailVerified: session.user.emailVerified
  });

  return {
    authenticated: true,
    accountId: account.account.id,
    workosUserId: session.user.id,
    workosSessionId: session.sessionId,
    workosEmail: session.user.email
  };
}

export async function resolveAppAuthContext(): Promise<AppAuthContext> {
  const federatedAvailable = isWorkosConfigured();
  const [walletPublicKey, workos] = await Promise.all([
    getAuthenticatedPublicKeyFromCookies(),
    readWorkosAuthContext()
  ]);

  const walletAccount = walletPublicKey ? await ensureWalletFirstAccount(walletPublicKey) : null;
  const sessionConflict = Boolean(
    walletAccount
    && workos.accountId
    && walletAccount.account.id !== workos.accountId
  );
  const walletAuthenticated = Boolean(walletPublicKey) && !sessionConflict;
  const federatedAuthenticated = workos.authenticated;
  const accountAuthenticated = !sessionConflict && (walletAuthenticated || federatedAuthenticated);
  const role = walletPublicKey && !sessionConflict ? getRoleForWallet(walletPublicKey) : undefined;

  return {
    federatedAvailable,
    accountAuthenticated,
    federatedAuthenticated,
    walletAuthenticated,
    accountId: sessionConflict ? null : (workos.accountId ?? walletAccount?.account.id ?? null),
    workosUserId: workos.workosUserId,
    workosSessionId: workos.workosSessionId,
    workosEmail: workos.workosEmail,
    walletPublicKey: sessionConflict ? null : walletPublicKey,
    sessionConflict,
    role,
    authMethod:
      sessionConflict
        ? "anonymous"
        : walletAuthenticated && federatedAuthenticated
        ? "hybrid"
        : walletAuthenticated
          ? "wallet"
          : federatedAuthenticated
            ? "federated"
            : "anonymous"
  };
}
