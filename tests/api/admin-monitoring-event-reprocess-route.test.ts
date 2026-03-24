import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  reprocessPurchaseWebhookEventById: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/purchase-webhook-reconciliation", () => ({
  reprocessPurchaseWebhookEventById: routeMocks.reprocessPurchaseWebhookEventById
}));

import { POST } from "@/app/api/admin/monitoring/events/[eventId]/reprocess/route";

function createRequest(url = "https://example.com/api/admin/monitoring/events/event-1/reprocess"): NextRequest {
  return new NextRequest(url, { method: "POST" });
}

describe("POST /api/admin/monitoring/events/[eventId]/reprocess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin111"
    });
    routeMocks.reprocessPurchaseWebhookEventById.mockResolvedValue({
      eventId: "event-1",
      signature: "sig-1",
      eventType: "NFT_SALE",
      status: "confirmed",
      reconciled: true
    });
  });

  it("returns 403 for non-admin caller", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({ authenticated: true, role: "user", pubkey: "User111" });

    const response = await POST(createRequest(), { params: Promise.resolve({ eventId: "event-1" }) });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(routeMocks.reprocessPurchaseWebhookEventById).not.toHaveBeenCalled();
  });

  it("returns 200 when reprocess succeeds", async () => {
    const response = await POST(createRequest(), { params: Promise.resolve({ eventId: "event-1" }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(routeMocks.reprocessPurchaseWebhookEventById).toHaveBeenCalledWith({ eventId: "event-1" });
  });
});
