import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  getAdminDashboardOverview: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/purchase-metrics-service", () => ({
  getAdminDashboardOverview: routeMocks.getAdminDashboardOverview
}));

import { GET } from "@/app/api/admin/dashboard/overview/route";

function createRequest(url = "https://example.com/api/admin/dashboard/overview?range=24h"): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

describe("GET /api/admin/dashboard/overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin111"
    });
    routeMocks.getAdminDashboardOverview.mockResolvedValue({
      kpis: { totalAttempts: 10, confirmedAttempts: 8, failedAttempts: 2, revenueLamports: 80_000 },
      alerts: [],
      recentActivity: [],
      assetSummary: [],
      charts: { attemptsByDay: [], revenueByDay: [] },
      meta: { range: "24h", lastSyncedAt: "2026-03-20T19:00:00.000Z", dataFreshness: "fresh", source: "webhook-reconciled" }
    });
  });

  it("returns 403 when caller is not admin", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({ authenticated: true, role: "user", pubkey: "User111" });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(routeMocks.getAdminDashboardOverview).not.toHaveBeenCalled();
  });

  it("returns 200 with dashboard overview payload", async () => {
    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.meta.range).toBe("24h");
    expect(routeMocks.getAdminDashboardOverview).toHaveBeenCalledWith({ range: "24h" });
  });
});
