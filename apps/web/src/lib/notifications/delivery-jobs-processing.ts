import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { withDbClient } from "@/lib/db/pool";
import { recordOperabilityLog } from "@/lib/observability/store";
import {
  type DeliveryAttemptStatus,
  nowIso,
  type ProcessTransactionalWebPushJobResult,
  type TransactionalWebPushJobRecord
} from "@/lib/notifications/delivery-jobs-domain";
import {
  getInMemoryWebPushJobById,
  hasWebPushDeliveryJobsDatabase,
  insertWebPushDeliveryAttempt,
  isWebPushDeliveryJobsSchemaUnavailableError,
  listAttemptedSubscriptionIdsWithClient,
  getWebPushJobByIdWithClient,
  updateInMemoryWebPushJobState,
  updateWebPushJobWithClient
} from "@/lib/notifications/delivery-jobs-storage";
import {
  listActiveWebPushSubscriptionsByWallet,
  markWebPushSubscriptionDeliveryFailure,
  markWebPushSubscriptionDeliverySuccess,
  markWebPushSubscriptionGone,
  type WebPushSubscriptionRecord
} from "@/lib/notifications/web-push-subscriptions-repository";
import { sendWebPushEnvelope } from "@/lib/notifications/web-push-delivery";

const PROCESS_BATCH_SIZE = 25;

async function processDeliveryBatch(
  job: TransactionalWebPushJobRecord,
  activeSubscriptions: WebPushSubscriptionRecord[],
  attemptedIds: Set<string>,
  registerAttempt: (attempt: {
    subscriptionId: string;
    endpoint: string;
    status: DeliveryAttemptStatus;
    httpStatus: number | null;
    errorCode: string | null;
    errorMessage: string | null;
  }) => Promise<void>,
  onJobUpdate: (nextJob: TransactionalWebPushJobRecord) => Promise<TransactionalWebPushJobRecord>
): Promise<ProcessTransactionalWebPushJobResult> {
  const remainingSubscriptions = activeSubscriptions.filter((subscription) => !attemptedIds.has(subscription.id));
  const batch = remainingSubscriptions.slice(0, PROCESS_BATCH_SIZE);
  const startedAt = job.startedAt ?? nowIso();

  let nextJob: TransactionalWebPushJobRecord = {
    ...job,
    status: "processing",
    totalSubscriptions: activeSubscriptions.length,
    startedAt
  };
  nextJob = await onJobUpdate(nextJob);

  let deliveredInBatch = 0;
  let prunedInBatch = 0;
  let failedInBatch = 0;

  for (const subscription of batch) {
    const sendResult = await sendWebPushEnvelope(
      {
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        authSecret: subscription.authSecret
      },
      {
        title: nextJob.title,
        body: nextJob.body,
        destinationUrl: nextJob.destinationUrl,
        notificationType: nextJob.notificationType,
        metadata: nextJob.metadata
      }
    );

    if (sendResult.outcome === "delivered") {
      await markWebPushSubscriptionDeliverySuccess(subscription.id);
      deliveredInBatch += 1;
    } else if (sendResult.outcome === "pruned") {
      await markWebPushSubscriptionGone({
        subscriptionId: subscription.id,
        errorCode: sendResult.errorCode ?? "HTTP_410"
      });
      prunedInBatch += 1;
    } else {
      await markWebPushSubscriptionDeliveryFailure({
        subscriptionId: subscription.id,
        errorCode: sendResult.errorCode ?? "UNKNOWN"
      });
      failedInBatch += 1;
    }

    await registerAttempt({
      subscriptionId: subscription.id,
      endpoint: subscription.endpoint,
      status: sendResult.outcome,
      httpStatus: sendResult.httpStatus,
      errorCode: sendResult.errorCode,
      errorMessage: sendResult.errorMessage
    });
    attemptedIds.add(subscription.id);
  }

  const processedInBatch = batch.length;
  const finishedAll = attemptedIds.size >= activeSubscriptions.length;
  const finalStatus =
    finishedAll
      ? failedInBatch > 0 || nextJob.failedCount > 0 || prunedInBatch > 0 || nextJob.prunedCount > 0
        ? "completed_with_failures"
        : "completed"
      : "processing";

  nextJob = await onJobUpdate({
    ...nextJob,
    deliveredCount: nextJob.deliveredCount + deliveredInBatch,
    prunedCount: nextJob.prunedCount + prunedInBatch,
    failedCount: nextJob.failedCount + failedInBatch,
    attemptCount: nextJob.attemptCount + processedInBatch,
    status: finalStatus,
    lastError: failedInBatch > 0 ? "One or more web push deliveries failed." : nextJob.lastError,
    finishedAt: finishedAll ? nowIso() : null
  });

  recordOperabilityLog({
    level: failedInBatch > 0 ? "warn" : "info",
    event: "web_push_delivery_batch_processed",
    message: `Processed ${processedInBatch} subscriptions for job ${nextJob.id}.`,
    context: {
      jobId: nextJob.id,
      deliveredInBatch,
      prunedInBatch,
      failedInBatch,
      status: nextJob.status
    }
  });

  return {
    job: nextJob,
    processedInBatch,
    deliveredInBatch,
    prunedInBatch,
    failedInBatch,
    needsRequeue: !finishedAll
  };
}

async function processJobInMemory(jobId: string): Promise<ProcessTransactionalWebPushJobResult> {
  const state = getInMemoryWebPushJobById(jobId);
  const attemptedIds = new Set(state.attempts.map((attempt) => attempt.subscriptionId));
  const activeSubscriptions = await listActiveWebPushSubscriptionsByWallet(state.job.walletPublicKey);

  return processDeliveryBatch(
    {
      ...state.job,
      metadata: { ...state.job.metadata }
    },
    activeSubscriptions,
    attemptedIds,
    async (attempt) => {
      state.attempts.push({
        id: randomUUID(),
        jobId: state.job.id,
        subscriptionId: attempt.subscriptionId,
        endpoint: attempt.endpoint,
        status: attempt.status,
        httpStatus: attempt.httpStatus,
        errorCode: attempt.errorCode,
        errorMessage: attempt.errorMessage,
        createdAt: nowIso()
      });
    },
    async (nextJob) => updateInMemoryWebPushJobState(state, nextJob)
  );
}

async function processJobWithClient(client: PoolClient, jobId: string): Promise<ProcessTransactionalWebPushJobResult> {
  const job = await getWebPushJobByIdWithClient(client, jobId);
  const attemptedIds = await listAttemptedSubscriptionIdsWithClient(client, jobId);
  const activeSubscriptions = await listActiveWebPushSubscriptionsByWallet(job.walletPublicKey);

  return processDeliveryBatch(
    job,
    activeSubscriptions,
    attemptedIds,
    async (attempt) => {
      await insertWebPushDeliveryAttempt(client, {
        jobId,
        ...attempt
      });
    },
    async (nextJob) => updateWebPushJobWithClient(client, nextJob)
  );
}

export async function processTransactionalWebPushJobBatch(jobId: string): Promise<ProcessTransactionalWebPushJobResult> {
  if (!hasWebPushDeliveryJobsDatabase()) {
    return processJobInMemory(jobId);
  }

  try {
    return await withDbClient((client) => processJobWithClient(client, jobId));
  } catch (error) {
    if (isWebPushDeliveryJobsSchemaUnavailableError(error)) {
      return processJobInMemory(jobId);
    }
    throw error;
  }
}
