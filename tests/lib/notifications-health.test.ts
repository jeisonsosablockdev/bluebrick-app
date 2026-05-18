import { beforeEach, describe, expect, it, vi } from "vitest";

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
import { getNotificationHealthSnapshot } from "@/lib/notifications/health";
import {
  __resetWebPushSubscriptionRepositoryStateForTests,
  upsertWebPushSubscription
} from "@/lib/notifications/web-push-subscriptions-repository";

describe("lib/notifications/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DATABASE_URL;
    process.env.ENABLE_ADMIN_PUSH_CAMPAIGNS = "true";
    delete process.env.ENABLE_WEB_PUSH_SUBSCRIPTIONS;
    delete process.env.ENABLE_WEB_PUSH_DELIVERY;
    __resetWebPushDeliveryJobsStateForTests();
    __resetWebPushSubscriptionRepositoryStateForTests();
  });

  it("aggregates in-memory subscription and delivery health", async () => {
    await upsertWebPushSubscription({
      accountId: "account_123",
      walletPublicKey: "Wallet111",
      endpoint: "https://push.example.com/subscriptions/live",
      p256dh: "p256dh_live",
      authSecret: "auth_live",
      userAgent: "Vitest",
      platformFamily: "ios",
      appMode: "standalone",
      consentSource: "protected_profile"
    });

    sendMocks.sendWebPushEnvelope.mockResolvedValueOnce({
      outcome: "delivered",
      httpStatus: 201,
      errorCode: null,
      errorMessage: null
    });

    const created = await createOrGetTransactionalWebPushJob({
      dedupeKey: "health:wallet111:evt_1",
      notificationType: "onboarding_reward_earned",
      walletPublicKey: "Wallet111",
      title: "Reward",
      body: "Disponible",
      destinationUrl: "/protected",
      createdByType: "system",
      createdById: "notifications_worker"
    });
    await processTransactionalWebPushJobBatch(created.job.id);

    const snapshot = await getNotificationHealthSnapshot();

    expect(snapshot.subscriptions.total).toBe(1);
    expect(snapshot.subscriptions.active).toBe(1);
    expect(snapshot.subscriptions.byPlatform.ios).toBe(1);
    expect(snapshot.deliveries.delivered).toBe(1);
    expect(snapshot.rollout.deliveryEnabled).toBe(true);
  });
});
