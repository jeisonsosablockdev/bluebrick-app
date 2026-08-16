import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getAuthenticatedPublicKeyFromRequest: vi.fn(),
  getOrCreateProfileBundle: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  getAuthenticatedPublicKeyFromRequest: routeMocks.getAuthenticatedPublicKeyFromRequest
}));

vi.mock("@/features/profile/infrastructure/profile-repository", () => ({
  getOrCreateProfileBundle: routeMocks.getOrCreateProfileBundle
}));

import { GET } from "@/app/api/protected/kyc/status/route";

function createRequest(): NextRequest {
  return new NextRequest("https://example.com/api/protected/kyc/status", { method: "GET" });
}

describe("GET /api/protected/kyc/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getAuthenticatedPublicKeyFromRequest.mockReturnValue("Wallet11111111111111111111111111111111111");
    routeMocks.getOrCreateProfileBundle.mockResolvedValue({
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      username: "user_one",
      bio: "Bio",
      avatarUrl: "https://example.com/avatar.png",
      kycStatus: "pending",
      amlStatus: "pending",
      complianceStatus: "pending_review",
      rejectionReasonCode: null,
      kycProviderSessionId: "vs_123",
      kycProviderReportId: null,
      isSuspended: false,
      complianceStatusUpdatedAt: "2026-03-24T00:00:00.000Z",
      createdAt: "2026-03-24T00:00:00.000Z",
      updatedAt: "2026-03-24T00:00:00.000Z"
    });
  });

  it("returns 401 when unauthenticated", async () => {
    routeMocks.getAuthenticatedPublicKeyFromRequest.mockReturnValueOnce(null);

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
  });

  it("returns kyc/compliance status for authenticated wallet", async () => {
    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.kycStatus).toBe("pending");
    expect(payload.data.complianceStatus).toBe("pending_review");
    expect(payload.data.kycProviderSessionId).toBe("vs_123");
  });
});
