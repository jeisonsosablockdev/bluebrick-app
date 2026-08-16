import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  processPurchaseHeliusWebhookPayload: vi.fn()
}));

vi.mock("@/features/checkout-payment/application/purchase-webhook-reconciliation", () => ({
  processPurchaseHeliusWebhookPayload: routeMocks.processPurchaseHeliusWebhookPayload
}));

import { POST } from "@/app/api/webhooks/helius/purchase/route";

function createRequest(body: unknown, authHeader?: string): NextRequest {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (typeof authHeader === "string") {
    headers.authorization = authHeader;
  }

  return new NextRequest("https://example.com/api/webhooks/helius/purchase", {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
}

describe("POST /api/webhooks/helius/purchase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.HELIUS_WEBHOOK_SECRET = "secret-123";
    routeMocks.processPurchaseHeliusWebhookPayload.mockResolvedValue({
      received: 1,
      processed: 1,
      duplicates: 0,
      reconciled: 1
    });
  });

  it("returns 401 when secret does not match", async () => {
    const response = await POST(createRequest([], "wrong-secret"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
    expect(routeMocks.processPurchaseHeliusWebhookPayload).not.toHaveBeenCalled();
  });

  it("returns 400 when payload is not an array", async () => {
    const response = await POST(createRequest({ signature: "sig-1" }, "secret-123"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_PAYLOAD");
    expect(routeMocks.processPurchaseHeliusWebhookPayload).not.toHaveBeenCalled();
  });

  it("returns 200 and reconciliation stats when payload is valid", async () => {
    const response = await POST(
      createRequest(
        [
          {
            signature: "sig-1",
            slot: 100,
            type: "NFT_SALE",
            transactionError: null
          }
        ],
        "secret-123"
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.reconciled).toBe(1);
    expect(routeMocks.processPurchaseHeliusWebhookPayload).toHaveBeenCalledTimes(1);
  });
});
