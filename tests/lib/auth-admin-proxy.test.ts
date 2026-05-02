import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { handleAdminProxy } from "@/lib/auth-admin-proxy";

describe("lib/auth-admin-proxy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redirects unauthenticated requests to /403", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ authenticated: false }), { status: 200 })
    );

    const response = await handleAdminProxy(
      new NextRequest("https://example.com/admin/collections")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/403");
  });

  it("redirects authenticated non-admin requests to /403", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ authenticated: true, role: "user" }), { status: 200 })
    );

    const response = await handleAdminProxy(
      new NextRequest("https://example.com/admin/collections")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/403");
  });

  it("allows authenticated admin requests through the proxy", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ authenticated: true, role: "admin" }), { status: 200 })
    );

    const request = new NextRequest("https://example.com/admin/collections", {
      headers: {
        cookie: "siws_session=test"
      }
    });

    const response = await handleAdminProxy(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchSpy).toHaveBeenCalledWith(
      new URL("/api/auth/me", request.url),
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: {
          cookie: "siws_session=test"
        }
      })
    );
  });

  it("treats auth endpoint failures as unauthenticated", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "upstream" }), { status: 500 })
    );

    const response = await handleAdminProxy(
      new NextRequest("https://example.com/admin/collections")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/403");
  });
});
