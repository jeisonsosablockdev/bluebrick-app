import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getAuthenticatedPublicKeyFromRequest: vi.fn(),
  getReferralDashboardSummary: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  getAuthenticatedPublicKeyFromRequest: routeMocks.getAuthenticatedPublicKeyFromRequest
}));

vi.mock("@/features/referral-marketing/application/dashboard-service", () => ({
  getReferralDashboardSummary: routeMocks.getReferralDashboardSummary
}));

import { GET } from "@/app/api/protected/referrals/summary/route";

function createRequest(): NextRequest {
  return new NextRequest("https://example.com/api/protected/referrals/summary", {
    method: "GET"
  });
}

describe("GET /api/protected/referrals/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getAuthenticatedPublicKeyFromRequest.mockReturnValue("Wallet11111111111111111111111111111111111");
    routeMocks.getReferralDashboardSummary.mockResolvedValue({
      referralCode: "REF-CODE-1",
      sharePath: "/r/REF-CODE-1",
      pendingInviteesCount: 1,
      completedInviteesCount: 2,
      notificationCount: 2,
      totalAccruedUsdc: 10,
      totalPendingDistributionUsdc: 20,
      totalPaidUsdc: 30,
      nextMilestone: {
        targetCount: 3,
        progressCount: 2,
        progressPercent: 67
      }
    });
  });

  it("returns 401 without an authenticated wallet", async () => {
    routeMocks.getAuthenticatedPublicKeyFromRequest.mockReturnValueOnce(null);

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
  });

  it("returns the referral dashboard summary for the authenticated wallet", async () => {
    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.referralCode).toBe("REF-CODE-1");
    expect(routeMocks.getReferralDashboardSummary).toHaveBeenCalledWith({
      referrerWalletPublicKey: "Wallet11111111111111111111111111111111111"
    });
  });
});
