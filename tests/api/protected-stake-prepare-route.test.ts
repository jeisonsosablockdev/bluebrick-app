import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  prepareStakeAction: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/stake-service", () => ({
  StakeFlowError: class StakeFlowError extends Error {
    code: string;
    status: number;

    constructor(code: string, message: string, status: number) {
      super(message);
      this.code = code;
      this.status = status;
    }
  },
  prepareStakeAction: routeMocks.prepareStakeAction
}));

import { POST } from "@/app/api/protected/stake/prepare/route";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/protected/stake/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /api/protected/stake/prepare", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      pubkey: "Wallet11111111111111111111111111111111111"
    });
    routeMocks.prepareStakeAction.mockResolvedValue({
      attemptId: "attempt-1",
      idempotencyKey: "idem-1",
      transactionBase64: "AQ=="
    });
  });

  it("returns 401 without wallet auth", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({ authenticated: false });

    const response = await POST(createRequest({ assetAddress: "Asset111", action: "stake" }));
    expect(response.status).toBe(401);
  });

  it("returns 400 when action payload is invalid", async () => {
    const response = await POST(createRequest({ assetAddress: "", action: "bad" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_INPUT");
  });

  it("prepares the stake action for the authenticated wallet", async () => {
    const response = await POST(createRequest({ assetAddress: "Asset111", action: "stake" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(routeMocks.prepareStakeAction).toHaveBeenCalledWith({
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      assetAddress: "Asset111",
      action: "stake"
    });
  });
});

