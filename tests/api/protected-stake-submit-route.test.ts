import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  submitStakeAction: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/stake-service", () => ({
  StakeFlowError: class StakeFlowError extends Error {
    code: string;
    status: number;
    recoverable: boolean;

    constructor(code: string, message: string, status: number, options?: { recoverable?: boolean }) {
      super(message);
      this.code = code;
      this.status = status;
      this.recoverable = options?.recoverable ?? false;
    }
  },
  submitStakeAction: routeMocks.submitStakeAction
}));

import { POST } from "@/app/api/protected/stake/submit/route";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/protected/stake/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /api/protected/stake/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      pubkey: "Wallet11111111111111111111111111111111111"
    });
    routeMocks.submitStakeAction.mockResolvedValue({
      attemptId: "attempt-1",
      txSignature: "sig-1",
      submittedAt: "2026-05-27T12:00:00.000Z",
      status: "submitted"
    });
  });

  it("returns 401 without wallet auth", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({ authenticated: false });

    const response = await POST(createRequest({
      attemptId: "attempt-1",
      idempotencyKey: "idem-1",
      signedTransactionBase64: "AQ=="
    }));

    expect(response.status).toBe(401);
  });

  it("returns 400 when the submit payload is invalid", async () => {
    const response = await POST(createRequest({
      attemptId: "",
      idempotencyKey: "",
      signedTransactionBase64: ""
    }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_INPUT");
  });

  it("submits the signed stake action for the authenticated wallet", async () => {
    const response = await POST(createRequest({
      attemptId: "attempt-1",
      idempotencyKey: "idem-1",
      signedTransactionBase64: "AQ=="
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(routeMocks.submitStakeAction).toHaveBeenCalledWith({
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      attemptId: "attempt-1",
      idempotencyKey: "idem-1",
      signedTransactionBase64: "AQ=="
    });
  });

  it("returns recoverable blockhash expiration metadata", async () => {
    const { StakeFlowError } = await import("@/lib/stake-service");
    routeMocks.submitStakeAction.mockRejectedValueOnce(
      new StakeFlowError(
        "BLOCKHASH_EXPIRED",
        "Transaction blockhash expired before submission. Please try again and approve a fresh wallet signature.",
        409,
        { recoverable: true }
      )
    );

    const response = await POST(createRequest({
      attemptId: "attempt-1",
      idempotencyKey: "idem-1",
      signedTransactionBase64: "AQ=="
    }));
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toMatchObject({
      code: "BLOCKHASH_EXPIRED",
      message: "Transaction blockhash expired before submission. Please try again and approve a fresh wallet signature.",
      recoverable: true
    });
  });
});
