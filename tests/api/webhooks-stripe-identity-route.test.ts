import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  processStripeIdentityWebhook: vi.fn(),
  InvalidStripeWebhookSignatureError: class InvalidStripeWebhookSignatureError extends Error {}
}));

vi.mock("@/lib/kyc/stripe-webhook-handler", () => ({
  processStripeIdentityWebhook: routeMocks.processStripeIdentityWebhook,
  InvalidStripeWebhookSignatureError: routeMocks.InvalidStripeWebhookSignatureError
}));

import { POST } from "@/app/api/webhooks/stripe/identity/route";

function createRequest(body: Record<string, unknown>, signature = "t=1,v1=test"): NextRequest {
  return new NextRequest("https://example.com/api/webhooks/stripe/identity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": signature
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/webhooks/stripe/identity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_IDENTITY_WEBHOOK_SECRET = "whsec_test_secret";
    routeMocks.processStripeIdentityWebhook.mockResolvedValue({
      duplicate: false,
      processed: true,
      eventId: "evt_123",
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      kycStatus: "verified"
    });
  });

  it("returns 500 when webhook secret is not configured", async () => {
    delete process.env.STRIPE_IDENTITY_WEBHOOK_SECRET;

    const response = await POST(createRequest({ id: "evt_1", type: "identity.verification_session.verified", data: { object: { id: "vs_1" } } }));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error.code).toBe("WEBHOOK_MISCONFIGURED");
  });

  it("returns 401 when signature is invalid", async () => {
    routeMocks.processStripeIdentityWebhook.mockRejectedValueOnce(
      new routeMocks.InvalidStripeWebhookSignatureError("Invalid Stripe webhook signature.")
    );

    const response = await POST(createRequest({ id: "evt_1", type: "identity.verification_session.verified", data: { object: { id: "vs_1" } } }));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("INVALID_SIGNATURE");
  });

  it("returns 200 with processing summary", async () => {
    const response = await POST(createRequest({ id: "evt_1", type: "identity.verification_session.verified", data: { object: { id: "vs_1" } } }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.eventId).toBe("evt_123");
    expect(routeMocks.processStripeIdentityWebhook).toHaveBeenCalledTimes(1);
  });
});
