import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  listWebPushSubscriptionsByWallet,
  revokeWebPushSubscription,
  upsertWebPushSubscription,
  WebPushSubscriptionRepositoryError
} from "@/lib/notifications/web-push-subscriptions-repository";
import { requireWalletBoundAuth } from "@/lib/notifications/web-push-route-auth";
import { assertWebPushRegistrationEnabled, NotificationsRolloutError } from "@/lib/notifications/rollout";

const subscriptionPayloadSchema = z.object({
  subscription: z.object({
    endpoint: z.string().trim().min(1).max(2048),
    keys: z.object({
      p256dh: z.string().trim().min(1).max(1024),
      auth: z.string().trim().min(1).max(1024)
    })
  }),
  platformFamily: z.enum(["ios", "android", "desktop", "unknown"]).default("unknown"),
  appMode: z.enum(["browser", "standalone"]).default("browser"),
  consentSource: z.string().trim().min(1).max(120).default("protected_profile")
});

const revokePayloadSchema = z.object({
  endpoint: z.string().trim().min(1).max(2048)
});

function errorResponse(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function GET(): Promise<NextResponse> {
  const auth = await requireWalletBoundAuth();

  if (auth instanceof NextResponse) {
    return auth;
  }

  const items = await listWebPushSubscriptionsByWallet(auth.accountId, auth.walletPublicKey);

  return NextResponse.json({
    ok: true,
    data: {
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
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireWalletBoundAuth();

  if (auth instanceof NextResponse) {
    return auth;
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "INVALID_JSON", "Invalid request body.");
  }

  const parsed = subscriptionPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse(400, "INVALID_SUBSCRIPTION_PAYLOAD", "Subscription payload is invalid.");
  }

  try {
    assertWebPushRegistrationEnabled();

    const record = await upsertWebPushSubscription({
      accountId: auth.accountId,
      walletPublicKey: auth.walletPublicKey,
      endpoint: parsed.data.subscription.endpoint,
      p256dh: parsed.data.subscription.keys.p256dh,
      authSecret: parsed.data.subscription.keys.auth,
      userAgent: request.headers.get("user-agent"),
      platformFamily: parsed.data.platformFamily,
      appMode: parsed.data.appMode,
      consentSource: parsed.data.consentSource
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          id: record.id,
          endpoint: record.endpoint,
          accountId: record.accountId,
          walletPublicKey: record.walletPublicKey,
          platformFamily: record.platformFamily,
          appMode: record.appMode,
          status: record.status,
          consentSource: record.consentSource,
          subscribedAt: record.subscribedAt,
          lastSeenAt: record.lastSeenAt
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof NotificationsRolloutError) {
      return errorResponse(error.status, error.code, error.message);
    }

    if (error instanceof WebPushSubscriptionRepositoryError) {
      if (error.code === "SUBSCRIPTION_OWNERSHIP_MISMATCH") {
        return errorResponse(409, error.code, error.message);
      }

      return errorResponse(400, error.code, error.message);
    }

    throw error;
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const auth = await requireWalletBoundAuth();

  if (auth instanceof NextResponse) {
    return auth;
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "INVALID_JSON", "Invalid request body.");
  }

  const parsed = revokePayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse(400, "INVALID_SUBSCRIPTION_PAYLOAD", "Subscription payload is invalid.");
  }

  try {
    const record = await revokeWebPushSubscription({
      accountId: auth.accountId,
      walletPublicKey: auth.walletPublicKey,
      endpoint: parsed.data.endpoint
    });

    if (!record) {
      return errorResponse(404, "SUBSCRIPTION_NOT_FOUND", "Subscription endpoint was not found.");
    }

    return NextResponse.json({
      ok: true,
      data: {
        endpoint: record.endpoint,
        status: record.status,
        revokedAt: record.revokedAt
      }
    });
  } catch (error) {
    if (error instanceof WebPushSubscriptionRepositoryError) {
      if (error.code === "SUBSCRIPTION_OWNERSHIP_MISMATCH") {
        return errorResponse(404, "SUBSCRIPTION_NOT_FOUND", "Subscription endpoint was not found.");
      }

      return errorResponse(400, error.code, error.message);
    }

    throw error;
  }
}
