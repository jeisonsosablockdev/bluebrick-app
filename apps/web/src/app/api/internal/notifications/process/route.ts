import { NextRequest, NextResponse } from "next/server";

import { notificationProcessSchema } from "@/lib/notifications/delivery-route-contract";
import {
  enqueueTransactionalWebPushJob,
  hasNotificationQueueConfig,
  isNotificationsWorkerRequest,
  processTransactionalWebPushJobBatch,
  WebPushDeliveryJobError
} from "@/lib/notifications/delivery-jobs";
import { getRequestRole } from "@/lib/auth-session";
import { notificationErrorResponse } from "@/lib/notifications/route-responses";
import { assertWebPushDeliveryEnabled, NotificationsRolloutError } from "@/lib/notifications/rollout";

function isAuthorized(request: NextRequest): boolean {
  if (isNotificationsWorkerRequest(request.headers.get("x-notifications-worker-token"))) {
    return true;
  }

  const role = getRequestRole(request);
  return role.authenticated && role.role === "admin";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return notificationErrorResponse(403, "FORBIDDEN", "Worker token or admin role is required.");
  }

  const body = await request.json().catch(() => null);
  const parsed = notificationProcessSchema.safeParse(body);

  if (!parsed.success) {
    return notificationErrorResponse(400, "INVALID_NOTIFICATION_JOB_ID", "jobId must be a UUID.");
  }

  try {
    assertWebPushDeliveryEnabled();

    const result = await processTransactionalWebPushJobBatch(parsed.data.jobId);

    if (result.needsRequeue && hasNotificationQueueConfig()) {
      await enqueueTransactionalWebPushJob(parsed.data.jobId);
    }

    return NextResponse.json({
      ok: true,
      jobId: parsed.data.jobId,
      status: result.job.status,
      processedInBatch: result.processedInBatch,
      deliveredInBatch: result.deliveredInBatch,
      prunedInBatch: result.prunedInBatch,
      failedInBatch: result.failedInBatch,
      needsRequeue: result.needsRequeue
    });
  } catch (error) {
    if (error instanceof NotificationsRolloutError) {
      return notificationErrorResponse(error.status, error.code, error.message);
    }

    if (error instanceof WebPushDeliveryJobError) {
      return notificationErrorResponse(error.status, error.code, error.message);
    }

    const message = error instanceof Error ? error.message : "Could not process notification delivery job.";
    return notificationErrorResponse(500, "NOTIFICATION_PROCESS_FAILED", message);
  }
}
