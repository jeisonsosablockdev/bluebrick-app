import type { PoolClient } from "pg";

import { withDbClient } from "@/features/shared/infrastructure/db/pool";

import { hasAdminCampaignDatabase, isAdminCampaignSchemaUnavailableError } from "@/lib/notifications/admin-campaign-config";
import type { AdminNotificationSegment, AudienceRow } from "@/lib/notifications/admin-campaign-domain";
import { listInMemoryAdminAudienceEntries } from "@/lib/notifications/admin-campaign-state";
import type { WebPushAppMode, WebPushPlatformFamily } from "@/lib/notifications/web-push-subscriptions-repository";

function listAudienceInMemory(segment: AdminNotificationSegment): AudienceRow[] {
  const rows: AudienceRow[] = [];

  for (const [walletPublicKey, record] of listInMemoryAdminAudienceEntries()) {
    const matching = record.subscriptions.filter((subscription) => {
      if (segment.platformFamily && subscription.platformFamily !== segment.platformFamily) {
        return false;
      }
      if (segment.appMode && subscription.appMode !== segment.appMode) {
        return false;
      }
      return true;
    });

    if (segment.country && record.country !== segment.country) {
      continue;
    }

    rows.push({
      walletPublicKey,
      country: record.country,
      activeSubscriptionCount: matching.length,
      platformFamily: matching[0]?.platformFamily ?? null,
      appMode: matching[0]?.appMode ?? null
    });
  }

  return rows.sort(
    (left, right) =>
      right.activeSubscriptionCount - left.activeSubscriptionCount || left.walletPublicKey.localeCompare(right.walletPublicKey)
  );
}

async function listAudienceWithClient(client: PoolClient, segment: AdminNotificationSegment): Promise<AudienceRow[]> {
  const result = await client.query<{
    wallet_public_key: string;
    country: string | null;
    active_subscription_count: string;
    platform_family: WebPushPlatformFamily | null;
    app_mode: WebPushAppMode | null;
  }>(
    `
      SELECT
        p.wallet_public_key,
        p.country,
        COUNT(s.id)::text AS active_subscription_count,
        MIN(s.platform_family)::text AS platform_family,
        MIN(s.app_mode)::text AS app_mode
      FROM user_profiles p
      LEFT JOIN web_push_subscriptions s
        ON s.wallet_public_key = p.wallet_public_key
       AND s.status = 'active'
       AND ($2::text IS NULL OR s.platform_family = $2)
       AND ($3::text IS NULL OR s.app_mode = $3)
      WHERE ($1::text IS NULL OR p.country = $1)
      GROUP BY p.wallet_public_key, p.country
      ORDER BY COUNT(s.id) DESC, p.wallet_public_key ASC
    `,
    [segment.country, segment.platformFamily, segment.appMode]
  );

  return result.rows.map((row) => ({
    walletPublicKey: row.wallet_public_key,
    country: row.country,
    activeSubscriptionCount: Number(row.active_subscription_count ?? 0),
    platformFamily: row.platform_family ?? null,
    appMode: row.app_mode ?? null
  }));
}

export async function listAdminCampaignAudience(segment: AdminNotificationSegment): Promise<AudienceRow[]> {
  if (!hasAdminCampaignDatabase()) {
    return listAudienceInMemory(segment);
  }

  try {
    return await withDbClient((client) => listAudienceWithClient(client, segment));
  } catch (error) {
    if (isAdminCampaignSchemaUnavailableError(error)) {
      return listAudienceInMemory(segment);
    }

    throw error;
  }
}

export async function listAdminCampaignTargetWallets(segment: AdminNotificationSegment): Promise<string[]> {
  const rows = await listAdminCampaignAudience(segment);
  return rows.filter((row) => row.activeSubscriptionCount > 0).map((row) => row.walletPublicKey);
}
