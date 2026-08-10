import { recordOperabilityLog } from "@/lib/observability/store";

import {
  createOrGetTransactionalWebPushJob,
  enqueueTransactionalWebPushJob,
  hasNotificationQueueConfig,
  processTransactionalWebPushJobBatch,
  type DeliveryActorType
} from "@/lib/notifications/delivery-jobs";
import { assertWebPushDeliveryEnabled } from "@/lib/notifications/rollout";
import { listAdminCampaignAudience, listAdminCampaignTargetWallets } from "@/lib/notifications/admin-campaign-audience";
import {
  AdminNotificationCampaignError,
  type AdminNotificationAudiencePreview,
  type AdminNotificationCampaignInput,
  type AdminNotificationCampaignRecord,
  type AdminNotificationCampaignStatus,
  buildCampaignRecord,
  buildPreviewFromAudience,
  normalizeAdminCampaignInput,
  sanitizeCampaignText,
  type CreateAdminNotificationCampaignInput
} from "@/lib/notifications/admin-campaign-domain";
import { buildQueuedCampaignRecord, assertAdminCampaignRateLimit, persistAdminCampaign } from "@/lib/notifications/admin-campaign-repository";

async function enqueueCampaignJobs(record: AdminNotificationCampaignRecord, preview: AdminNotificationAudiencePreview): Promise<number> {
  let queuedJobCount = 0;
  const targetWallets =
    preview.sampleWallets.length === preview.eligibleWalletCount
      ? preview.sampleWallets.map((wallet) => wallet.walletPublicKey)
      : await listAdminCampaignTargetWallets(record.segment);

  for (const walletPublicKey of targetWallets) {
    const { job, inserted } = await createOrGetTransactionalWebPushJob({
      dedupeKey: `admin-campaign:${record.id}:${walletPublicKey}`,
      notificationType: "admin_notice",
      walletPublicKey,
      title: record.title,
      body: record.body,
      destinationUrl: record.destinationUrl,
      metadata: {
        campaignId: record.id,
        messageClass: record.messageClass,
        segment: record.segment
      },
      createdByType: "admin" as DeliveryActorType,
      createdById: record.actorPubkey
    });

    if (!inserted) {
      continue;
    }

    queuedJobCount += 1;

    if (hasNotificationQueueConfig()) {
      await enqueueTransactionalWebPushJob(job.id);
      continue;
    }

    let result = await processTransactionalWebPushJobBatch(job.id);
    let rounds = 0;

    while (result.needsRequeue && rounds < 8) {
      rounds += 1;
      result = await processTransactionalWebPushJobBatch(job.id);
    }
  }

  return queuedJobCount;
}

export async function previewAdminNotificationCampaign(input: AdminNotificationCampaignInput): Promise<AdminNotificationAudiencePreview> {
  const normalized = normalizeAdminCampaignInput(input);
  const audienceRows = await listAdminCampaignAudience(normalized.segment);
  const preview = buildPreviewFromAudience(normalized, audienceRows);

  recordOperabilityLog({
    level: preview.blockedReasons.length > 0 ? "warn" : "info",
    event: "admin_push_campaign_preview",
    message: `Previewed admin push campaign for ${normalized.actorPubkey}.`,
    context: {
      actorPubkey: normalized.actorPubkey,
      messageClass: normalized.messageClass,
      segment: normalized.segment,
      eligibleWalletCount: preview.eligibleWalletCount,
      blockedReasons: preview.blockedReasons
    }
  });

  return preview;
}

export async function createAdminNotificationCampaign(
  input: CreateAdminNotificationCampaignInput
): Promise<{ campaign: AdminNotificationCampaignRecord; preview: AdminNotificationAudiencePreview }> {
  const normalized = normalizeAdminCampaignInput(input);
  assertWebPushDeliveryEnabled();
  await assertAdminCampaignRateLimit(normalized.actorPubkey);

  const preview = await previewAdminNotificationCampaign(normalized);

  if (preview.audienceHash !== sanitizeCampaignText(input.previewHash, "previewHash", 128)) {
    throw new AdminNotificationCampaignError(
      "previewHash does not match the current eligible audience. Refresh preview before sending.",
      409,
      "STALE_CAMPAIGN_PREVIEW"
    );
  }

  const blockedStatus: AdminNotificationCampaignStatus = preview.blockedReasons.length > 0 ? "blocked" : "previewed";
  const initialRecord = buildCampaignRecord(normalized, preview, input.dryRun ? blockedStatus : "queued", 0);

  if (!input.dryRun && preview.blockedReasons.length > 0) {
    await persistAdminCampaign({
      ...initialRecord,
      status: "blocked"
    });
    throw new AdminNotificationCampaignError(
      `Campaign is blocked: ${preview.blockedReasons.join(", ")}`,
      409,
      "BLOCKED_ADMIN_PUSH_CAMPAIGN"
    );
  }

  const queuedJobCount = input.dryRun ? 0 : await enqueueCampaignJobs(initialRecord, preview);
  const persisted = await persistAdminCampaign(
    buildQueuedCampaignRecord(initialRecord, queuedJobCount, input.dryRun, input.dryRun ? blockedStatus : "queued")
  );

  recordOperabilityLog({
    level: preview.blockedReasons.length > 0 ? "warn" : "info",
    event: input.dryRun ? "admin_push_campaign_dry_run" : "admin_push_campaign_queued",
    message: `${input.dryRun ? "Dry-run" : "Queued"} admin push campaign ${persisted.id}.`,
    context: {
      campaignId: persisted.id,
      actorPubkey: persisted.actorPubkey,
      messageClass: persisted.messageClass,
      eligibleWalletCount: preview.eligibleWalletCount,
      queuedJobCount,
      blockedReasons: preview.blockedReasons
    }
  });

  return {
    campaign: persisted,
    preview
  };
}
