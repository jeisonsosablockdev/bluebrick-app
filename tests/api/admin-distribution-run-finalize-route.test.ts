import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  finalizePreparedDistributionRun: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/distributions/distribution-service", () => ({
  DistributionServiceError: class DistributionServiceError extends Error {
    code: string;
    status: number;
    details?: Record<string, unknown>;

    constructor(code: string, message: string, status: number, details?: Record<string, unknown>) {
      super(message);
      this.code = code;
      this.status = status;
      this.details = details;
    }
  },
  finalizePreparedDistributionRun: routeMocks.finalizePreparedDistributionRun
}));

import { POST } from "@/app/api/admin/distributions/runs/[runId]/finalize/route";

describe("POST /api/admin/distributions/runs/:runId/finalize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin111"
    });
    routeMocks.finalizePreparedDistributionRun.mockResolvedValue({
      id: "run-1",
      status: "finalized"
    });
  });

  it("rejects non-admin access", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "user",
      pubkey: "User111"
    });

    const response = await POST(createRequest(), { params: Promise.resolve({ runId: "run-1" }) });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
  });

  it("finalizes with the provided checksum and admin actor", async () => {
    const response = await POST(createRequest(), { params: Promise.resolve({ runId: "run-1" }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(routeMocks.finalizePreparedDistributionRun).toHaveBeenCalledWith({
      runId: "run-1",
      outputChecksum: "sha256:ready",
      actorId: "Admin111"
    });
  });
});

function createRequest(): NextRequest {
  return new NextRequest("https://example.com/api/admin/distributions/runs/run-1/finalize", {
    method: "POST",
    body: JSON.stringify({
      outputChecksum: "sha256:ready"
    })
  });
}
