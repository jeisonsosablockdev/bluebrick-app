import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const healthMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  getNotificationHealthSnapshot: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: healthMocks.getRequestRole
}));

vi.mock("@/lib/notifications/health", () => ({
  getNotificationHealthSnapshot: healthMocks.getNotificationHealthSnapshot
}));

import { GET } from "@/app/api/admin/notifications/health/route";

describe("GET /api/admin/notifications/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    healthMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "AdminPubkey111"
    });
    healthMocks.getNotificationHealthSnapshot.mockResolvedValue({
      subscriptions: { active: 2 },
      deliveries: { delivered: 3 },
      rollout: { deliveryEnabled: true }
    });
  });

  it("rejects non-admin callers", async () => {
    healthMocks.getRequestRole.mockReturnValueOnce({ authenticated: false });

    const response = await GET(new NextRequest("https://example.com/api/admin/notifications/health"));
    expect(response.status).toBe(403);
  });

  it("returns the health snapshot for admin callers", async () => {
    const response = await GET(new NextRequest("https://example.com/api/admin/notifications/health"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.subscriptions.active).toBe(2);
    expect(payload.data.deliveries.delivered).toBe(3);
  });
});
