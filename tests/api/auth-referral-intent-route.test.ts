import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const appAuthMocks = vi.hoisted(() => ({
  resolveAppAuthContext: vi.fn()
}));

const referralRepositoryMocks = vi.hoisted(() => ({
  upsertReferralIntentForAccount: vi.fn()
}));

vi.mock("@/lib/app-auth", () => ({
  resolveAppAuthContext: appAuthMocks.resolveAppAuthContext
}));

vi.mock("@/lib/referrals/repository", () => ({
  upsertReferralIntentForAccount: referralRepositoryMocks.upsertReferralIntentForAccount
}));

import { POST } from "@/app/api/auth/referral-intent/route";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/auth/referral-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /api/auth/referral-intent", () => {
  beforeEach(() => {
    appAuthMocks.resolveAppAuthContext.mockResolvedValue({
      federatedAvailable: true,
      accountAuthenticated: true,
      federatedAuthenticated: true,
      walletAuthenticated: false,
      sessionConflict: false,
      accountId: "account_123",
      workosUserId: "user_123",
      workosSessionId: "session_123",
      workosEmail: "user@example.com",
      walletPublicKey: null,
      role: undefined,
      authMethod: "federated"
    });

    referralRepositoryMocks.upsertReferralIntentForAccount.mockResolvedValue({
      outcome: "stored",
      intent: {
        id: "intent_123",
        accountId: "account_123",
        referralCode: "REF123",
        attributionSource: "link",
        capturedAt: "2026-05-10T00:00:00.000Z",
        status: "active",
        metadata: { landingPath: "/?ref=REF123" },
        resolvedAt: null,
        promotedAttributionId: null
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires an active federated account session", async () => {
    appAuthMocks.resolveAppAuthContext.mockResolvedValueOnce({
      federatedAvailable: true,
      accountAuthenticated: false,
      federatedAuthenticated: false,
      walletAuthenticated: false,
      sessionConflict: false,
      accountId: null,
      workosUserId: null,
      workosSessionId: null,
      workosEmail: null,
      walletPublicKey: null,
      role: undefined,
      authMethod: "anonymous"
    });

    const response = await POST(createRequest({ referralCode: "REF123" }));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toContain("active account session");
  });

  it("rejects persistence once a wallet-authenticated session exists", async () => {
    appAuthMocks.resolveAppAuthContext.mockResolvedValueOnce({
      federatedAvailable: true,
      accountAuthenticated: true,
      federatedAuthenticated: true,
      walletAuthenticated: true,
      sessionConflict: false,
      accountId: "account_123",
      workosUserId: "user_123",
      workosSessionId: "session_123",
      workosEmail: "user@example.com",
      walletPublicKey: "Wallet111",
      role: "user",
      authMethod: "hybrid"
    });

    const response = await POST(createRequest({ referralCode: "REF123" }));
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toContain("wallet-authenticated");
  });

  it("stores an active intent for the current federated account", async () => {
    const response = await POST(
      createRequest({
        referralCode: "REF123",
        attributionSource: "manual",
        capturedAt: "2026-05-10T00:00:00.000Z",
        metadata: { landingPath: "/pricing" }
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(referralRepositoryMocks.upsertReferralIntentForAccount).toHaveBeenCalledWith({
      accountId: "account_123",
      referralCode: "REF123",
      attributionSource: "manual",
      capturedAt: "2026-05-10T00:00:00.000Z",
      metadata: { landingPath: "/pricing" }
    });
    expect(payload.intent.id).toBe("intent_123");
  });

  it("returns 400 when the referral code is invalid", async () => {
    referralRepositoryMocks.upsertReferralIntentForAccount.mockResolvedValueOnce({
      outcome: "rejected_invalid_code",
      referralCode: "BADCODE"
    });

    const response = await POST(createRequest({ referralCode: "BADCODE" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.referralCode).toBe("BADCODE");
  });
});
