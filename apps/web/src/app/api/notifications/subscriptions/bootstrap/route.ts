import { NextResponse } from "next/server";

import { assertWebPushRegistrationEnabled, NotificationsRolloutError } from "@/lib/notifications/rollout";
import { notificationErrorResponse } from "@/lib/notifications/route-responses";
import { getRequiredNotificationEnv } from "@/lib/notifications/runtime-config";
import { listWebPushSubscriptionsByWallet } from "@/lib/notifications/web-push-subscriptions-repository";
import { requireWalletBoundAuth } from "@/lib/notifications/web-push-route-auth";

export async function GET(): Promise<NextResponse> {
  const auth = await requireWalletBoundAuth();

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    assertWebPushRegistrationEnabled();

    const items = await listWebPushSubscriptionsByWallet(auth.accountId, auth.walletPublicKey);
    const vapidPublicKey = getRequiredNotificationEnv("WEB_PUSH_VAPID_PUBLIC_KEY");

    return NextResponse.json(
      {
        ok: true,
        data: {
          vapidPublicKey,
          items: items.map((item) => ({
            id: item.id,
            endpoint: item.endpoint,
            platformFamily: item.platformFamily,
            appMode: item.appMode,
            status: item.status,
            consentSource: item.consentSource,
            subscribedAt: item.subscribedAt,
            lastSeenAt: item.lastSeenAt,
            lastSentAt: item.lastSentAt,
            lastErrorCode: item.lastErrorCode,
            lastErrorAt: item.lastErrorAt,
            revokedAt: item.revokedAt
          }))
        }
      },
      {
        headers: {
          "cache-control": "no-store"
        }
      }
    );
  } catch (error) {
    if (error instanceof NotificationsRolloutError) {
      return notificationErrorResponse(error.status, error.code, error.message);
    }

    const message = error instanceof Error ? error.message : "Could not bootstrap push subscriptions.";
    return notificationErrorResponse(500, "WEB_PUSH_BOOTSTRAP_FAILED", message);
  }
}
