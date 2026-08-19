import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  issuePurchaseChallengeForProperty: vi.fn(),
  MockPurchaseFlowError: class MockPurchaseFlowError extends Error {
    code: string;
    status: number;
    details?: Record<string, unknown>;

    constructor(code: string, message: string, status: number, details?: Record<string, unknown>) {
      super(message);
      this.code = code;
      this.status = status;
      this.details = details;
    }
  }
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/features/checkout-payment/application/purchase-service", () => ({
  PurchaseFlowError: routeMocks.MockPurchaseFlowError,
  issuePurchaseChallengeForProperty: routeMocks.issuePurchaseChallengeForProperty
}));

import { POST } from "@/app/api/purchase/challenge/route";

function createRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("https://example.com/api/purchase/challenge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/purchase/challenge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "user",
      pubkey: "UserWallet111111111111111111111111111111111111"
    });
  });

  it("returns 401 when caller is not authenticated", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({ authenticated: false });

    const response = await POST(createRequest({ propertyId: "central-norte" }));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
    expect(routeMocks.issuePurchaseChallengeForProperty).not.toHaveBeenCalled();
  });

  it("returns 400 when payload is invalid", async () => {
    const response = await POST(createRequest({}));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("TRANSACTION_FAILED");
    expect(routeMocks.issuePurchaseChallengeForProperty).not.toHaveBeenCalled();
  });

  it("returns challenge payload when successful", async () => {
    routeMocks.issuePurchaseChallengeForProperty.mockResolvedValueOnce({
      propertyId: "central-norte",
      challengeId: "challenge-1",
      nonce: "nonce-1",
      message: "challenge message",
      expiresAt: "2026-03-20T00:00:30.000Z"
    });

    const response = await POST(
      createRequest(
        { propertyId: "central-norte", quantity: 1 },
        { "x-forwarded-for": "203.0.113.9, 10.0.0.1" }
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.challengeId).toBe("challenge-1");
    expect(routeMocks.issuePurchaseChallengeForProperty).toHaveBeenCalledWith({
      propertyId: "central-norte",
      buyerPublicKey: "UserWallet111111111111111111111111111111111111",
      quantity: 1,
      clientIp: "203.0.113.9"
    });
  });

  it("returns 400 when quantity is invalid", async () => {
    const response = await POST(createRequest({ propertyId: "central-norte", quantity: -1 }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_QUANTITY");
    expect(routeMocks.issuePurchaseChallengeForProperty).not.toHaveBeenCalled();
  });

  it("returns business error payload when service throws PurchaseFlowError", async () => {
    routeMocks.issuePurchaseChallengeForProperty.mockRejectedValueOnce(
      new routeMocks.MockPurchaseFlowError("RATE_LIMITED", "Too many attempts.", 429)
    );

    const response = await POST(createRequest({ propertyId: "central-norte" }));
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.error.code).toBe("RATE_LIMITED");
  });
});
