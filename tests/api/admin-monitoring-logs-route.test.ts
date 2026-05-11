import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

import { GET } from "@/app/api/admin/monitoring/logs/route";
import { recordOperabilityLog, resetObservabilityStateForTests } from "@/lib/observability";

function createRequest(url = "https://example.com/api/admin/monitoring/logs?limit=20"): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

describe("GET /api/admin/monitoring/logs", () => {
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
      authenticated: false,
      role: "user",
      pubkey: null
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
  });

  it("returns log entries for admin", async () => {
    recordOperabilityLog({
      level: "warn",
      event: "health.snapshot",
      message: "degraded"
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.entries).toHaveLength(1);
    expect(payload.data.entries[0].event).toBe("health.snapshot");
  });
});
