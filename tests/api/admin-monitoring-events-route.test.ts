import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  getAdminMonitoringEvents: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/purchase-metrics-service", () => ({
  getAdminMonitoringEvents: routeMocks.getAdminMonitoringEvents
}));

import { GET } from "@/app/api/admin/monitoring/events/route";

function createRequest(url = "https://example.com/api/admin/monitoring/events?eventType=NFT_SALE&status=failed&wallet=Wallet111&asset=torre-marina-premium&signature=sig123&page=2&limit=15"): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

describe("GET /api/admin/monitoring/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin111"
    });
    routeMocks.getAdminMonitoringEvents.mockResolvedValue({
      events: [],
      pagination: { page: 2, limit: 15, total: 0, totalPages: 0 },
      meta: { lastSyncedAt: null, dataFreshness: "stale", source: "webhook-reconciled" }
    });
  });

  it("returns 403 when caller is not admin", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({ authenticated: true, role: "user", pubkey: "User111" });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(routeMocks.getAdminMonitoringEvents).not.toHaveBeenCalled();
  });

  it("returns 200 with monitoring filters and paging", async () => {
    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(routeMocks.getAdminMonitoringEvents).toHaveBeenCalledWith({
      eventType: "NFT_SALE",
      status: "failed",
      wallet: "Wallet111",
      asset: "torre-marina-premium",
      signature: "sig123",
      page: 2,
      limit: 15
    });
  });
});
