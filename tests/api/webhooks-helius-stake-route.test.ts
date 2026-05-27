import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  processStakeHeliusWebhookPayload: vi.fn()
}));

vi.mock("@/lib/stake-webhook-reconciliation", () => ({
  processStakeHeliusWebhookPayload: routeMocks.processStakeHeliusWebhookPayload
}));

import { POST } from "@/app/api/webhooks/helius/stake/route";

function createRequest(body: unknown, authHeader?: string): NextRequest {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (authHeader) {
    headers.authorization = authHeader;
  }

  return new NextRequest("https://example.com/api/webhooks/helius/stake", {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
}

describe("POST /api/webhooks/helius/stake", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.HELIUS_WEBHOOK_SECRET = "secret-123";
    routeMocks.processStakeHeliusWebhookPayload.mockResolvedValue({
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
  });

  it("returns 400 when payload is not an array", async () => {
    const response = await POST(createRequest({ signature: "sig-1" }, "secret-123"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_PAYLOAD");
  });

  it("returns processing stats for a valid payload", async () => {
    const response = await POST(createRequest([
      {
        signature: "sig-1",
        slot: 100,
        type: "UNKNOWN",
        transactionError: null
      }
    ], "secret-123"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.reconciled).toBe(1);
  });
});

