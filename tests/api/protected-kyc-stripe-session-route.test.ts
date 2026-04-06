import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getAuthenticatedPublicKeyFromRequest: vi.fn(),
  consumeStripeSessionRateLimit: vi.fn(),
  createStripeIdentityVerificationSession: vi.fn(),
  markKycSessionPending: vi.fn(),
  runWalletAmlScreening: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  getAuthenticatedPublicKeyFromRequest: routeMocks.getAuthenticatedPublicKeyFromRequest
}));

vi.mock("@/lib/kyc/stripe-identity", () => ({
  consumeStripeSessionRateLimit: routeMocks.consumeStripeSessionRateLimit,
  createStripeIdentityVerificationSession: routeMocks.createStripeIdentityVerificationSession
}));

vi.mock("@/lib/compliance/profile-repository", () => ({
  markKycSessionPending: routeMocks.markKycSessionPending
}));

vi.mock("@/lib/compliance/aml-screening-service", () => ({
  runWalletAmlScreening: routeMocks.runWalletAmlScreening
}));

import { POST } from "@/app/api/protected/kyc/stripe/session/route";

function createRequest(): NextRequest {
  return new NextRequest("https://example.com/api/protected/kyc/stripe/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.8"
    },
    body: JSON.stringify({})
  });
}

describe("POST /api/protected/kyc/stripe/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getAuthenticatedPublicKeyFromRequest.mockReturnValue("Wallet11111111111111111111111111111111111");
    routeMocks.consumeStripeSessionRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
    routeMocks.createStripeIdentityVerificationSession.mockResolvedValue({
      id: "vs_123",
      url: "https://verify.stripe.com/vs_123",
      status: "requires_input"
    });
    routeMocks.markKycSessionPending.mockResolvedValue(undefined);
    routeMocks.runWalletAmlScreening.mockResolvedValue({
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      amlStatus: "pending",
      providerClassification: "review_required",
      amlRiskScore: 52,
      flags: [{ code: "screening_started", severity: "low" }],
      provider: "helius",
      ruleVersion: "helius-v1",
      checkedAt: "2026-03-25T00:00:00.000Z",
      complianceStatus: "pending_review"
    });
  });

  it("returns 401 when unauthenticated", async () => {
    routeMocks.getAuthenticatedPublicKeyFromRequest.mockReturnValueOnce(null);

    const response = await POST(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 429 when rate limit is exceeded", async () => {
    routeMocks.consumeStripeSessionRateLimit.mockReturnValueOnce({ allowed: false, retryAfterSeconds: 120 });

    const response = await POST(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.error.code).toBe("RATE_LIMITED");
    expect(response.headers.get("retry-after")).toBe("120");
    expect(routeMocks.createStripeIdentityVerificationSession).not.toHaveBeenCalled();
  });

  it("creates Stripe session and persists local pending status", async () => {
    const response = await POST(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.sessionId).toBe("vs_123");
    expect(payload.data.url).toBe("https://verify.stripe.com/vs_123");
    expect(routeMocks.createStripeIdentityVerificationSession).toHaveBeenCalledTimes(1);
    expect(routeMocks.markKycSessionPending).toHaveBeenCalledWith({
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      provider: "stripe_identity",
      providerSessionId: "vs_123"
    });
    expect(routeMocks.runWalletAmlScreening).toHaveBeenCalledWith({
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      trigger: "kyc_session_started",
      actorType: "user",
      actorId: "Wallet11111111111111111111111111111111111"
    });
  });
});
