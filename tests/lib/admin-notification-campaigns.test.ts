import { beforeEach, describe, expect, it, vi } from "vitest";

const deliveryJobMocks = vi.hoisted(() => ({
  createOrGetTransactionalWebPushJob: vi.fn(),
  enqueueTransactionalWebPushJob: vi.fn(),
  hasNotificationQueueConfig: vi.fn(),
  processTransactionalWebPushJobBatch: vi.fn()
}));

vi.mock("@/lib/notifications/delivery-jobs", () => ({
  createOrGetTransactionalWebPushJob: deliveryJobMocks.createOrGetTransactionalWebPushJob,
  enqueueTransactionalWebPushJob: deliveryJobMocks.enqueueTransactionalWebPushJob,
  hasNotificationQueueConfig: deliveryJobMocks.hasNotificationQueueConfig,
  processTransactionalWebPushJobBatch: deliveryJobMocks.processTransactionalWebPushJobBatch
}));

import {
  __resetAdminNotificationCampaignStateForTests,
  __seedAdminNotificationAudienceForTests,
  createAdminNotificationCampaign,
  previewAdminNotificationCampaign
} from "@/lib/notifications/admin-campaigns";

describe("lib/notifications/admin-campaigns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DATABASE_URL;
    process.env.ENABLE_ADMIN_PUSH_CAMPAIGNS = "true";
    process.env.ADMIN_PUSH_CAMPAIGN_AUDIENCE_CAP = "2";
    process.env.ADMIN_PUSH_CAMPAIGN_RATE_LIMIT_MAX = "5";
    __resetAdminNotificationCampaignStateForTests();
    __seedAdminNotificationAudienceForTests([
      {
        walletPublicKey: "Wallet111",
        country: "CO",
        subscriptions: [{ platformFamily: "ios", appMode: "standalone" }]
      },
      {
        walletPublicKey: "Wallet222",
        country: "CO",
        subscriptions: [{ platformFamily: "android", appMode: "browser" }]
      },
      {
        walletPublicKey: "Wallet333",
        country: "MX",
        subscriptions: []
      }
    ]);
    deliveryJobMocks.createOrGetTransactionalWebPushJob.mockResolvedValue({
      inserted: true,
      job: { id: "job_123" }
    });
    deliveryJobMocks.enqueueTransactionalWebPushJob.mockResolvedValue(undefined);
    deliveryJobMocks.hasNotificationQueueConfig.mockReturnValue(true);
    deliveryJobMocks.processTransactionalWebPushJobBatch.mockResolvedValue({
      needsRequeue: false
    });
  });

  it("previews a conservative country-scoped audience with exclusions", async () => {
    const preview = await previewAdminNotificationCampaign({
      actorPubkey: "AdminPubkey111",
      messageClass: "product_update",
      title: "Nueva experiencia",
      body: "Hay cambios en BRIDS.",
      destinationUrl: "/protected",
      segment: {
        country: "CO"
      }
    });

    expect(preview.eligibleWalletCount).toBe(2);
    expect(preview.excludedWalletCount).toBe(0);
    expect(preview.blockedReasons).toEqual([]);
    expect(preview.sampleWallets).toHaveLength(2);
  });

  it("blocks oversized audiences at preview time", async () => {
    process.env.ADMIN_PUSH_CAMPAIGN_AUDIENCE_CAP = "1";

    const preview = await previewAdminNotificationCampaign({
      actorPubkey: "AdminPubkey111",
      messageClass: "product_update",
      title: "Nueva experiencia",
      body: "Hay cambios en BRIDS.",
      destinationUrl: "/protected",
      segment: {
        country: "CO"
      }
    });

    expect(preview.blockedReasons).toContain("audience_cap_exceeded");
  });

  it("requires a fresh preview hash before queuing the campaign", async () => {
    const preview = await previewAdminNotificationCampaign({
      actorPubkey: "AdminPubkey111",
      messageClass: "ops_notice",
      title: "Mantenimiento",
      body: "Habra una ventana operativa.",
      destinationUrl: "/protected",
      segment: {
        country: "CO"
      }
    });

    const result = await createAdminNotificationCampaign({
      actorPubkey: "AdminPubkey111",
      messageClass: "ops_notice",
      title: "Mantenimiento",
      body: "Habra una ventana operativa.",
      destinationUrl: "/protected",
      previewHash: preview.audienceHash,
      dryRun: false,
      segment: {
        country: "CO"
      }
    });

    expect(result.campaign.status).toBe("queued");
    expect(result.campaign.queuedJobCount).toBe(2);
    expect(deliveryJobMocks.createOrGetTransactionalWebPushJob).toHaveBeenCalledTimes(2);
    expect(deliveryJobMocks.enqueueTransactionalWebPushJob).toHaveBeenCalledTimes(2);
  });
});
