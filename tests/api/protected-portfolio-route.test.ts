import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  resolveAppAuthContext: vi.fn(),
  getInvestorPortfolio: vi.fn()
}));

vi.mock("@/lib/app-auth", () => ({
  resolveAppAuthContext: routeMocks.resolveAppAuthContext
}));

vi.mock("@/lib/investor-portfolio-service", () => ({
  getInvestorPortfolio: routeMocks.getInvestorPortfolio
}));

import { GET } from "@/app/api/protected/portfolio/route";

describe("GET /api/protected/portfolio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.resolveAppAuthContext.mockResolvedValue({
      accountAuthenticated: true,
      walletAuthenticated: true,
      walletPublicKey: "Wallet111",
      sessionConflict: false
    });
    routeMocks.getInvestorPortfolio.mockResolvedValue({
      walletPublicKey: "Wallet111",
      accountStatus: "wallet_bound",
      positions: [],
      summary: {
        positionCount: 0,
        totalOwnedQuantity: 0
      },
      dataQuality: {
        status: "empty"
      }
    });
  });

  it("returns 401 when account authentication is missing", async () => {
    routeMocks.resolveAppAuthContext.mockResolvedValueOnce({
      accountAuthenticated: false,
      walletAuthenticated: false,
      walletPublicKey: null,
      sessionConflict: false
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
    expect(routeMocks.getInvestorPortfolio).not.toHaveBeenCalled();
  });

  it("uses the server-side wallet and ignores wallet query params", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(routeMocks.getInvestorPortfolio).toHaveBeenCalledWith({
      walletPublicKey: "Wallet111",
      accountAuthenticated: true,
      sessionConflict: false
    });
  });

  it("returns wallet_required for authenticated accounts without wallet context", async () => {
    routeMocks.resolveAppAuthContext.mockResolvedValueOnce({
      accountAuthenticated: true,
      walletAuthenticated: false,
      walletPublicKey: null,
      sessionConflict: false
    });
    routeMocks.getInvestorPortfolio.mockResolvedValueOnce({
      walletPublicKey: null,
      accountStatus: "wallet_required",
      positions: [],
      dataQuality: {
        status: "wallet_required"
      }
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.accountStatus).toBe("wallet_required");
    expect(routeMocks.getInvestorPortfolio).toHaveBeenCalledWith({
      walletPublicKey: null,
      accountAuthenticated: true,
      sessionConflict: false
    });
  });

  it("returns a stable route error when the read model fails", async () => {
    routeMocks.getInvestorPortfolio.mockRejectedValueOnce(new Error("database unavailable"));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error.code).toBe("INVESTOR_PORTFOLIO_FETCH_FAILED");
  });
});
