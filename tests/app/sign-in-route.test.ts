import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authkitMocks = vi.hoisted(() => ({
  getSignInUrl: vi.fn()
}));

const workosConfigMocks = vi.hoisted(() => ({
  isWorkosConfigured: vi.fn()
}));

vi.mock("@workos-inc/authkit-nextjs", () => ({
  getSignInUrl: authkitMocks.getSignInUrl
}));

vi.mock("@/lib/workos/config", () => ({
  isWorkosConfigured: workosConfigMocks.isWorkosConfigured
}));

import { GET } from "@/app/sign-in/route";

describe("GET /sign-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects home when WorkOS is not fully configured", async () => {
    workosConfigMocks.isWorkosConfigured.mockReturnValue(false);

    const response = await GET(new NextRequest("https://example.com/sign-in?returnTo=%2Fprotected"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/");
    expect(authkitMocks.getSignInUrl).not.toHaveBeenCalled();
  });

  it("delegates to WorkOS when configuration is valid", async () => {
    workosConfigMocks.isWorkosConfigured.mockReturnValue(true);
    authkitMocks.getSignInUrl.mockResolvedValue("https://auth.workos.com/start");

    const response = await GET(new NextRequest("https://example.com/sign-in?returnTo=%2Fprotected"));

    expect(authkitMocks.getSignInUrl).toHaveBeenCalledWith({ returnTo: "/protected" });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://auth.workos.com/start");
  });

  it("ignores unsafe returnTo targets", async () => {
    workosConfigMocks.isWorkosConfigured.mockReturnValue(true);
    authkitMocks.getSignInUrl.mockResolvedValue("https://auth.workos.com/start");

    await GET(new NextRequest("https://example.com/sign-in?returnTo=https://evil.example"));

    expect(authkitMocks.getSignInUrl).toHaveBeenCalledWith({ returnTo: "/profile" });
  });
});

