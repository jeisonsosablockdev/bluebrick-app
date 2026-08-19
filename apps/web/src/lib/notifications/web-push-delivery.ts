import webpush, { type PushSubscription as WebPushLibrarySubscription } from "web-push";
import { getRequiredNotificationEnv } from "@/lib/notifications/runtime-config";

export type TransactionalNotificationType =
  | "onboarding_reward_earned"
  | "kyc_status_changed"
  | "checkout_status_changed"
  | "admin_notice";

export type WebPushAttemptOutcome = "delivered" | "pruned" | "failed";

export type WebPushEnvelope = {
  title: string;
  body: string;
  destinationUrl: string | null;
  notificationType: TransactionalNotificationType;
  metadata?: Record<string, unknown>;
};

export type WebPushSendResult = {
  outcome: WebPushAttemptOutcome;
  httpStatus: number | null;
  errorCode: string | null;
  errorMessage: string | null;
};

export type WebPushSubscriptionShape = {
  endpoint: string;
  p256dh: string;
  authSecret: string;
};

let vapidConfigured = false;

export function __resetWebPushClientForTests(): void {
  vapidConfigured = false;
}

export function configureWebPushClient(): void {
  if (vapidConfigured) {
    return;
  }

  webpush.setVapidDetails(
    getRequiredNotificationEnv("WEB_PUSH_VAPID_SUBJECT"),
    getRequiredNotificationEnv("WEB_PUSH_VAPID_PUBLIC_KEY"),
    getRequiredNotificationEnv("WEB_PUSH_VAPID_PRIVATE_KEY")
  );
  vapidConfigured = true;
}

export function buildWebPushPayload(envelope: WebPushEnvelope): string {
  return JSON.stringify({
    title: envelope.title,
    body: envelope.body,
    url: envelope.destinationUrl,
    notificationType: envelope.notificationType,
    metadata: envelope.metadata ?? {}
  });
}

function classifySendError(error: unknown): WebPushSendResult {
  const candidate = error as { statusCode?: unknown; body?: unknown; message?: unknown; code?: unknown };
  const httpStatus = typeof candidate.statusCode === "number" ? candidate.statusCode : null;
  const errorMessage =
    typeof candidate.body === "string"
      ? candidate.body.slice(0, 220)
      : typeof candidate.message === "string"
        ? candidate.message.slice(0, 220)
        : "Unknown web push error.";
  const errorCode = typeof candidate.code === "string" ? candidate.code : httpStatus ? `HTTP_${httpStatus}` : "UNKNOWN";

  if (httpStatus === 404 || httpStatus === 410) {
    return {
      outcome: "pruned",
      httpStatus,
      errorCode,
      errorMessage
    };
  }

  return {
    outcome: "failed",
    httpStatus,
    errorCode,
    errorMessage
  };
}

export async function sendWebPushEnvelope(
  subscription: WebPushSubscriptionShape,
  envelope: WebPushEnvelope
): Promise<WebPushSendResult> {
  configureWebPushClient();

  const target: WebPushLibrarySubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.authSecret
    }
  };

  try {
    const response = await webpush.sendNotification(target, buildWebPushPayload(envelope));
    return {
      outcome: "delivered",
      httpStatus: typeof response.statusCode === "number" ? response.statusCode : null,
      errorCode: null,
      errorMessage: null
    };
  } catch (error) {
    return classifySendError(error);
  }
}
