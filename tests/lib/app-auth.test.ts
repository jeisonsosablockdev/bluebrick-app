import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authkitMocks = vi.hoisted(() => ({
  withAuth: vi.fn()
}));

const authMocks = vi.hoisted(() => ({
  getAuthenticatedPublicKeyFromCookies: vi.fn()
}));

const accountMocks = vi.hoisted(() => ({
  ensureFederatedAccount: vi.fn(),
  ensureWalletFirstAccount: vi.fn()
}));

const rbacMocks = vi.hoisted(() => ({
  getRoleForWallet: vi.fn()
}));

const workosConfigMocks = vi.hoisted(() => ({
  isWorkosConfigured: vi.fn()
}));

vi.mock("@workos-inc/authkit-nextjs", () => ({
  withAuth: authkitMocks.withAuth
}));

vi.mock("@/lib/auth", () => ({
  getAuthenticatedPublicKeyFromCookies: authMocks.getAuthenticatedPublicKeyFromCookies
}));

vi.mock("@/lib/accounts/repository", () => ({
  ensureFederatedAccount: accountMocks.ensureFederatedAccount,
  ensureWalletFirstAccount: accountMocks.ensureWalletFirstAccount
}));

vi.mock("@/lib/rbac", () => ({
  getRoleForWallet: rbacMocks.getRoleForWallet
}));

vi.mock("@/lib/workos/config", () => ({
  isWorkosConfigured: workosConfigMocks.isWorkosConfigured
}));

import { resolveAppAuthContext } from "@/lib/app-auth";

describe("lib/app-auth", () => {
  beforeEach(() => {
    workosConfigMocks.isWorkosConfigured.mockReturnValue(false);
    authkitMocks.withAuth.mockResolvedValue({ user: null });
    authMocks.getAuthenticatedPublicKeyFromCookies.mockResolvedValue(null);
    accountMocks.ensureFederatedAccount.mockReset();
    accountMocks.ensureWalletFirstAccount.mockReset();
    rbacMocks.getRoleForWallet.mockReturnValue("user");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns anonymous when neither wallet nor WorkOS session exists", async () => {
    const auth = await resolveAppAuthContext();

    expect(auth).toEqual({
      federatedAvailable: false,
      accountAuthenticated: false,
      federatedAuthenticated: false,
      walletAuthenticated: false,
      accountId: null,
      workosUserId: null,
      workosSessionId: null,
      workosEmail: null,
      walletPublicKey: null,
      sessionConflict: false,
      role: undefined,
      authMethod: "anonymous"
    });
  });

  it("returns a federated account session when WorkOS is authenticated", async () => {
    workosConfigMocks.isWorkosConfigured.mockReturnValue(true);
    authkitMocks.withAuth.mockResolvedValue({
      sessionId: "session_123",
      user: {
        id: "user_123",
        email: "user@example.com",
        emailVerified: true
      }
    });
    accountMocks.ensureFederatedAccount.mockResolvedValue({
      account: { id: "account_123" }
    });

    const auth = await resolveAppAuthContext();

    expect(accountMocks.ensureFederatedAccount).toHaveBeenCalledWith({
      workosUserId: "user_123",
      email: "user@example.com",
      emailVerified: true
    });
    expect(auth).toMatchObject({
      federatedAvailable: true,
      accountAuthenticated: true,
      federatedAuthenticated: true,
      walletAuthenticated: false,
      accountId: "account_123",
      workosUserId: "user_123",
      workosSessionId: "session_123",
      workosEmail: "user@example.com",
      walletPublicKey: null,
      sessionConflict: false,
      authMethod: "federated"
    });
  });

  it("returns a hybrid session when wallet and WorkOS are both active", async () => {
    workosConfigMocks.isWorkosConfigured.mockReturnValue(true);
    authkitMocks.withAuth.mockResolvedValue({
      sessionId: "session_123",
      user: {
        id: "user_123",
        email: "user@example.com",
        emailVerified: true
      }
    });
    accountMocks.ensureFederatedAccount.mockResolvedValue({
      account: { id: "account_123" }
    });
    accountMocks.ensureWalletFirstAccount.mockResolvedValue({
      account: { id: "account_123" }
    });
    authMocks.getAuthenticatedPublicKeyFromCookies.mockResolvedValue("Wallet111");
    rbacMocks.getRoleForWallet.mockReturnValue("admin");

    const auth = await resolveAppAuthContext();

    expect(auth).toMatchObject({
      federatedAvailable: true,
      accountAuthenticated: true,
      federatedAuthenticated: true,
      walletAuthenticated: true,
      workosSessionId: "session_123",
      walletPublicKey: "Wallet111",
      sessionConflict: false,
      role: "admin",
      authMethod: "hybrid"
    });
  });

  it("fails closed when WorkOS and wallet sessions resolve to different accounts", async () => {
    workosConfigMocks.isWorkosConfigured.mockReturnValue(true);
    authkitMocks.withAuth.mockResolvedValue({
      sessionId: "session_123",
      user: {
        id: "user_123",
        email: "user@example.com",
        emailVerified: true
      }
    });
    accountMocks.ensureFederatedAccount.mockResolvedValue({
      account: { id: "account_federated" }
    });
    accountMocks.ensureWalletFirstAccount.mockResolvedValue({
      account: { id: "account_wallet" }
    });
    authMocks.getAuthenticatedPublicKeyFromCookies.mockResolvedValue("Wallet111");

    const auth = await resolveAppAuthContext();

    expect(auth).toMatchObject({
      federatedAvailable: true,
      accountAuthenticated: false,
      walletAuthenticated: false,
      sessionConflict: true,
      accountId: null,
      walletPublicKey: null,
      authMethod: "anonymous"
    });
  });
});
