import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  issuePurchaseChallengeForProperty: vi.fn(),
  getOrCreateProfileBundle: vi.fn(),
  assertFinancialAccessByComplianceStatus: vi.fn(),
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
  },
  MockComplianceCaseServiceError: class MockComplianceCaseServiceError extends Error {
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

vi.mock("@/features/profile/infrastructure/profile-repository", () => ({
  getOrCreateProfileBundle: routeMocks.getOrCreateProfileBundle
}));

vi.mock("@/features/profile/application/case-service", () => ({
  ComplianceCaseServiceError: routeMocks.MockComplianceCaseServiceError,
  assertFinancialAccessByComplianceStatus: routeMocks.assertFinancialAccessByComplianceStatus
}));

import { POST } from "@/app/api/purchase/challenge/route";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/purchase/challenge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/purchase/challenge compliance guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "user",
      pubkey: "UserWallet111111111111111111111111111111111111"
    });
    routeMocks.getOrCreateProfileBundle.mockResolvedValue({
      complianceStatus: "fully_verified"
    });
    routeMocks.assertFinancialAccessByComplianceStatus.mockImplementation(() => undefined);
    routeMocks.issuePurchaseChallengeForProperty.mockResolvedValue({
      propertyId: "central-norte",
      quantityMode: "MULTI_ENABLED",
      quantity: 1,
      challengeId: "challenge_1",
      nonce: "nonce_1",
      message: "challenge",
      expiresAt: "2026-03-26T00:00:30.000Z"
    });
  });

  it("blocks financial flow when compliance status is restricted", async () => {
    routeMocks.getOrCreateProfileBundle.mockResolvedValueOnce({
      complianceStatus: "restricted_aml"
    });
    routeMocks.assertFinancialAccessByComplianceStatus.mockImplementationOnce(() => {
      throw new routeMocks.MockComplianceCaseServiceError(
        "COMPLIANCE_RESTRICTED",
        "This wallet is restricted by compliance policy.",
        403
      );
    });

    const response = await POST(createRequest({ propertyId: "central-norte", quantity: 1 }));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("COMPLIANCE_RESTRICTED");
    expect(routeMocks.issuePurchaseChallengeForProperty).not.toHaveBeenCalled();
  });

  it("continues purchase challenge flow when compliance allows access", async () => {
    const response = await POST(createRequest({ propertyId: "central-norte", quantity: 1 }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(routeMocks.assertFinancialAccessByComplianceStatus).toHaveBeenCalledWith("fully_verified");
    expect(routeMocks.issuePurchaseChallengeForProperty).toHaveBeenCalledTimes(1);
  });
});
