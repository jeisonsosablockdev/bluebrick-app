import { WebPushDeliveryJobError } from "@/lib/notifications/delivery-jobs-domain";
import {
  getNotificationQueueRuntimeConfig,
  hasNotificationQueueRuntimeConfig,
  NotificationRuntimeConfigError
} from "@/lib/notifications/runtime-config";

export function hasNotificationQueueConfig(): boolean {
  return hasNotificationQueueRuntimeConfig();
}

export async function enqueueTransactionalWebPushJob(jobId: string): Promise<void> {
  let config;

  try {
    config = getNotificationQueueRuntimeConfig();
  } catch (error) {
    if (error instanceof NotificationRuntimeConfigError) {
      throw new WebPushDeliveryJobError(error.message, error.status, error.code);
    }

    throw error;
  }

  const endpoint = `${config.baseUrl}/v2/publish/${encodeURIComponent(config.processUrl)}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.token}`,
    "Content-Type": "application/json",
    "Upstash-Method": "POST"
  };

  if (config.workerToken) {
    headers["Upstash-Forward-x-notifications-worker-token"] = config.workerToken;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ jobId })
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    throw new WebPushDeliveryJobError(
      `Could not enqueue web push delivery job: ${response.status} ${payload}`,
      500,
      "QSTASH_ENQUEUE_FAILED"
    );
  }
}
