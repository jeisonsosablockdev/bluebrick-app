import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

import { POST } from "@/app/api/admin/mint-orchestrator/jobs/[jobId]/reconcile/route";

describe("app/api/admin/mint-orchestrator/jobs/[jobId]/reconcile/route", () => {
  it("@spec BRI-12-REQ-2 returns 403 Forbidden when request lacks admin role", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: false,
      role: null,
      pubkey: null
    });

    const request = new NextRequest("http://localhost:3000/api/admin/mint-orchestrator/jobs/job-1/reconcile", {
      method: "POST"
    });

    const response = await POST(request, {
      params: Promise.resolve({ jobId: "job-1" })
    });

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json).toEqual({ error: "Forbidden" });
  });

  it("@spec BRI-12-REQ-2 returns 400 Bad Request when signatures parameter is invalid", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "admin",
      pubkey: "Admin111111111111111111111111111111111111111"
    });

    const request = new NextRequest("http://localhost:3000/api/admin/mint-orchestrator/jobs/job-1/reconcile", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ signatures: "not-an-array" })
    });

    const response = await POST(request, {
      params: Promise.resolve({ jobId: "job-1" })
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("signatures must be an array");
  });
});
