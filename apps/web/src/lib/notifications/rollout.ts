import { isNotificationsFlagDisabled } from "@/lib/notifications/runtime-config";

export class NotificationsRolloutError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 503, code = "NOTIFICATIONS_FEATURE_DISABLED") {
    super(message);
    this.name = "NotificationsRolloutError";
    this.status = status;
    this.code = code;
  }
}

export function isPwaInstallabilityEnabled(): boolean {
  return !isNotificationsFlagDisabled("NEXT_PUBLIC_ENABLE_PWA_INSTALLABILITY");
}

export function isWebPushRegistrationEnabled(): boolean {
  return !isNotificationsFlagDisabled("ENABLE_WEB_PUSH_SUBSCRIPTIONS");
}

export function isWebPushDeliveryEnabled(): boolean {
  return !isNotificationsFlagDisabled("ENABLE_WEB_PUSH_DELIVERY");
}

export function assertWebPushRegistrationEnabled(): void {
  if (!isWebPushRegistrationEnabled()) {
    throw new NotificationsRolloutError(
      "Web push subscription registration is currently disabled by rollout controls.",
      503,
      "WEB_PUSH_REGISTRATION_DISABLED"
    );
  }
}

export function assertWebPushDeliveryEnabled(): void {
  if (!isWebPushDeliveryEnabled()) {
    throw new NotificationsRolloutError(
      "Web push delivery is currently disabled by rollout controls.",
      503,
      "WEB_PUSH_DELIVERY_DISABLED"
    );
  }
}
