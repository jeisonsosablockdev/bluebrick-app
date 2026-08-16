import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMocks = vi.hoisted(() => ({
  sendWebPushEnvelope: vi.fn()
}));

vi.mock("@/lib/notifications/web-push-delivery", () => ({
  sendWebPushEnvelope: sendMocks.sendWebPushEnvelope
}));

import {
  __resetWebPushDeliveryJobsStateForTests,
  createOrGetTransactionalWebPushJob,
  processTransactionalWebPushJobBatch
} from "@/lib/notifications/delivery-jobs";
import {
  __resetWebPushSubscriptionRepositoryStateForTests,
  listActiveWebPushSubscriptionsByWallet,
  upsertWebPushSubscription
} from "@/lib/notifications/web-push-subscriptions-repository";

function clearEnv(): void {
  delete process.env.DATABASE_URL;
}

describe("lib/notifications/delivery-jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearEnv();
    __resetWebPushDeliveryJobsStateForTests();
    __resetWebPushSubscriptionRepositoryStateForTests();
  });

  afterEach(() => {
    clearEnv();
    __resetWebPushDeliveryJobsStateForTests();
    __resetWebPushSubscriptionRepositoryStateForTests();
  });

  it("dedupes repeated transactional enqueue requests by dedupe key", async () => {
    const first = await createOrGetTransactionalWebPushJob({
      dedupeKey: "reward:wallet111:evt_1",
      notificationType: "onboarding_reward_earned",
      walletPublicKey: "Wallet111",
      title: "Reward disponible",
      body: "Ya puedes usarlo.",
      destinationUrl: "/protected",
      metadata: {
        eventId: "evt_1"
      },
      createdByType: "system",
      createdById: "notifications_worker"
    });

    const second = await createOrGetTransactionalWebPushJob({
      dedupeKey: "reward:wallet111:evt_1",
      notificationType: "onboarding_reward_earned",
      walletPublicKey: "Wallet111",
      title: "Reward disponible",
      body: "Ya puedes usarlo.",
      destinationUrl: "/protected",
      metadata: {
        eventId: "evt_1"
      },
      createdByType: "system",
      createdById: "notifications_worker"
    });

    expect(first.inserted).toBe(true);
    expect(second.inserted).toBe(false);
    expect(second.job.id).toBe(first.job.id);
  });

  it("processes a batch and prunes gone endpoints while preserving healthy ones", async () => {
    await upsertWebPushSubscription({
      accountId: "account_123",
      walletPublicKey: "Wallet111",
      endpoint: "https://push.example.com/subscriptions/live",
      p256dh: "p256dh_live",
      authSecret: "auth_live",
      userAgent: "Vitest",
      platformFamily: "desktop",
      appMode: "browser",
      consentSource: "protected_profile"
    });

    await upsertWebPushSubscription({
      accountId: "account_123",
      walletPublicKey: "Wallet111",
      endpoint: "https://push.example.com/subscriptions/gone",
      p256dh: "p256dh_gone",
      authSecret: "auth_gone",
      userAgent: "Vitest",
      platformFamily: "ios",
      appMode: "standalone",
      consentSource: "protected_profile"
    });

    sendMocks.sendWebPushEnvelope.mockImplementation(async (subscription: { endpoint: string }) => {
      if (subscription?.endpoint?.includes("gone")) {
        return {
          outcome: "pruned",
          httpStatus: 410,
          errorCode: "HTTP_410",
          errorMessage: "Gone"
        };
      }
      return {
        outcome: "delivered",
        httpStatus: 201,
        errorCode: null,
        errorMessage: null
      };
    });

    const created = await createOrGetTransactionalWebPushJob({
      dedupeKey: "kyc:wallet111:evt_2",
      notificationType: "kyc_status_changed",
      walletPublicKey: "Wallet111",
      title: "KYC aprobada",
      body: "Tu verificacion fue aprobada.",
      destinationUrl: "/protected/perfil",
      createdByType: "system",
      createdById: "notifications_worker"
    });

    const result = await processTransactionalWebPushJobBatch(created.job.id);

    expect(result.processedInBatch).toBe(2);
    expect(result.deliveredInBatch).toBe(1);
    expect(result.prunedInBatch).toBe(1);
    expect(result.failedInBatch).toBe(0);
    expect(result.needsRequeue).toBe(false);
    expect(result.job.status).toBe("completed_with_failures");

    const remaining = await listActiveWebPushSubscriptionsByWallet("Wallet111");
    expect(remaining).toHaveLength(1);
    expect(remaining[0].endpoint).toBe("https://push.example.com/subscriptions/live");
  });

  it("marks retryable provider errors as failing without deleting the subscription", async () => {
    const subscription = await upsertWebPushSubscription({
      accountId: "account_123",
      walletPublicKey: "WalletRetry",
      endpoint: "https://push.example.com/subscriptions/retry",
      p256dh: "p256dh_retry",
      authSecret: "auth_retry",
      userAgent: "Vitest",
      platformFamily: "android",
      appMode: "browser",
      consentSource: "protected_profile"
    });

    sendMocks.sendWebPushEnvelope.mockResolvedValueOnce({
      outcome: "failed",
      httpStatus: 503,
      errorCode: "HTTP_503",
      errorMessage: "Provider unavailable"
    });

    const created = await createOrGetTransactionalWebPushJob({
      dedupeKey: "checkout:walletretry:evt_3",
      notificationType: "checkout_status_changed",
      walletPublicKey: "WalletRetry",
      title: "Checkout actualizado",
      body: "Tuvimos un retraso al enviarte el push.",
      destinationUrl: "/protected/checkout",
      createdByType: "system",
      createdById: "notifications_worker"
    });

    const result = await processTransactionalWebPushJobBatch(created.job.id);

    expect(result.failedInBatch).toBe(1);
    expect(result.job.status).toBe("completed_with_failures");

    const remaining = await listActiveWebPushSubscriptionsByWallet("WalletRetry");
    expect(remaining).toHaveLength(0);

    const ownerView = await listActiveWebPushSubscriptionsByWallet(subscription.walletPublicKey);
    expect(ownerView).toHaveLength(0);
  });
});
