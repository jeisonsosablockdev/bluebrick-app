import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  getAmlCaseSnapshotForAdmin: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/compliance/profile-repository", () => ({
  getAmlCaseSnapshotForAdmin: routeMocks.getAmlCaseSnapshotForAdmin
}));

import { GET } from "@/app/api/admin/compliance/cases/[walletPublicKey]/aml/route";

function createRequest(): NextRequest {
  return new NextRequest("https://example.com/api/admin/compliance/cases/Wallet11111111111111111111111111111111111/aml", {
    method: "GET"
  });
}

describe("GET /api/admin/compliance/cases/:walletPublicKey/aml", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin1111111111111111111111111111111111111"
    });
    routeMocks.getAmlCaseSnapshotForAdmin.mockResolvedValue({
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      amlStatus: "pending",
      amlRiskScore: 52,
      amlFlags: [{ code: "mixer_exposure", severity: "medium" }],
      amlProvider: "helius",
      amlRuleVersion: "helius-v1",
      amlLastCheckedAt: "2026-03-25T00:00:00.000Z",
      complianceStatus: "pending_review"
    });
  });

  it("returns 403 for non-admin users", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "user",
      pubkey: "User11111111111111111111111111111111111111"
    });

    const response = await GET(createRequest(), {
      params: Promise.resolve({ walletPublicKey: "Wallet11111111111111111111111111111111111" })
    });
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
  });

  it("returns AML case snapshot for admin", async () => {
    const response = await GET(createRequest(), {
      params: Promise.resolve({ walletPublicKey: "Wallet11111111111111111111111111111111111" })
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.amlStatus).toBe("pending");
    expect(routeMocks.getAmlCaseSnapshotForAdmin).toHaveBeenCalledWith("Wallet11111111111111111111111111111111111");
  });
});
