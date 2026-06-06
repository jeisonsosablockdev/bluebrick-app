import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  resolveAppAuthContext: vi.fn(),
  getInvestorOverview: vi.fn()
}));

vi.mock("@/lib/app-auth", () => ({
  resolveAppAuthContext: routeMocks.resolveAppAuthContext
}));

vi.mock("@/lib/investor-overview-service", () => ({
  getInvestorOverview: routeMocks.getInvestorOverview
}));

import { GET } from "@/app/api/protected/overview/route";

describe("GET /api/protected/overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.resolveAppAuthContext.mockResolvedValue({
      accountAuthenticated: true,
      walletAuthenticated: true,
      walletPublicKey: "Wallet111",
      sessionConflict: false
    });
    routeMocks.getInvestorOverview.mockResolvedValue({
      walletPublicKey: "Wallet111",
      accountStatus: "wallet_bound",
      summary: {
        currentlyOwnedFractions: 1
      },
      dataQuality: {
        status: "ready"
      }
    });
  });

  it("returns 401 when the protected account session is missing", async () => {
    routeMocks.resolveAppAuthContext.mockResolvedValueOnce({
      accountAuthenticated: false,
      walletAuthenticated: false,
      walletPublicKey: null,
      sessionConflict: false
    });

    const response = await GET(new NextRequest("https://example.com/api/protected/overview"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
    expect(routeMocks.getInvestorOverview).not.toHaveBeenCalled();
  });

  it("uses the server-side wallet from auth context and ignores wallet query params", async () => {
    const response = await GET(new NextRequest("https://example.com/api/protected/overview?walletPublicKey=AttackerWallet"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(routeMocks.getInvestorOverview).toHaveBeenCalledWith({
      walletPublicKey: "Wallet111",
      accountAuthenticated: true,
      sessionConflict: false
    });
  });

  it("returns wallet_required for authenticated accounts without an operational wallet", async () => {
    routeMocks.resolveAppAuthContext.mockResolvedValueOnce({
      accountAuthenticated: true,
      walletAuthenticated: false,
      walletPublicKey: null,
      sessionConflict: false
    });
    routeMocks.getInvestorOverview.mockResolvedValueOnce({
      walletPublicKey: null,
      accountStatus: "wallet_required",
      dataQuality: {
        status: "wallet_required"
      }
    });

    const response = await GET(new NextRequest("https://example.com/api/protected/overview"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.accountStatus).toBe("wallet_required");
    expect(routeMocks.getInvestorOverview).toHaveBeenCalledWith({
      walletPublicKey: null,
      accountAuthenticated: true,
      sessionConflict: false
    });
  });
});
