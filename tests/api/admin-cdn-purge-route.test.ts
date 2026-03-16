import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  invalidateCdnPaths: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/asset-uploads/cdn-invalidation", () => ({
  invalidateCdnPaths: routeMocks.invalidateCdnPaths
}));

import { POST as purgeCdnRoute } from "@/app/api/admin/cdn/purge/route";

function createJsonPostRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/admin/cdn/purge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/admin/cdn/purge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "AdminPubkey111111111111111111111111111111111111"
    });
    routeMocks.invalidateCdnPaths.mockResolvedValue({
      status: "success",
      paths: ["/assets/old.png"],
      providerRequestId: "req-123",
      reason: null
    });
  });

  it("returns 401 when unauthenticated", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({ authenticated: false });

    const response = await purgeCdnRoute(createJsonPostRequest({ paths: ["/assets/old.png"] }));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 400 when paths payload is invalid", async () => {
    const response = await purgeCdnRoute(createJsonPostRequest({ paths: [] }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_PURGE_REQUEST");
  });

  it("returns 502 when provider invalidation fails", async () => {
    routeMocks.invalidateCdnPaths.mockResolvedValueOnce({
      status: "failed",
      paths: ["/assets/old.png"],
      providerRequestId: null,
      reason: "provider down"
    });

    const response = await purgeCdnRoute(createJsonPostRequest({ paths: ["/assets/old.png"] }));
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload.error.code).toBe("CDN_INVALIDATION_FAILED");
  });

  it("returns 200 with paths on success", async () => {
    const response = await purgeCdnRoute(createJsonPostRequest({ paths: ["/assets/old.png"] }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: true,
      status: "success",
      paths: ["/assets/old.png"],
      providerRequestId: "req-123"
    });
  });
});
