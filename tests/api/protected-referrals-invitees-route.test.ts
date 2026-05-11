import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getAuthenticatedPublicKeyFromRequest: vi.fn(),
  listReferralDashboardInvitees: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  getAuthenticatedPublicKeyFromRequest: routeMocks.getAuthenticatedPublicKeyFromRequest
}));

vi.mock("@/lib/referrals/dashboard-service", () => ({
  listReferralDashboardInvitees: routeMocks.listReferralDashboardInvitees
}));

import { GET } from "@/app/api/protected/referrals/invitees/route";

function createRequest(query = ""): NextRequest {
  return new NextRequest(`https://example.com/api/protected/referrals/invitees${query}`, {
    method: "GET"
  });
}

describe("GET /api/protected/referrals/invitees", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getAuthenticatedPublicKeyFromRequest.mockReturnValue("Wallet11111111111111111111111111111111111");
    routeMocks.listReferralDashboardInvitees.mockResolvedValue({
      items: [
        {
          inviteeWalletDisplay: "Abcd...Wxyz",
          state: "pending",
          attributionStatus: "bound_pending_kyc",
          rewardStatus: null,
          rewardAmountUsdc: 0,
          boundDay: "2026-05-03",
          qualifiedDay: null
        }
      ],
      totalCount: 1,
      limit: 10,
      offset: 0,
      hasMore: false
    });
  });

  it("returns 401 without an authenticated wallet", async () => {
    routeMocks.getAuthenticatedPublicKeyFromRequest.mockReturnValueOnce(null);

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
  });

  it("returns a paginated invitee page for the authenticated wallet", async () => {
    const response = await GET(createRequest("?limit=15&offset=5"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.totalCount).toBe(1);
    expect(routeMocks.listReferralDashboardInvitees).toHaveBeenCalledWith({
      referrerWalletPublicKey: "Wallet11111111111111111111111111111111111",
      limit: 15,
      offset: 5
    });
  });
});
