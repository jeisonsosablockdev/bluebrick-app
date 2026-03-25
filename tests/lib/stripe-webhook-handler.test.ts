import crypto from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  mapStripeIdentityEventType,
  verifyAndParseStripeIdentityEvent
} from "@/lib/kyc/stripe-webhook-handler";

function sign(payload: string, timestamp: number, secret: string): string {
  const signedPayload = `${timestamp}.${payload}`;
  const digest = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  return `t=${timestamp},v1=${digest}`;
}

describe("stripe-webhook-handler", () => {
  it("parses event when signature is valid", () => {
    const secret = "whsec_test_secret";
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({
      id: "evt_123",
      type: "identity.verification_session.verified",
      data: {
        object: {
          id: "vs_123",
          metadata: {
            wallet_public_key: "Wallet11111111111111111111111111111111111"
          }
        }
      }
    });

    const event = verifyAndParseStripeIdentityEvent({
      rawBody: payload,
      signatureHeader: sign(payload, timestamp, secret),
      webhookSecret: secret
    });

    expect(event.id).toBe("evt_123");
    expect(event.type).toBe("identity.verification_session.verified");
  });

  it("throws when signature is invalid", () => {
    const payload = JSON.stringify({
      id: "evt_123",
      type: "identity.verification_session.verified",
      data: { object: { id: "vs_123" } }
    });

    expect(() =>
      verifyAndParseStripeIdentityEvent({
        rawBody: payload,
        signatureHeader: "t=1,v1=invalid",
        webhookSecret: "whsec_test_secret"
      })
    ).toThrow("Invalid Stripe webhook signature.");
  });

  it("maps Stripe event types to KYC statuses", () => {
    expect(mapStripeIdentityEventType("identity.verification_session.processing")).toBe("pending");
    expect(mapStripeIdentityEventType("identity.verification_session.verified")).toBe("verified");
    expect(mapStripeIdentityEventType("identity.verification_session.requires_input")).toBe("rejected");
    expect(mapStripeIdentityEventType("identity.verification_session.canceled")).toBe("rejected");
    expect(mapStripeIdentityEventType("identity.verification_report.created")).toBeNull();
  });
});
