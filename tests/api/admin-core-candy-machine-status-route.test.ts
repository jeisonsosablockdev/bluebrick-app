import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  getWebhookEventsBySignatures: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/mint-orchestrator-store", () => ({
  getWebhookEventsBySignatures: routeMocks.getWebhookEventsBySignatures
}));

import { POST } from "@/app/api/admin/core-candy-machine/status/route";

describe("api/admin/core-candy-machine/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "11111111111111111111111111111111"
    });
  });

  it("rejects unauthenticated or non-admin requests", async () => {
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: false,
      role: "user",
      pubkey: null
    });

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ signatures: ["sig-1"] })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Forbidden");
  });

  it("returns 400 when signatures payload is missing or empty", async () => {
    const invalidBodyRequest = new NextRequest("https://example.com/api/admin/core-candy-machine/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    const invalidBodyResponse = await POST(invalidBodyRequest);
    expect(invalidBodyResponse.status).toBe(400);

    const emptyRequest = new NextRequest("https://example.com/api/admin/core-candy-machine/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ signatures: [null, "", 123] })
    });

    const emptyResponse = await POST(emptyRequest);
    const payload = await emptyResponse.json();
    expect(emptyResponse.status).toBe(400);
    expect(payload.error).toBe("At least one signature is required.");
  });

  it("returns signature statuses for valid admin requests", async () => {
    routeMocks.getWebhookEventsBySignatures.mockReturnValue({
      "sig-1": { confirmed: true },
      "sig-2": null
    });

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ signatures: ["sig-1", "sig-2"] })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(routeMocks.getWebhookEventsBySignatures).toHaveBeenCalledWith("helius", ["sig-1", "sig-2"]);
    expect(payload.statuses).toEqual({
      "sig-1": { confirmed: true },
      "sig-2": null
    });
  });
});
