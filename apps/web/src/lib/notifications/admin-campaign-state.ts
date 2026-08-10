import type { AudienceRow, AdminNotificationCampaignRecord } from "@/lib/notifications/admin-campaign-domain";
import type { WebPushAppMode, WebPushPlatformFamily } from "@/lib/notifications/web-push-subscriptions-repository";

const inMemoryCampaigns: AdminNotificationCampaignRecord[] = [];
const inMemoryAudience = new Map<string, { country: string | null; subscriptions: AudienceRow[] }>();

export function resetAdminNotificationCampaignStateForTests(): void {
  inMemoryCampaigns.length = 0;
  inMemoryAudience.clear();
}

export function seedAdminNotificationAudienceForTests(
  rows: Array<{
    walletPublicKey: string;
    country: string | null;
    subscriptions: Array<{
      platformFamily: WebPushPlatformFamily;
      appMode: WebPushAppMode;
    }>;
  }>
): void {
  inMemoryAudience.clear();

  for (const row of rows) {
    inMemoryAudience.set(row.walletPublicKey, {
      country: row.country,
      subscriptions: row.subscriptions.map((subscription) => ({
        walletPublicKey: row.walletPublicKey,
        country: row.country,
        activeSubscriptionCount: 1,
        platformFamily: subscription.platformFamily,
        appMode: subscription.appMode
      }))
    });
  }
}

export function listInMemoryAdminCampaigns(): AdminNotificationCampaignRecord[] {
  return inMemoryCampaigns;
}

export function pushInMemoryAdminCampaign(record: AdminNotificationCampaignRecord): AdminNotificationCampaignRecord {
  inMemoryCampaigns.push(record);
  return record;
}

export function listInMemoryAdminAudienceEntries(): IterableIterator<[string, { country: string | null; subscriptions: AudienceRow[] }]> {
  return inMemoryAudience.entries();
}
