import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const appAuthMocks = vi.hoisted(() => ({
  resolveAppAuthContext: vi.fn(),
  resolveRawAppAuthContext: vi.fn()
}));

const authMocks = vi.hoisted(() => ({
  setFederatedLinkContextCookie: vi.fn(),
  getFederatedLinkContextFromRequest: vi.fn(),
  clearFederatedLinkContextCookie: vi.fn()
}));

const accountMocks = vi.hoisted(() => ({
  mergeFederatedOnlyAccountIntoWalletAccount: vi.fn(),
  AccountRepositoryError: class AccountRepositoryError extends Error {
    code: string;

    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }
}));

const profileRepositoryMocks = vi.hoisted(() => ({
  applyFederatedEmailPrefill: vi.fn()
}));

vi.mock("@/lib/app-auth", () => ({
  resolveAppAuthContext: appAuthMocks.resolveAppAuthContext,
  resolveRawAppAuthContext: appAuthMocks.resolveRawAppAuthContext
}));

vi.mock("@/lib/auth", () => ({
  setFederatedLinkContextCookie: authMocks.setFederatedLinkContextCookie,
  getFederatedLinkContextFromRequest: authMocks.getFederatedLinkContextFromRequest,
  clearFederatedLinkContextCookie: authMocks.clearFederatedLinkContextCookie
}));

vi.mock("@/lib/accounts/repository", () => ({
  mergeFederatedOnlyAccountIntoWalletAccount: accountMocks.mergeFederatedOnlyAccountIntoWalletAccount,
  AccountRepositoryError: accountMocks.AccountRepositoryError
}));

vi.mock("@/lib/compliance/profile-repository", () => ({
  applyFederatedEmailPrefill: profileRepositoryMocks.applyFederatedEmailPrefill
}));

import { GET as startFederatedLink } from "@/app/api/auth/link/federated/start/route";
import { GET as completeFederatedLink } from "@/app/auth/link/federated/complete/route";

describe("federated link auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appAuthMocks.resolveAppAuthContext.mockResolvedValue({
      walletAuthenticated: true,
      federatedAuthenticated: false,
      federatedAvailable: true,
      accountId: "account_wallet",
      walletPublicKey: "Wallet111"
    });
    appAuthMocks.resolveRawAppAuthContext.mockResolvedValue({
      sessionConflict: false,
      workos: {
        authenticated: true,
        accountId: "account_federated",
        account: { account: { id: "account_federated" } },
        workosEmail: "user@example.com"
      },
      wallet: {
        authenticated: true,
        accountId: "account_wallet",
        account: { account: { id: "account_wallet", primaryWalletPublicKey: "Wallet111" } },
        walletPublicKey: "Wallet111",
        role: "user"
      }
    });
    authMocks.getFederatedLinkContextFromRequest.mockReturnValue({
      contextId: "context_123",
      accountId: "account_wallet",
      walletPublicKey: "Wallet111"
    });
    accountMocks.mergeFederatedOnlyAccountIntoWalletAccount.mockResolvedValue({
      account: {
        id: "account_wallet",
        primaryWalletPublicKey: "Wallet111"
      }
    });
    profileRepositoryMocks.applyFederatedEmailPrefill.mockResolvedValue(undefined);
  });

  it("starts wallet -> federated linking from an active wallet session", async () => {
    const response = await startFederatedLink(new NextRequest("https://example.com/api/auth/link/federated/start"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/sign-in?returnTo=%2Fauth%2Flink%2Ffederated%2Fcomplete");
    expect(authMocks.setFederatedLinkContextCookie).toHaveBeenCalledWith(expect.any(Response), {
      accountId: "account_wallet",
      walletPublicKey: "Wallet111"
    });
  });

  it("redirects to profile when wallet auth is missing", async () => {
    appAuthMocks.resolveAppAuthContext.mockResolvedValueOnce({
      walletAuthenticated: false,
      federatedAuthenticated: false,
      federatedAvailable: true,
      accountId: null,
      walletPublicKey: null
    });

    const response = await startFederatedLink(new NextRequest("https://example.com/api/auth/link/federated/start"));

    expect(response.headers.get("location")).toBe("https://example.com/protected/perfil?authLinkStatus=wallet_required");
  });

  it("completes linking idempotently when both auth layers already resolve to the same account", async () => {
    appAuthMocks.resolveRawAppAuthContext.mockResolvedValueOnce({
      sessionConflict: false,
      workos: {
        authenticated: true,
        accountId: "account_wallet",
        account: { account: { id: "account_wallet" } },
        workosEmail: "user@example.com"
      },
      wallet: {
        authenticated: true,
        accountId: "account_wallet",
        account: { account: { id: "account_wallet", primaryWalletPublicKey: "Wallet111" } },
        walletPublicKey: "Wallet111",
        role: "user"
      }
    });

    const response = await completeFederatedLink(new NextRequest("https://example.com/auth/link/federated/complete"));

    expect(response.headers.get("location")).toBe("https://example.com/protected/perfil?authLinkStatus=federated_linked");
    expect(profileRepositoryMocks.applyFederatedEmailPrefill).toHaveBeenCalledWith({
      walletPublicKey: "Wallet111",
      email: "user@example.com"
    });
  });

  it("merges a federated-only account into the wallet-backed account when safe", async () => {
    const response = await completeFederatedLink(new NextRequest("https://example.com/auth/link/federated/complete"));

    expect(response.headers.get("location")).toBe("https://example.com/protected/perfil?authLinkStatus=federated_linked");
    expect(accountMocks.mergeFederatedOnlyAccountIntoWalletAccount).toHaveBeenCalledWith({
      sourceAccountId: "account_federated",
      targetAccountId: "account_wallet"
    });
  });

  it("redirects to review_required when auto-consolidation is unsafe", async () => {
    accountMocks.mergeFederatedOnlyAccountIntoWalletAccount.mockRejectedValueOnce(
      new accountMocks.AccountRepositoryError(
        "SOURCE_ACCOUNT_NOT_FEDERATED_ONLY",
        "Source account is not eligible for automatic consolidation."
      )
    );

    const response = await completeFederatedLink(new NextRequest("https://example.com/auth/link/federated/complete"));

    expect(response.headers.get("location")).toBe("https://example.com/protected/perfil?authLinkStatus=review_required");
  });
});
