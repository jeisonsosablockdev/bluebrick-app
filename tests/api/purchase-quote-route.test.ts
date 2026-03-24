import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  quotePurchaseForProperty: vi.fn(),
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

vi.mock("@/lib/purchase-service", () => {
  return {
    PurchaseFlowError: routeMocks.MockPurchaseFlowError,
    quotePurchaseForProperty: routeMocks.quotePurchaseForProperty
  };
});

import { POST } from "@/app/api/purchase/quote/route";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/purchase/quote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/purchase/quote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when propertyId is missing", async () => {
    const response = await POST(createRequest({}));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("TRANSACTION_FAILED");
    expect(routeMocks.quotePurchaseForProperty).not.toHaveBeenCalled();
  });

  it("returns quote payload when successful", async () => {
    routeMocks.quotePurchaseForProperty.mockResolvedValueOnce({
      propertyId: "central-norte",
      candyMachineAddress: "7N8dP2mAKtXh3VxH2QtYK8moJeb6Y6uYj6LxF7XnV9tC",
      collectionAddress: "CN8fDPDrZf82D9QHcVNt6nBx1hmg8nAZhCtSgPxKrj7",
      cacheUpdatedAt: "2026-03-20T00:00:00.000Z",
      priceLamports: 10_000,
      startDateIso: null,
      itemsRemaining: 2800,
      itemsAvailable: 10_000,
      itemsRedeemed: 7200
    });

    const response = await POST(createRequest({ propertyId: "central-norte", quantity: 1 }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.propertyId).toBe("central-norte");
    expect(routeMocks.quotePurchaseForProperty).toHaveBeenCalledWith("central-norte", 1);
  });

  it("returns 400 when quantity is invalid", async () => {
    const response = await POST(createRequest({ propertyId: "central-norte", quantity: 0 }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_QUANTITY");
    expect(routeMocks.quotePurchaseForProperty).not.toHaveBeenCalled();
  });

  it("defaults quantity to 1 when omitted", async () => {
    routeMocks.quotePurchaseForProperty.mockResolvedValueOnce({
      propertyId: "central-norte",
      candyMachineAddress: "7N8dP2mAKtXh3VxH2QtYK8moJeb6Y6uYj6LxF7XnV9tC",
      collectionAddress: "CN8fDPDrZf82D9QHcVNt6nBx1hmg8nAZhCtSgPxKrj7",
      cacheUpdatedAt: "2026-03-20T00:00:00.000Z",
      priceLamports: 10_000,
      startDateIso: null,
      itemsRemaining: 2800,
      itemsAvailable: 10_000,
      itemsRedeemed: 7200,
      quantityMode: "SINGLE_ONLY",
      quantity: 1,
      totalPriceLamports: 10_000
    });

    const response = await POST(createRequest({ propertyId: "central-norte" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(routeMocks.quotePurchaseForProperty).toHaveBeenCalledWith("central-norte", 1);
  });

  it("returns business error payload when service throws PurchaseFlowError", async () => {
    routeMocks.quotePurchaseForProperty.mockRejectedValueOnce(
      new routeMocks.MockPurchaseFlowError("SOLD_OUT", "Sold out", 409)
    );

    const response = await POST(createRequest({ propertyId: "central-norte" }));
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("SOLD_OUT");
  });
});
