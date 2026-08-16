import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  runWalletAmlScreening: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/features/profile/application/aml-screening-service", () => ({
  runWalletAmlScreening: routeMocks.runWalletAmlScreening
}));

import { POST } from "@/app/api/internal/compliance/aml/screen/route";

function createRequest(body: Record<string, unknown>, headers?: Record<string, string>): NextRequest {
  return new NextRequest("https://example.com/api/internal/compliance/aml/screen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {})
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/internal/compliance/aml/screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.COMPLIANCE_INTERNAL_TOKEN = "internal-token";
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin1111111111111111111111111111111111111"
    });
    routeMocks.runWalletAmlScreening.mockResolvedValue({
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      amlStatus: "clear",
      providerClassification: "clear",
      amlRiskScore: 12,
      flags: [],
      provider: "helius",
      ruleVersion: "helius-v1",
      checkedAt: "2026-03-25T00:00:00.000Z"
    });
  });

  it("returns 403 when caller is not authorized", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "user",
      pubkey: "User11111111111111111111111111111111111111"
    });

    const response = await POST(createRequest({ walletPublicKey: "Wallet11111111111111111111111111111111111" }));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
  });

  it("accepts internal token authorization and runs AML screening", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: false
    });

    const response = await POST(
      createRequest(
        { walletPublicKey: "Wallet11111111111111111111111111111111111", reason: "manual_recheck" },
        { authorization: "Bearer internal-token" }
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(routeMocks.runWalletAmlScreening).toHaveBeenCalledWith({
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      trigger: "manual_recheck",
      actorType: "system",
      actorId: "internal_token"
    });
  });
});
