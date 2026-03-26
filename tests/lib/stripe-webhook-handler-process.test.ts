import crypto from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

const handlerMocks = vi.hoisted(() => ({
  findWalletByKycProviderSessionId: vi.fn(),
  recordComplianceAuditEvent: vi.fn(),
  registerKycWebhookEvent: vi.fn(),
  updateKycStatusFromProvider: vi.fn(),
  runWalletAmlScreening: vi.fn()
}));

vi.mock("@/lib/compliance/profile-repository", () => ({
  findWalletByKycProviderSessionId: handlerMocks.findWalletByKycProviderSessionId,
  recordComplianceAuditEvent: handlerMocks.recordComplianceAuditEvent,
  registerKycWebhookEvent: handlerMocks.registerKycWebhookEvent,
  updateKycStatusFromProvider: handlerMocks.updateKycStatusFromProvider
}));

vi.mock("@/lib/compliance/aml-screening-service", () => ({
  runWalletAmlScreening: handlerMocks.runWalletAmlScreening
}));

import { processStripeIdentityWebhook } from "@/lib/kyc/stripe-webhook-handler";

function sign(payload: string, timestamp: number, secret: string): string {
  const digest = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");
  return `t=${timestamp},v1=${digest}`;
}

describe("processStripeIdentityWebhook AML trigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    handlerMocks.findWalletByKycProviderSessionId.mockResolvedValue(null);
    handlerMocks.recordComplianceAuditEvent.mockResolvedValue(undefined);
    handlerMocks.registerKycWebhookEvent.mockResolvedValue(true);
    handlerMocks.updateKycStatusFromProvider.mockResolvedValue(undefined);
    handlerMocks.runWalletAmlScreening.mockResolvedValue(undefined);
  });

  it("runs AML screening when Stripe event verifies KYC", async () => {
    const secret = "whsec_test_secret";
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({
      id: "evt_verified_1",
      type: "identity.verification_session.verified",
      data: {
        object: {
          id: "vs_verified_1",
          metadata: {
            wallet_public_key: "Wallet11111111111111111111111111111111111"
          },
          last_verification_report: "vr_123"
        }
      }
    });

    const result = await processStripeIdentityWebhook({
      rawBody: payload,
      signatureHeader: sign(payload, timestamp, secret),
      webhookSecret: secret
    });

    expect(result.processed).toBe(true);
    expect(handlerMocks.runWalletAmlScreening).toHaveBeenCalledWith({
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      trigger: "kyc_verified_webhook",
      actorType: "provider",
      actorId: "stripe_identity"
    });
  });

  it("does not run AML screening for pending event", async () => {
    const secret = "whsec_test_secret";
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({
      id: "evt_processing_1",
      type: "identity.verification_session.processing",
      data: {
        object: {
          id: "vs_processing_1",
          metadata: {
            wallet_public_key: "Wallet11111111111111111111111111111111111"
          }
        }
      }
    });

    await processStripeIdentityWebhook({
      rawBody: payload,
      signatureHeader: sign(payload, timestamp, secret),
      webhookSecret: secret
    });

    expect(handlerMocks.runWalletAmlScreening).not.toHaveBeenCalled();
  });
});
