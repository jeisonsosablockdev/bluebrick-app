import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  submitPurchase: vi.fn(),
  MockPurchaseFlowError: class MockPurchaseFlowError extends Error {
    code: string;
    status: number;
    details?: Record<string, unknown>;

    constructor(code: string, message: string, status: number, details?: Record<string, unknown>) {
      super(message);
      this.code = code;
      this.status = status;
      this.details = details;
    }
  }
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/purchase-service", () => ({
  PurchaseFlowError: routeMocks.MockPurchaseFlowError,
  submitPurchase: routeMocks.submitPurchase
}));

import { POST } from "@/app/api/purchase/submit/route";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/purchase/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/purchase/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "user",
      pubkey: "UserWallet111111111111111111111111111111111111"
    });
  });

  it("returns 401 when caller is not authenticated", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({ authenticated: false });

    const response = await POST(
      createRequest({
        attemptId: "attempt-1",
        idempotencyKey: "0195af5f-95d7-7f28-8fd7-8ad4bc8f6af3",
        signedTransactionBase64: "AQ=="
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
    expect(routeMocks.submitPurchase).not.toHaveBeenCalled();
  });

  it("returns 400 when payload is invalid", async () => {
    const response = await POST(createRequest({}));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("TRANSACTION_FAILED");
    expect(routeMocks.submitPurchase).not.toHaveBeenCalled();
  });

  it("returns 400 when idempotencyKey is missing", async () => {
    const response = await POST(
      createRequest({
        attemptId: "attempt-1",
        signedTransactionBase64: "AQ=="
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("TRANSACTION_FAILED");
    expect(routeMocks.submitPurchase).not.toHaveBeenCalled();
  });

  it("returns submitted purchase payload when successful", async () => {
    routeMocks.submitPurchase.mockResolvedValueOnce({
      attemptId: "attempt-1",
      status: "submitted",
      txSignature: "5Hs2Y7....",
      submittedAt: "2026-03-20T00:00:02.000Z"
    });

    const response = await POST(
      createRequest({
        attemptId: "attempt-1",
        idempotencyKey: "0195af5f-95d7-7f28-8fd7-8ad4bc8f6af3",
        signedTransactionBase64: "AQ=="
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.status).toBe("submitted");
    expect(routeMocks.submitPurchase).toHaveBeenCalledWith({
      attemptId: "attempt-1",
      idempotencyKey: "0195af5f-95d7-7f28-8fd7-8ad4bc8f6af3",
      buyerPublicKey: "UserWallet111111111111111111111111111111111111",
      signedTransactionBase64: "AQ=="
    });
  });

  it("returns business error code when service throws PurchaseFlowError", async () => {
    routeMocks.submitPurchase.mockRejectedValueOnce(
      new routeMocks.MockPurchaseFlowError("INSUFFICIENT_FUNDS", "Not enough SOL.", 409)
    );

    const response = await POST(
      createRequest({
        attemptId: "attempt-1",
        idempotencyKey: "0195af5f-95d7-7f28-8fd7-8ad4bc8f6af3",
        signedTransactionBase64: "AQ=="
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("INSUFFICIENT_FUNDS");
  });
});
