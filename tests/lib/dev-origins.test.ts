import { afterEach, describe, expect, it, vi } from "vitest";

describe("lib/dev-origins", () => {
  afterEach(() => {
    vi.resetModules();
    delete process.env.NEXT_DEV_ALLOWED_ORIGINS;
  });

  it("includes loopback defaults and external IPv4 interfaces", async () => {
    vi.doMock("node:os", () => ({
      default: {
        networkInterfaces: () => ({
          en0: [
            { address: "192.168.10.13", family: "IPv4", internal: false },
            { address: "::1", family: "IPv6", internal: true }
          ]
        })
      }
    }));

    const { getAllowedDevOrigins } = await import("@/lib/dev-origins");
    const result = getAllowedDevOrigins();

    expect(result).toEqual(expect.arrayContaining(["localhost", "127.0.0.1", "[::1]", "192.168.10.13"]));
  });

  it("adds explicit env overrides", async () => {
    process.env.NEXT_DEV_ALLOWED_ORIGINS = "devbox.local, 10.0.0.8";
    vi.doMock("node:os", () => ({
      default: {
        networkInterfaces: () => ({})
      }
    }));

    const { getAllowedDevOrigins } = await import("@/lib/dev-origins");
    const result = getAllowedDevOrigins();

    expect(result).toEqual(expect.arrayContaining(["devbox.local", "10.0.0.8"]));
  });
});
