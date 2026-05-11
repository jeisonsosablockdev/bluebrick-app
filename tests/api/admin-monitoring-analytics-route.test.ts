import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

import { GET } from "@/app/api/admin/monitoring/analytics/route";
import { recordAnalyticsEvent, resetObservabilityStateForTests } from "@/lib/observability";

function createRequest(url = "https://example.com/api/admin/monitoring/analytics?minutes=90&limit=5"): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

describe("GET /api/admin/monitoring/analytics", () => {
  beforeEach(() => {
    resetObservabilityStateForTests();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin111"
    });
  });

  it("returns 403 for non-admin callers", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "user",
      pubkey: "User111"
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
  });

  it("returns analytics summary and recent events for admin", async () => {
    recordAnalyticsEvent({ eventType: "page_view", path: "/" });
    recordAnalyticsEvent({ eventType: "cta_click", path: "/", ctaLabel: "Buy" });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.summary.windowMinutes).toBe(90);
    expect(payload.data.summary.byType.page_view).toBe(1);
    expect(payload.data.summary.byType.cta_click).toBe(1);
    expect(payload.data.recentEvents.length).toBeGreaterThan(0);
  });
});
