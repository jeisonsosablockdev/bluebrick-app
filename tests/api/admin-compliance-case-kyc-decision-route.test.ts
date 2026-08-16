import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  applyKycDecisionForComplianceCase: vi.fn(),
  getOnboardingRewardForWallet: vi.fn(),
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

vi.mock("@/features/profile/application/case-service", () => ({
  ComplianceCaseServiceError: routeMocks.MockComplianceCaseServiceError,
  applyKycDecisionForComplianceCase: routeMocks.applyKycDecisionForComplianceCase
}));

vi.mock("@/lib/onboarding-reward-service", () => ({
  getOnboardingRewardForWallet: routeMocks.getOnboardingRewardForWallet
}));

import { POST } from "@/app/api/admin/compliance/cases/[walletPublicKey]/kyc-decision/route";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/admin/compliance/cases/Wallet11111111111111111111111111111111111/kyc-decision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/admin/compliance/cases/:walletPublicKey/kyc-decision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin1111111111111111111111111111111111111"
    });
    routeMocks.applyKycDecisionForComplianceCase.mockResolvedValue({
      profile: {
        walletPublicKey: "Wallet11111111111111111111111111111111111",
        kycStatus: "verified",
        amlStatus: "pending",
        complianceStatus: "pending_review",
        rejectionReasonCode: null,
        username: "",
        bio: "",
        avatarUrl: "",
        kycProviderSessionId: null,
        kycProviderReportId: null,
        isSuspended: false,
        complianceStatusUpdatedAt: "2026-03-26T00:00:00.000Z",
        createdAt: "2026-03-25T00:00:00.000Z",
        updatedAt: "2026-03-26T00:00:00.000Z"
      },
      idempotent: false
    });
    routeMocks.getOnboardingRewardForWallet.mockResolvedValue({ id: "reward-1" });
  });

  it("returns 403 for non-admin users", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "user",
      pubkey: "User11111111111111111111111111111111111111"
    });

    const response = await POST(createRequest({ decision: "verified" }), {
      params: Promise.resolve({ walletPublicKey: "Wallet11111111111111111111111111111111111" })
    });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
  });

  it("returns 400 when decision is invalid", async () => {
    const response = await POST(createRequest({ decision: "invalid" }), {
      params: Promise.resolve({ walletPublicKey: "Wallet11111111111111111111111111111111111" })
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_DECISION");
  });

  it("applies KYC decision and returns payload", async () => {
    const response = await POST(createRequest({ decision: "rejected", reason: "document mismatch" }), {
      params: Promise.resolve({ walletPublicKey: "Wallet11111111111111111111111111111111111" })
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(routeMocks.applyKycDecisionForComplianceCase).toHaveBeenCalledWith({
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      adminActorId: "Admin1111111111111111111111111111111111111",
      decision: "rejected",
      reason: "document mismatch"
    });
    expect(routeMocks.getOnboardingRewardForWallet).toHaveBeenCalledWith("Wallet11111111111111111111111111111111111");
  });
});
