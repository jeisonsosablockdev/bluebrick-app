import { NextRequest, NextResponse } from "next/server";

import { notificationEnqueueSchema } from "@/lib/notifications/delivery-route-contract";
import {
  createOrGetTransactionalWebPushJob,
  enqueueTransactionalWebPushJob,
  hasNotificationQueueConfig,
  processTransactionalWebPushJobBatch,
  resolveNotificationActor,
  WebPushDeliveryJobError
} from "@/lib/notifications/delivery-jobs";
import { notificationErrorResponse } from "@/lib/notifications/route-responses";
import { assertWebPushDeliveryEnabled, NotificationsRolloutError } from "@/lib/notifications/rollout";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const actor = resolveNotificationActor(request);
  if (!actor) {
    return notificationErrorResponse(403, "FORBIDDEN", "Admin role or notifications worker token is required.");
  }

  const body = await request.json().catch(() => null);
  const parsed = notificationEnqueueSchema.safeParse(body);

  if (!parsed.success) {
    return notificationErrorResponse(400, "INVALID_NOTIFICATION_JOB", "Notification enqueue payload is invalid.");
  }

  try {
    assertWebPushDeliveryEnabled();

    const { job, inserted } = await createOrGetTransactionalWebPushJob({
      ...parsed.data,
      destinationUrl: parsed.data.destinationUrl ?? null,
      metadata: parsed.data.metadata,
      createdByType: actor.createdByType,
      createdById: actor.createdById
    });

    if (!inserted) {
      return NextResponse.json({
        ok: true,
        queued: false,
        deduped: true,
        data: {
          jobId: job.id,
          status: job.status
        }
      });
    }

    if (hasNotificationQueueConfig()) {
      await enqueueTransactionalWebPushJob(job.id);
      return NextResponse.json(
        {
          ok: true,
          queued: true,
          deduped: false,
          data: {
            jobId: job.id,
            status: job.status
          }
        },
        { status: 202 }
      );
    }

    let result = await processTransactionalWebPushJobBatch(job.id);
    let fallbackRounds = 0;

    while (result.needsRequeue && fallbackRounds < 8) {
      fallbackRounds += 1;
      result = await processTransactionalWebPushJobBatch(job.id);
    }

    return NextResponse.json(
      {
        ok: true,
        queued: false,
        deduped: false,
        fallbackProcessedInline: true,
        data: {
          jobId: result.job.id,
          status: result.job.status,
          processedInBatch: result.processedInBatch,
          deliveredInBatch: result.deliveredInBatch,
          prunedInBatch: result.prunedInBatch,
          failedInBatch: result.failedInBatch,
          needsRequeue: result.needsRequeue
        }
      },
      { status: 202 }
    );
  } catch (error) {
    if (error instanceof NotificationsRolloutError) {
      return notificationErrorResponse(error.status, error.code, error.message);
    }

    if (error instanceof WebPushDeliveryJobError) {
      return notificationErrorResponse(error.status, error.code, error.message);
    }

    const message = error instanceof Error ? error.message : "Could not enqueue notification delivery job.";
    return notificationErrorResponse(500, "NOTIFICATION_ENQUEUE_FAILED", message);
  }
}
