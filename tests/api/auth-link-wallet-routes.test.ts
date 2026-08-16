import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  setWalletLinkContextCookie: vi.fn(),
  getWalletLinkContextFromRequest: vi.fn(),
  verifySiwsPayload: vi.fn(),
  setSessionCookie: vi.fn(),
  clearWalletLinkContextCookie: vi.fn(),
  getRequestHost: vi.fn()
}));

const appAuthMocks = vi.hoisted(() => ({
  resolveAppAuthContext: vi.fn()
}));

const accountMocks = vi.hoisted(() => ({
  findAccountByWalletPublicKey: vi.fn(),
  linkWalletIdentityToAccount: vi.fn(),
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

const referralRepositoryMocks = vi.hoisted(() => ({
  promoteReferralIntentForAccountWallet: vi.fn()
}));

const authStoreMocks = vi.hoisted(() => ({
  consumeNonce: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  setWalletLinkContextCookie: authMocks.setWalletLinkContextCookie,
  getWalletLinkContextFromRequest: authMocks.getWalletLinkContextFromRequest,
  verifySiwsPayload: authMocks.verifySiwsPayload,
  setSessionCookie: authMocks.setSessionCookie,
  clearWalletLinkContextCookie: authMocks.clearWalletLinkContextCookie,
  getRequestHost: authMocks.getRequestHost
}));

vi.mock("@/lib/app-auth", () => ({
  resolveAppAuthContext: appAuthMocks.resolveAppAuthContext
}));

vi.mock("@/features/profile/infrastructure/accounts-repository", () => ({
  findAccountByWalletPublicKey: accountMocks.findAccountByWalletPublicKey,
  linkWalletIdentityToAccount: accountMocks.linkWalletIdentityToAccount,
  mergeFederatedOnlyAccountIntoWalletAccount: accountMocks.mergeFederatedOnlyAccountIntoWalletAccount,
  AccountRepositoryError: accountMocks.AccountRepositoryError
}));

vi.mock("@/features/profile/infrastructure/profile-repository", () => ({
  applyFederatedEmailPrefill: profileRepositoryMocks.applyFederatedEmailPrefill
}));

vi.mock("@/features/referral-marketing/infrastructure/referrals-repository", () => ({
  promoteReferralIntentForAccountWallet: referralRepositoryMocks.promoteReferralIntentForAccountWallet
}));

vi.mock("@/lib/auth-store", () => ({
  consumeNonce: authStoreMocks.consumeNonce
}));

import { GET as getWalletLinkNonce } from "@/app/api/auth/link/wallet/nonce/route";
import { POST as verifyWalletLink } from "@/app/api/auth/link/wallet/verify/route";

function createVerifyRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/auth/link/wallet/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("wallet link auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appAuthMocks.resolveAppAuthContext.mockResolvedValue({
      accountAuthenticated: true,
      federatedAuthenticated: true,
      walletAuthenticated: false,
      accountId: "account_123",
      workosUserId: "user_123",
      workosSessionId: "session_123",
      workosEmail: "user@example.com",
      walletPublicKey: null,
      role: undefined,
      authMethod: "federated"
    });
    authMocks.setWalletLinkContextCookie.mockReturnValue({
      nonce: "nonce_123",
      expiresAt: Date.parse("2026-05-10T14:30:00.000Z")
    });
    authMocks.getWalletLinkContextFromRequest.mockReturnValue({
      contextId: "context_123",
      accountId: "account_123",
      workosUserId: "user_123",
      workosSessionId: "session_123",
      nonce: "nonce_123",
      expiresAt: Date.now() + 60_000
    });
    authMocks.getRequestHost.mockReturnValue("example.com");
    authMocks.verifySiwsPayload.mockReturnValue({
      ok: true,
      publicKey: "Wallet111",
      sessionToken: "siws_session_token"
    });
    accountMocks.linkWalletIdentityToAccount.mockResolvedValue(undefined);
    accountMocks.findAccountByWalletPublicKey.mockResolvedValue({
      account: { id: "account_wallet" }
    });
    accountMocks.mergeFederatedOnlyAccountIntoWalletAccount.mockResolvedValue({
      account: { id: "account_wallet" }
    });
    profileRepositoryMocks.applyFederatedEmailPrefill.mockResolvedValue(undefined);
    referralRepositoryMocks.promoteReferralIntentForAccountWallet.mockResolvedValue({
      outcome: "no_intent"
    });
    authStoreMocks.consumeNonce.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("issues a wallet-link nonce for federated sessions", async () => {
    const response = await getWalletLinkNonce();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.nonce).toBe("nonce_123");
    expect(authMocks.setWalletLinkContextCookie).toHaveBeenCalled();
  });

  it("rejects wallet-link nonce issuance without active WorkOS session", async () => {
    appAuthMocks.resolveAppAuthContext.mockResolvedValueOnce({
      accountAuthenticated: false,
      federatedAuthenticated: false,
      walletAuthenticated: false,
      accountId: null,
      workosUserId: null,
      workosSessionId: null,
      workosEmail: null,
      walletPublicKey: null,
      role: undefined,
      authMethod: "anonymous"
    });

    const response = await getWalletLinkNonce();

    expect(response.status).toBe(401);
    expect(authMocks.setWalletLinkContextCookie).not.toHaveBeenCalled();
  });

  it("links the wallet when context and WorkOS session match", async () => {
    const response = await verifyWalletLink(
      createVerifyRequest({
        message: "signed message",
        signature: "base64-signature",
        publicKey: "Wallet111"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: true,
      publicKey: "Wallet111",
      linked: true
    });
    expect(accountMocks.linkWalletIdentityToAccount).toHaveBeenCalledWith({
      accountId: "account_123",
      walletPublicKey: "Wallet111"
    });
    expect(profileRepositoryMocks.applyFederatedEmailPrefill).toHaveBeenCalledWith({
      walletPublicKey: "Wallet111",
      email: "user@example.com"
    });
    expect(referralRepositoryMocks.promoteReferralIntentForAccountWallet).toHaveBeenCalledWith({
      accountId: "account_123",
      walletPublicKey: "Wallet111"
    });
    expect(authMocks.setSessionCookie).toHaveBeenCalledWith(expect.any(Response), "siws_session_token");
    expect(payload.referralBindingOutcome).toBeNull();
  });

  it("fails closed when the wallet-link nonce was already consumed", async () => {
    authStoreMocks.consumeNonce.mockReturnValueOnce(false);

    const response = await verifyWalletLink(
      createVerifyRequest({
        message: "signed message",
        signature: "base64-signature",
        publicKey: "Wallet111"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toBe("Invalid or expired nonce.");
  });

  it("fails closed when active account context does not match link context", async () => {
    authMocks.getWalletLinkContextFromRequest.mockReturnValueOnce({
      contextId: "context_123",
      accountId: "other_account",
      workosUserId: "user_123",
      workosSessionId: "session_123",
      nonce: "nonce_123",
      expiresAt: Date.now() + 60_000
    });

    const response = await verifyWalletLink(
      createVerifyRequest({
        message: "signed message",
        signature: "base64-signature",
        publicKey: "Wallet111"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toBe("Wallet link session no longer matches the active account.");
    expect(accountMocks.linkWalletIdentityToAccount).not.toHaveBeenCalled();
  });

  it("allows wallet linking when WorkOS rotates sessionId but account identity stays the same", async () => {
    appAuthMocks.resolveAppAuthContext.mockResolvedValueOnce({
      accountAuthenticated: true,
      federatedAuthenticated: true,
      walletAuthenticated: false,
      accountId: "account_123",
      workosUserId: "user_123",
      workosSessionId: "session_rotated",
      workosEmail: "user@example.com",
      walletPublicKey: null,
      role: undefined,
      authMethod: "federated"
    });

    const response = await verifyWalletLink(
      createVerifyRequest({
        message: "signed message",
        signature: "base64-signature",
        publicKey: "Wallet111"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: true,
      publicKey: "Wallet111",
      linked: true
    });
  });

  it("merges safely when wallet is already linked to another wallet-backed account", async () => {
    accountMocks.linkWalletIdentityToAccount.mockRejectedValueOnce(
      new accountMocks.AccountRepositoryError("WALLET_ALREADY_LINKED", "Wallet is already linked to another account.")
    );

    const response = await verifyWalletLink(
      createVerifyRequest({
        message: "signed message",
        signature: "base64-signature",
        publicKey: "Wallet111"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.merged).toBe(true);
    expect(accountMocks.mergeFederatedOnlyAccountIntoWalletAccount).toHaveBeenCalledWith({
      sourceAccountId: "account_123",
      targetAccountId: "account_wallet"
    });
  });

  it("returns review_required when wallet conflict is not auto-mergeable", async () => {
    accountMocks.linkWalletIdentityToAccount.mockRejectedValueOnce(
      new accountMocks.AccountRepositoryError("WALLET_ALREADY_LINKED", "Wallet is already linked to another account.")
    );
    accountMocks.mergeFederatedOnlyAccountIntoWalletAccount.mockRejectedValueOnce(
      new accountMocks.AccountRepositoryError(
        "SOURCE_ACCOUNT_NOT_FEDERATED_ONLY",
        "Source account is not eligible for automatic consolidation."
      )
    );

    const response = await verifyWalletLink(
      createVerifyRequest({
        message: "signed message",
        signature: "base64-signature",
        publicKey: "Wallet111"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toBe("This account requires manual review before it can be consolidated.");
  });

  it("returns the promotion outcome when a federated referral intent is consumed", async () => {
    referralRepositoryMocks.promoteReferralIntentForAccountWallet.mockResolvedValueOnce({
      outcome: "promoted",
      intent: {
        id: "intent_123",
        accountId: "account_123",
        referralCode: "REF123",
        attributionSource: "manual",
        capturedAt: "2026-05-10T00:00:00.000Z",
        status: "promoted",
        metadata: {},
        resolvedAt: "2026-05-10T00:05:00.000Z",
        promotedAttributionId: "attr_123"
      },
      attribution: {
        id: "attr_123",
        referralCodeId: "code_123",
        referralCode: "REF123",
        referrerWalletPublicKey: "Referrer111",
        inviteeWalletPublicKey: "Wallet111",
        attributionSource: "manual",
        boundAt: "2026-05-10T00:05:00.000Z",
        eligibilityWindowEndsAt: "2026-06-09T00:05:00.000Z",
        kycApprovedAt: null,
        closedAt: null,
        status: "bound_pending_kyc",
        metadata: {}
      }
    });

    const response = await verifyWalletLink(
      createVerifyRequest({
        message: "signed message",
        signature: "base64-signature",
        publicKey: "Wallet111"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.referralBindingOutcome).toBe("promoted");
  });

  it("maps existing wallet attributions to an already_bound referral outcome", async () => {
    referralRepositoryMocks.promoteReferralIntentForAccountWallet.mockResolvedValueOnce({
      outcome: "discarded_wallet_already_attributed",
      intent: {
        id: "intent_123",
        accountId: "account_123",
        referralCode: "REF123",
        attributionSource: "manual",
        capturedAt: "2026-05-10T00:00:00.000Z",
        status: "discarded_wallet_already_attributed",
        metadata: {},
        resolvedAt: "2026-05-10T00:05:00.000Z",
        promotedAttributionId: "attr_123"
      },
      attribution: {
        id: "attr_123",
        referralCodeId: "code_123",
        referralCode: "REF123",
        referrerWalletPublicKey: "Referrer111",
        inviteeWalletPublicKey: "Wallet111",
        attributionSource: "manual",
        boundAt: "2026-05-10T00:05:00.000Z",
        eligibilityWindowEndsAt: "2026-06-09T00:05:00.000Z",
        kycApprovedAt: null,
        closedAt: null,
        status: "bound_pending_kyc",
        metadata: {}
      }
    });

    const response = await verifyWalletLink(
      createVerifyRequest({
        message: "signed message",
        signature: "base64-signature",
        publicKey: "Wallet111"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.referralBindingOutcome).toBe("already_bound");
  });

  it("does not block wallet linking when referral promotion fails after the wallet is linked", async () => {
    referralRepositoryMocks.promoteReferralIntentForAccountWallet.mockRejectedValueOnce({
      code: "42P01",
      message: "relation \"account_referral_intents\" does not exist"
    });

    const response = await verifyWalletLink(
      createVerifyRequest({
        message: "signed message",
        signature: "base64-signature",
        publicKey: "Wallet111"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: true,
      publicKey: "Wallet111",
      linked: true,
      referralBindingOutcome: null
    });
    expect(accountMocks.linkWalletIdentityToAccount).toHaveBeenCalledWith({
      accountId: "account_123",
      walletPublicKey: "Wallet111"
    });
    expect(authMocks.setSessionCookie).toHaveBeenCalledWith(expect.any(Response), "siws_session_token");
  });
});
