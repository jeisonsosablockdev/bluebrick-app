import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  createDistributionRunDraft: vi.fn(),
  listDistributionRunsForAdmin: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/features/staking-distribution/application/distribution-service", () => ({
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
  createDistributionRunDraft: routeMocks.createDistributionRunDraft,
  listDistributionRunsForAdmin: routeMocks.listDistributionRunsForAdmin
}));

import { GET, POST } from "@/app/api/admin/distributions/runs/route";

describe("GET/POST /api/admin/distributions/runs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin111"
    });
    routeMocks.listDistributionRunsForAdmin.mockResolvedValue([]);
    routeMocks.createDistributionRunDraft.mockResolvedValue({
      status: "ready",
      run: { id: "run-1" },
      calculation: { outputChecksum: "sha256:ready" }
    });
  });

  it("rejects non-admin access", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "user",
      pubkey: "User111"
    });

    const response = await GET(new NextRequest("https://example.com/api/admin/distributions/runs"));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
  });

  it("lists distribution runs for admins", async () => {
    routeMocks.listDistributionRunsForAdmin.mockResolvedValueOnce([{ id: "run-1", status: "draft" }]);

    const response = await GET(new NextRequest("https://example.com/api/admin/distributions/runs"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data).toEqual([{ id: "run-1", status: "draft" }]);
  });

  it("creates a draft using the admin actor from the session", async () => {
    const response = await POST(new NextRequest("https://example.com/api/admin/distributions/runs", {
      method: "POST",
      body: JSON.stringify({
        periodKey: "2026-05",
        collectionAddress: "Collection111",
        propertyId: "property-1",
        periodStartAt: "2026-05-01T05:00:00.000Z",
        periodEndAt: "2026-06-01T05:00:00.000Z",
        policyVersion: "v1",
        tokenMint: "USDC111",
        totalAmountMinor: "1000"
      })
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(routeMocks.createDistributionRunDraft).toHaveBeenCalledWith(expect.objectContaining({
      actorId: "Admin111",
      totalAmountMinor: "1000"
    }));
  });
});
