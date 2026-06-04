import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

import { POST } from "@/app/api/admin/core-candy-machine/mint/prepare/route";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/admin/core-candy-machine/mint/prepare", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/admin/core-candy-machine/mint/prepare", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the legacy admin mint route disabled for authenticated admins", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "admin",
      pubkey: "Admin11111111111111111111111111111111111111"
    });

    const response = await POST(createRequest({ candyMachineAddress: "CM111" }));
    const payload = await response.json();

    expect(response.status).toBe(410);
    expect(payload.error).toContain("marketplace purchase prepare/submit");
  });

  it("still rejects non-admin callers before revealing route state", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "user",
      pubkey: "User11111111111111111111111111111111111111"
    });

    const response = await POST(createRequest({ candyMachineAddress: "CM111" }));

    expect(response.status).toBe(403);
  });
});
