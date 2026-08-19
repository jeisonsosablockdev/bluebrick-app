import "server-only";

import { withAuth } from "@workos-inc/authkit-nextjs";

import { getAuthenticatedPublicKeyFromCookies } from "@/lib/auth";
import {
  ensureFederatedAccount,
  ensureWalletFirstAccount,
  type AccountIdentityBundle
} from "@/features/profile/infrastructure/accounts-repository";
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

export type RawWorkosAuthContext = {
  authenticated: boolean;
  accountId: string | null;
  account: AccountIdentityBundle | null;
  workosUserId: string | null;
  workosSessionId: string | null;
  workosEmail: string | null;
};

export type RawWalletAuthContext = {
  authenticated: boolean;
  accountId: string | null;
  account: AccountIdentityBundle | null;
  walletPublicKey: string | null;
  role?: UserRole;
};

export type RawAppAuthContext = {
  federatedAvailable: boolean;
  workos: RawWorkosAuthContext;
  wallet: RawWalletAuthContext;
  sessionConflict: boolean;
};

async function readWorkosAuthContext(): Promise<RawWorkosAuthContext> {
  const anonymousContext: RawWorkosAuthContext = {
    authenticated: false,
    accountId: null,
    account: null,
    workosUserId: null,
    workosSessionId: null,
    workosEmail: null
  };

  if (!isWorkosConfigured()) {
    return anonymousContext;
  }

  let session: Awaited<ReturnType<typeof withAuth>>;

  try {
    session = await withAuth();
  } catch (error) {
    if (
      error instanceof Error
      && error.message.includes("isn't covered by the AuthKit middleware")
    ) {
      return anonymousContext;
    }

    throw error;
  }

  if (!session.user) {
    return anonymousContext;
  }

  const account = await ensureFederatedAccount({
    workosUserId: session.user.id,
    email: session.user.email,
    emailVerified: session.user.emailVerified
  });

  return {
    authenticated: true,
    accountId: account.account.id,
    account,
    workosUserId: session.user.id,
    workosSessionId: session.sessionId,
    workosEmail: session.user.email
  };
}

export async function resolveRawAppAuthContext(): Promise<RawAppAuthContext> {
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

  return {
    federatedAvailable,
    workos,
    wallet: {
      authenticated: Boolean(walletPublicKey),
      accountId: walletAccount?.account.id ?? null,
      account: walletAccount,
      walletPublicKey,
      role: walletPublicKey ? getRoleForWallet(walletPublicKey) : undefined
    },
    sessionConflict
  };
}

export async function resolveAppAuthContext(): Promise<AppAuthContext> {
  const raw = await resolveRawAppAuthContext();
  const walletAuthenticated = raw.wallet.authenticated && !raw.sessionConflict;
  const federatedAuthenticated = raw.workos.authenticated;
  const accountAuthenticated = !raw.sessionConflict && (walletAuthenticated || federatedAuthenticated);

  return {
    federatedAvailable: raw.federatedAvailable,
    accountAuthenticated,
    federatedAuthenticated,
    walletAuthenticated,
    accountId: raw.sessionConflict ? null : (raw.workos.accountId ?? raw.wallet.accountId ?? null),
    workosUserId: raw.workos.workosUserId,
    workosSessionId: raw.workos.workosSessionId,
    workosEmail: raw.workos.workosEmail,
    walletPublicKey: raw.sessionConflict ? null : raw.wallet.walletPublicKey,
    sessionConflict: raw.sessionConflict,
    role: raw.wallet.walletPublicKey && !raw.sessionConflict ? raw.wallet.role : undefined,
    authMethod:
      raw.sessionConflict
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
