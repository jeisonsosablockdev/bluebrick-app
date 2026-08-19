export type PwaPlatform = "ios" | "android" | "desktop" | "unknown";
export type PwaInstallabilityState = "standalone" | "prompt-ready" | "manual-ios" | "criteria-pending" | "unsupported";
export type PwaNotificationState = "ready" | "needs-install" | "blocked" | "unsupported";
export type PwaNotificationPermission = NotificationPermission | "unsupported";

export interface PwaCapabilityInput {
  userAgent?: string | null;
  maxTouchPoints?: number | null;
  isStandalone: boolean;
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasNotificationApi: boolean;
  notificationPermission?: NotificationPermission | null;
  hasBeforeInstallPrompt: boolean;
}

export interface PwaCapabilitySnapshot {
  platform: PwaPlatform;
  isStandalone: boolean;
  supportsPush: boolean;
  installPromptAvailable: boolean;
  installabilityState: PwaInstallabilityState;
  notificationState: PwaNotificationState;
  notificationPermission: PwaNotificationPermission;
}

export function detectPwaPlatform(userAgent?: string | null, maxTouchPoints?: number | null): PwaPlatform {
  const normalizedUserAgent = (userAgent ?? "").toLowerCase();
  const touchPoints = Math.max(0, maxTouchPoints ?? 0);

  if (
    normalizedUserAgent.includes("iphone")
    || normalizedUserAgent.includes("ipad")
    || normalizedUserAgent.includes("ipod")
    || (normalizedUserAgent.includes("macintosh") && touchPoints > 1)
  ) {
    return "ios";
  }

  if (normalizedUserAgent.includes("android")) {
    return "android";
  }

  if (normalizedUserAgent.length > 0) {
    return "desktop";
  }

  return "unknown";
}

export function resolvePwaCapabilitySnapshot(input: PwaCapabilityInput): PwaCapabilitySnapshot {
  const platform = detectPwaPlatform(input.userAgent, input.maxTouchPoints);
  const supportsPush = input.hasServiceWorker && input.hasPushManager && input.hasNotificationApi;
  const notificationPermission: PwaNotificationPermission = input.hasNotificationApi
    ? (input.notificationPermission ?? "default")
    : "unsupported";

  let installabilityState: PwaInstallabilityState = "unsupported";

  if (input.isStandalone) {
    installabilityState = "standalone";
  } else if (input.hasBeforeInstallPrompt) {
    installabilityState = "prompt-ready";
  } else if (platform === "ios") {
    installabilityState = "manual-ios";
  } else if (input.hasServiceWorker) {
    installabilityState = "criteria-pending";
  }

  let notificationState: PwaNotificationState = "unsupported";

  if (!supportsPush) {
    notificationState = "unsupported";
  } else if (notificationPermission === "denied") {
    notificationState = "blocked";
  } else if (platform === "ios" && !input.isStandalone) {
    notificationState = "needs-install";
  } else {
    notificationState = "ready";
  }

  return {
    platform,
    isStandalone: input.isStandalone,
    supportsPush,
    installPromptAvailable: input.hasBeforeInstallPrompt,
    installabilityState,
    notificationState,
    notificationPermission
  };
}
