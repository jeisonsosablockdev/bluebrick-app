import crypto from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

const handlerMocks = vi.hoisted(() => ({
  findWalletByKycProviderSessionId: vi.fn(),
  recordComplianceAuditEvent: vi.fn(),
  registerKycWebhookEvent: vi.fn(),
  updateKycStatusFromProvider: vi.fn(),
  getOnboardingRewardForWallet: vi.fn(),
  runWalletAmlScreening: vi.fn(),
  markReferralAttributionKycApproved: vi.fn(),
  promotePendingQualificationRewardsForInvitee: vi.fn()
}));

vi.mock("@/features/profile/infrastructure/profile-repository", () => ({
  findWalletByKycProviderSessionId: handlerMocks.findWalletByKycProviderSessionId,
  recordComplianceAuditEvent: handlerMocks.recordComplianceAuditEvent,
  registerKycWebhookEvent: handlerMocks.registerKycWebhookEvent,
  updateKycStatusFromProvider: handlerMocks.updateKycStatusFromProvider
}));

vi.mock("@/features/profile/application/aml-screening-service", () => ({
  runWalletAmlScreening: handlerMocks.runWalletAmlScreening
}));

vi.mock("@/lib/onboarding-reward-service", () => ({
  getOnboardingRewardForWallet: handlerMocks.getOnboardingRewardForWallet
}));

vi.mock("@/features/referral-marketing/infrastructure/referrals-repository", () => ({
  markReferralAttributionKycApproved: handlerMocks.markReferralAttributionKycApproved
}));

vi.mock("@/features/referral-marketing/application/reward-engine", () => ({
  promotePendingQualificationRewardsForInvitee: handlerMocks.promotePendingQualificationRewardsForInvitee
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
    handlerMocks.getOnboardingRewardForWallet.mockResolvedValue({ id: "reward-1" });
    handlerMocks.runWalletAmlScreening.mockResolvedValue(undefined);
    handlerMocks.markReferralAttributionKycApproved.mockResolvedValue(undefined);
    handlerMocks.promotePendingQualificationRewardsForInvitee.mockResolvedValue([]);
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
    expect(handlerMocks.markReferralAttributionKycApproved).toHaveBeenCalledWith({
      inviteeWalletPublicKey: "Wallet11111111111111111111111111111111111"
    });
    expect(handlerMocks.getOnboardingRewardForWallet).toHaveBeenCalledWith("Wallet11111111111111111111111111111111111");
    expect(handlerMocks.promotePendingQualificationRewardsForInvitee).toHaveBeenCalledWith({
      inviteeWalletPublicKey: "Wallet11111111111111111111111111111111111"
    });
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

    expect(handlerMocks.markReferralAttributionKycApproved).not.toHaveBeenCalled();
    expect(handlerMocks.promotePendingQualificationRewardsForInvitee).not.toHaveBeenCalled();
    expect(handlerMocks.runWalletAmlScreening).not.toHaveBeenCalled();
    expect(handlerMocks.getOnboardingRewardForWallet).toHaveBeenCalledWith("Wallet11111111111111111111111111111111111");
  });
});
