import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  getAdminSalesOverview: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/purchase-metrics-service", () => ({
  getAdminSalesOverview: routeMocks.getAdminSalesOverview
}));

import { GET } from "@/app/api/admin/sales/overview/route";

function createRequest(url = "https://example.com/api/admin/sales/overview?range=7d&status=confirmed&wallet=Wallet111&candyMachine=CM111"): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

describe("GET /api/admin/sales/overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin111"
    });
    routeMocks.getAdminSalesOverview.mockResolvedValue({
      highlights: [],
      summary: { totalAttempts: 0, confirmedAttempts: 0, failedAttempts: 0, confirmedRevenueLamports: 0 },
      recentSales: [],
      meta: { range: "7d", lastSyncedAt: null, dataFreshness: "stale", source: "webhook-reconciled" }
    });
  });

  it("returns 403 when caller is not admin", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({ authenticated: true, role: "user", pubkey: "User111" });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(routeMocks.getAdminSalesOverview).not.toHaveBeenCalled();
  });

  it("returns 200 with filters passed to service", async () => {
    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(routeMocks.getAdminSalesOverview).toHaveBeenCalledWith({
      range: "7d",
      status: "confirmed",
      wallet: "Wallet111",
      candyMachine: "CM111"
    });
  });
});
