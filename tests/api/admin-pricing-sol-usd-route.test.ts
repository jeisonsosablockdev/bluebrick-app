import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

import { GET } from "@/app/api/admin/pricing/sol-usd/route";

describe("api/admin/pricing/sol-usd", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "11111111111111111111111111111111"
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns forbidden when requester is not admin", async () => {
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "viewer",
      pubkey: "11111111111111111111111111111111"
    });

    const request = new NextRequest("https://example.com/api/admin/pricing/sol-usd", {
      method: "GET"
    });

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Forbidden");
  });

  it("returns 502 when provider quote cannot be resolved", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ solana: { usd: null } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const request = new NextRequest("https://example.com/api/admin/pricing/sol-usd", {
      method: "GET"
    });

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload.error).toBe("Could not resolve SOL/USD price from provider.");
  });

  it("returns SOL/USD quote from provider", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ solana: { usd: 180.25 } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const request = new NextRequest("https://example.com/api/admin/pricing/sol-usd", {
      method: "GET"
    });

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.solUsd).toBe(180.25);
    expect(payload.source).toBe("coingecko");
    expect(payload.stale).toBe(false);
  });
});
