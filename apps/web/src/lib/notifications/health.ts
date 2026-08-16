import type { PoolClient } from "pg";

import { withDbClient } from "@/features/shared/infrastructure/db/pool";
import {
  __getWebPushSubscriptionRecordsForTests,
  type WebPushPlatformFamily,
  type WebPushSubscriptionStatus
} from "@/lib/notifications/web-push-subscriptions-repository";
import { __getWebPushDeliveryJobsStateForTests } from "@/lib/notifications/delivery-jobs";
import { isPwaInstallabilityEnabled, isWebPushDeliveryEnabled, isWebPushRegistrationEnabled } from "@/lib/notifications/rollout";
import {
  hasNotificationsDatabase,
  isAdminPushCampaignsEnabled,
  isNotificationsSchemaUnavailableError
} from "@/lib/notifications/runtime-config";

export type NotificationHealthSnapshot = {
  rollout: {
    installabilityEnabled: boolean;
    registrationEnabled: boolean;
    deliveryEnabled: boolean;
    adminCampaignsEnabled: boolean;
  };
  subscriptions: {
    total: number;
    active: number;
    revoked: number;
    failing: number;
    gone: number;
    byPlatform: Record<WebPushPlatformFamily, number>;
    newLast24h: number;
  };
  deliveries: {
    processedAttempts: number;
    delivered: number;
    pruned: number;
    failed: number;
    processedLast24h: number;
  };
};

function isoWithin24h(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return false;
  }

  return timestamp >= Date.now() - 24 * 60 * 60 * 1000;
}

function buildRolloutSnapshot() {
  return {
    installabilityEnabled: isPwaInstallabilityEnabled(),
    registrationEnabled: isWebPushRegistrationEnabled(),
    deliveryEnabled: isWebPushDeliveryEnabled(),
    adminCampaignsEnabled: isAdminPushCampaignsEnabled()
  };
}

function getHealthSnapshotInMemory(): NotificationHealthSnapshot {
  const subscriptionRecords = __getWebPushSubscriptionRecordsForTests();
  const deliveryState = __getWebPushDeliveryJobsStateForTests();
  const byPlatform: Record<WebPushPlatformFamily, number> = {
    ios: 0,
    android: 0,
    desktop: 0,
    unknown: 0
  };
  const byStatus: Record<WebPushSubscriptionStatus, number> = {
    active: 0,
    revoked: 0,
    failing: 0,
    gone: 0
  };

  for (const record of subscriptionRecords) {
    byPlatform[record.platformFamily] += 1;
    byStatus[record.status] += 1;
  }

  const attempts = deliveryState.flatMap((state) => state.attempts);
  const delivered = attempts.filter((attempt) => attempt.status === "delivered");
  const pruned = attempts.filter((attempt) => attempt.status === "pruned");
  const failed = attempts.filter((attempt) => attempt.status === "failed");

  return {
    rollout: buildRolloutSnapshot(),
    subscriptions: {
      total: subscriptionRecords.length,
      active: byStatus.active,
      revoked: byStatus.revoked,
      failing: byStatus.failing,
      gone: byStatus.gone,
      byPlatform,
      newLast24h: subscriptionRecords.filter((record) => isoWithin24h(record.subscribedAt)).length
    },
    deliveries: {
      processedAttempts: attempts.length,
      delivered: delivered.length,
      pruned: pruned.length,
      failed: failed.length,
      processedLast24h: attempts.filter((attempt) => isoWithin24h(attempt.createdAt)).length
    }
  };
}

async function getHealthSnapshotWithClient(client: PoolClient): Promise<NotificationHealthSnapshot> {
  const [subscriptionSummary, deliverySummary] = await Promise.all([
    client.query<{
      total: string;
      active: string;
      revoked: string;
      failing: string;
      gone: string;
      ios: string;
      android: string;
      desktop: string;
      unknown: string;
      new_last_24h: string;
    }>(
      `
        SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE status = 'active')::text AS active,
          COUNT(*) FILTER (WHERE status = 'revoked')::text AS revoked,
          COUNT(*) FILTER (WHERE status = 'failing')::text AS failing,
          COUNT(*) FILTER (WHERE status = 'gone')::text AS gone,
          COUNT(*) FILTER (WHERE platform_family = 'ios')::text AS ios,
          COUNT(*) FILTER (WHERE platform_family = 'android')::text AS android,
          COUNT(*) FILTER (WHERE platform_family = 'desktop')::text AS desktop,
          COUNT(*) FILTER (WHERE platform_family = 'unknown')::text AS unknown,
          COUNT(*) FILTER (WHERE subscribed_at >= NOW() - INTERVAL '24 hours')::text AS new_last_24h
        FROM web_push_subscriptions
      `
    ),
    client.query<{
      processed_attempts: string;
      delivered: string;
      pruned: string;
      failed: string;
      processed_last_24h: string;
    }>(
      `
        SELECT
          COUNT(*)::text AS processed_attempts,
          COUNT(*) FILTER (WHERE status = 'delivered')::text AS delivered,
          COUNT(*) FILTER (WHERE status = 'pruned')::text AS pruned,
          COUNT(*) FILTER (WHERE status = 'failed')::text AS failed,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::text AS processed_last_24h
        FROM web_push_delivery_attempts
      `
    )
  ]);

  const subscriptions = subscriptionSummary.rows[0];
  const deliveries = deliverySummary.rows[0];

  return {
    rollout: buildRolloutSnapshot(),
    subscriptions: {
      total: Number(subscriptions?.total ?? 0),
      active: Number(subscriptions?.active ?? 0),
      revoked: Number(subscriptions?.revoked ?? 0),
      failing: Number(subscriptions?.failing ?? 0),
      gone: Number(subscriptions?.gone ?? 0),
      byPlatform: {
        ios: Number(subscriptions?.ios ?? 0),
        android: Number(subscriptions?.android ?? 0),
        desktop: Number(subscriptions?.desktop ?? 0),
        unknown: Number(subscriptions?.unknown ?? 0)
      },
      newLast24h: Number(subscriptions?.new_last_24h ?? 0)
    },
    deliveries: {
      processedAttempts: Number(deliveries?.processed_attempts ?? 0),
      delivered: Number(deliveries?.delivered ?? 0),
      pruned: Number(deliveries?.pruned ?? 0),
      failed: Number(deliveries?.failed ?? 0),
      processedLast24h: Number(deliveries?.processed_last_24h ?? 0)
    }
  };
}

export async function getNotificationHealthSnapshot(): Promise<NotificationHealthSnapshot> {
  if (!hasNotificationsDatabase()) {
    return getHealthSnapshotInMemory();
  }

  try {
    return await withDbClient((client) => getHealthSnapshotWithClient(client));
  } catch (error) {
    if (isNotificationsSchemaUnavailableError(error)) {
      return getHealthSnapshotInMemory();
    }

    throw error;
  }
}
