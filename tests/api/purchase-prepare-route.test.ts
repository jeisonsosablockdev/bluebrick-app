import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  preparePurchase: vi.fn(),
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
  preparePurchase: routeMocks.preparePurchase
}));

import { POST } from "@/app/api/purchase/prepare/route";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/purchase/prepare", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/purchase/prepare", () => {
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

    const response = await POST(createRequest({ propertyId: "central-norte" }));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
    expect(routeMocks.preparePurchase).not.toHaveBeenCalled();
  });

  it("returns 400 when payload is invalid", async () => {
    const response = await POST(createRequest({}));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("TRANSACTION_FAILED");
    expect(routeMocks.preparePurchase).not.toHaveBeenCalled();
  });

  it("returns prepared purchase payload when successful", async () => {
    routeMocks.preparePurchase.mockResolvedValueOnce({
      attemptId: "attempt-1",
      idempotencyKey: "0195af5f-95d7-7f28-8fd7-8ad4bc8f6af3",
      propertyId: "central-norte",
      network: "devnet",
      candyMachineAddress: "7N8dP2mAKtXh3VxH2QtYK8moJeb6Y6uYj6LxF7XnV9tC",
      collectionAddress: "CN8fDPDrZf82D9QHcVNt6nBx1hmg8nAZhCtSgPxKrj7",
      priceLamports: 10_000,
      cacheUpdatedAt: "2026-03-20T00:00:00.000Z",
      preparedAt: "2026-03-20T00:00:01.000Z",
      transactionBase64: "AQ==",
      expectedAssetAddress: "ASSET11111111111111111111111111111111111111"
    });

    const response = await POST(
      createRequest({
        propertyId: "central-norte",
        quantity: 1,
        quotedPriceLamports: 10_000,
        challengeId: "challenge-1",
        challengeSignatureBase64: "c2lnbmF0dXJl"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.attemptId).toBe("attempt-1");
    expect(payload.data.idempotencyKey).toBe("0195af5f-95d7-7f28-8fd7-8ad4bc8f6af3");
    expect(routeMocks.preparePurchase).toHaveBeenCalledWith({
      propertyId: "central-norte",
      buyerPublicKey: "UserWallet111111111111111111111111111111111111",
      quantity: 1,
      quotedPriceLamports: 10_000,
      challengeId: "challenge-1",
      challengeSignatureBase64: "c2lnbmF0dXJl",
      clientIp: "unknown"
    });
  });

  it("returns 400 when quantity is invalid", async () => {
    const response = await POST(
      createRequest({
        propertyId: "central-norte",
        quantity: 0,
        quotedPriceLamports: 10_000,
        challengeId: "challenge-1",
        challengeSignatureBase64: "c2lnbmF0dXJl"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_QUANTITY");
    expect(routeMocks.preparePurchase).not.toHaveBeenCalled();
  });

  it("returns business error code when service throws PurchaseFlowError", async () => {
    routeMocks.preparePurchase.mockRejectedValueOnce(
      new routeMocks.MockPurchaseFlowError("INVALID_QUANTITY", "Quantity too large.", 409, {
        suggestedMaxQuantity: 4
      })
    );

    const response = await POST(
      createRequest({
        propertyId: "central-norte",
        quotedPriceLamports: 9_000,
        challengeId: "challenge-2",
        challengeSignatureBase64: "c2lnbmF0dXJl"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("INVALID_QUANTITY");
    expect(payload.error.details?.suggestedMaxQuantity).toBe(4);
  });
});
