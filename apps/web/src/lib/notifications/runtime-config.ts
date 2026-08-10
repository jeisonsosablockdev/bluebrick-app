type NotificationQueueRuntimeConfig = {
  token: string;
  baseUrl: string;
  processUrl: string;
  workerToken: string | null;
};

export class NotificationRuntimeConfigError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 500, code = "QSTASH_CONFIG_MISSING") {
    super(message);
    this.name = "NotificationRuntimeConfigError";
    this.status = status;
    this.code = code;
  }
}

function getOptionalNotificationEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

export function getRequiredNotificationEnv(name: string, errorFactory?: (message: string) => Error): string {
  const value = getOptionalNotificationEnv(name);
  if (value) {
    return value;
  }

  const message = `${name} is required for notifications runtime.`;
  if (errorFactory) {
    throw errorFactory(message);
  }

  throw new Error(message);
}

export function hasNotificationsDatabase(): boolean {
  return Boolean(getOptionalNotificationEnv("DATABASE_URL"));
}

export function isNotificationsSchemaUnavailableError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "42P01";
}

export function isNotificationsFlagDisabled(name: string): boolean {
  return process.env[name] === "false";
}

export function isAdminPushCampaignsEnabled(): boolean {
  return process.env.ENABLE_ADMIN_PUSH_CAMPAIGNS === "true";
}

export function getNotificationsWorkerToken(): string | null {
  return getOptionalNotificationEnv("NOTIFICATIONS_WORKER_TOKEN");
}

export function hasNotificationQueueRuntimeConfig(): boolean {
  return Boolean(getOptionalNotificationEnv("QSTASH_TOKEN") && (getOptionalNotificationEnv("QSTASH_NOTIFICATION_PROCESS_URL") || getOptionalNotificationEnv("APP_BASE_URL")));
}

export function getNotificationQueueRuntimeConfig(): NotificationQueueRuntimeConfig {
  const token = getRequiredNotificationEnv(
    "QSTASH_TOKEN",
    (message) => new NotificationRuntimeConfigError(message)
  );
  const baseUrl = (getOptionalNotificationEnv("QSTASH_BASE_URL") || "https://qstash.upstash.io").replace(/\/+$/, "");
  const processUrlFromEnv = getOptionalNotificationEnv("QSTASH_NOTIFICATION_PROCESS_URL");
  const appBaseUrl = getOptionalNotificationEnv("APP_BASE_URL")?.replace(/\/+$/, "") || "";
  const processUrl = processUrlFromEnv || (appBaseUrl ? `${appBaseUrl}/api/internal/notifications/process` : "");

  if (!processUrl) {
    throw new NotificationRuntimeConfigError(
      "QSTASH_TOKEN and either QSTASH_NOTIFICATION_PROCESS_URL or APP_BASE_URL are required for async notification queue.",
    );
  }

  return {
    token,
    baseUrl,
    processUrl,
    workerToken: getNotificationsWorkerToken()
  };
}
