import type { PoolClient } from "pg";

import { withDbClient } from "@/lib/db/pool";

import {
  getAdminCampaignRateLimitMax,
  getAdminCampaignRateLimitWindowMinutes,
  hasAdminCampaignDatabase,
  isAdminCampaignSchemaUnavailableError
} from "@/lib/notifications/admin-campaign-config";
import {
  AdminNotificationCampaignError,
  type AdminNotificationCampaignRecord,
  nowIso,
  sanitizeCampaignText
} from "@/lib/notifications/admin-campaign-domain";
import { listInMemoryAdminCampaigns, pushInMemoryAdminCampaign } from "@/lib/notifications/admin-campaign-state";

async function countRecentCampaignsWithClient(client: PoolClient, actorPubkey: string): Promise<number> {
  const result = await client.query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM admin_push_campaigns
      WHERE actor_pubkey = $1
        AND created_at >= NOW() - ($2::text || ' minutes')::interval
    `,
    [actorPubkey, String(getAdminCampaignRateLimitWindowMinutes())]
  );

  return Number(result.rows[0]?.count ?? 0);
}

function assertInMemoryCampaignRateLimit(actorPubkey: string, maxCampaigns: number): void {
  const threshold = Date.now() - getAdminCampaignRateLimitWindowMinutes() * 60_000;
  const recentCount = listInMemoryAdminCampaigns().filter(
    (campaign) => campaign.actorPubkey === actorPubkey && Date.parse(campaign.createdAt) >= threshold
  ).length;

  if (recentCount >= maxCampaigns) {
    throw new AdminNotificationCampaignError(
      `Rate limit exceeded. Max ${maxCampaigns} admin push campaigns per window.`,
      429,
      "ADMIN_PUSH_RATE_LIMITED"
    );
  }
}

export async function assertAdminCampaignRateLimit(actorPubkey: string): Promise<void> {
  const actor = sanitizeCampaignText(actorPubkey, "actorPubkey", 120);
  const maxCampaigns = getAdminCampaignRateLimitMax();

  if (!hasAdminCampaignDatabase()) {
    assertInMemoryCampaignRateLimit(actor, maxCampaigns);
    return;
  }

  try {
    const recentCount = await withDbClient((client) => countRecentCampaignsWithClient(client, actor));
    if (recentCount >= maxCampaigns) {
      throw new AdminNotificationCampaignError(
        `Rate limit exceeded. Max ${maxCampaigns} admin push campaigns per window.`,
        429,
        "ADMIN_PUSH_RATE_LIMITED"
      );
    }
  } catch (error) {
    if (isAdminCampaignSchemaUnavailableError(error)) {
      assertInMemoryCampaignRateLimit(actor, maxCampaigns);
      return;
    }

    throw error;
  }
}

async function persistCampaignWithClient(
  client: PoolClient,
  record: AdminNotificationCampaignRecord
): Promise<AdminNotificationCampaignRecord> {
  const result = await client.query(
    `
      INSERT INTO admin_push_campaigns (
        id,
        actor_pubkey,
        message_class,
        title,
        body,
        destination_url,
        segment_json,
        audience_summary_json,
        audience_hash,
        status,
        eligible_wallet_count,
        eligible_subscription_count,
        excluded_wallet_count,
        queued_job_count,
        reason_codes,
        queued_at
      )
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11, $12, $13, $14, $15::text[], $16)
      RETURNING *
    `,
    [
      record.id,
      record.actorPubkey,
      record.messageClass,
      record.title,
      record.body,
      record.destinationUrl,
      JSON.stringify(record.segment),
      JSON.stringify(record.audienceSummary),
      record.audienceSummary.audienceHash,
      record.status,
      record.audienceSummary.eligibleWalletCount,
      record.audienceSummary.eligibleSubscriptionCount,
      record.audienceSummary.excludedWalletCount,
      record.queuedJobCount,
      record.audienceSummary.blockedReasons,
      record.queuedAt
    ]
  );

  const row = result.rows[0] as Record<string, unknown>;
  return {
    ...record,
    createdAt: new Date(String(row.created_at)).toISOString(),
    queuedAt: row.queued_at ? new Date(String(row.queued_at)).toISOString() : null
  };
}

export async function persistAdminCampaign(record: AdminNotificationCampaignRecord): Promise<AdminNotificationCampaignRecord> {
  if (!hasAdminCampaignDatabase()) {
    return pushInMemoryAdminCampaign(record);
  }

  try {
    return await withDbClient((client) => persistCampaignWithClient(client, record));
  } catch (error) {
    if (isAdminCampaignSchemaUnavailableError(error)) {
      return pushInMemoryAdminCampaign(record);
    }

    throw error;
  }
}

export function buildQueuedCampaignRecord(
  record: AdminNotificationCampaignRecord,
  queuedJobCount: number,
  dryRun: boolean,
  status: AdminNotificationCampaignRecord["status"]
): AdminNotificationCampaignRecord {
  return {
    ...record,
    status,
    queuedJobCount,
    queuedAt: dryRun ? null : nowIso()
  };
}
