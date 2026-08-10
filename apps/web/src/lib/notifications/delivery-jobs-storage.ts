import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { withDbClient } from "@/lib/db/pool";
import {
  hasNotificationsDatabase,
  isNotificationsSchemaUnavailableError
} from "@/lib/notifications/runtime-config";
import {
  buildInMemoryWebPushJob,
  cloneWebPushJob,
  type CreateTransactionalWebPushJobInput,
  type DeliveryAttemptRecord,
  type DeliveryAttemptStatus,
  type InMemoryJobState,
  mapWebPushJobRow,
  normalizeCreateTransactionalWebPushJobInput,
  nowIso,
  sanitizeMetadata,
  type TransactionalWebPushJobRecord,
  WebPushDeliveryJobError
} from "@/lib/notifications/delivery-jobs-domain";

const inMemoryJobs = new Map<string, InMemoryJobState>();
const inMemoryJobIdByDedupeKey = new Map<string, string>();

export function hasWebPushDeliveryJobsDatabase(): boolean {
  return hasNotificationsDatabase();
}

export function isWebPushDeliveryJobsSchemaUnavailableError(error: unknown): boolean {
  return isNotificationsSchemaUnavailableError(error);
}

export function __resetWebPushDeliveryJobsStateForTests(): void {
  inMemoryJobs.clear();
  inMemoryJobIdByDedupeKey.clear();
}

export function __getWebPushDeliveryJobsStateForTests(): Array<{
  job: TransactionalWebPushJobRecord;
  attempts: DeliveryAttemptRecord[];
}> {
  return Array.from(inMemoryJobs.values()).map((state) => ({
    job: cloneWebPushJob(state),
    attempts: state.attempts.map((attempt) => ({ ...attempt }))
  }));
}

function assertNonEmptyJobId(jobId: string): string {
  const normalized = jobId.trim();
  if (!normalized) {
    throw new WebPushDeliveryJobError("jobId is required.", 400, "INVALID_WEB_PUSH_JOB");
  }
  return normalized;
}

export function getInMemoryWebPushJobById(jobId: string): InMemoryJobState {
  const state = inMemoryJobs.get(assertNonEmptyJobId(jobId));
  if (!state) {
    throw new WebPushDeliveryJobError("Web push delivery job was not found.", 404, "WEB_PUSH_JOB_NOT_FOUND");
  }
  return state;
}

function createOrGetJobInMemory(input: CreateTransactionalWebPushJobInput): { job: TransactionalWebPushJobRecord; inserted: boolean } {
  const normalized = normalizeCreateTransactionalWebPushJobInput(input);
  const existingId = inMemoryJobIdByDedupeKey.get(normalized.dedupeKey);

  if (existingId) {
    return {
      job: cloneWebPushJob(getInMemoryWebPushJobById(existingId)),
      inserted: false
    };
  }

  const state = buildInMemoryWebPushJob(normalized);
  inMemoryJobs.set(state.job.id, state);
  inMemoryJobIdByDedupeKey.set(state.job.dedupeKey, state.job.id);

  return {
    job: cloneWebPushJob(state),
    inserted: true
  };
}

async function createOrGetJobWithClient(
  client: PoolClient,
  input: CreateTransactionalWebPushJobInput
): Promise<{ job: TransactionalWebPushJobRecord; inserted: boolean }> {
  const normalized = normalizeCreateTransactionalWebPushJobInput(input);
  const result = await client.query(
    `
      INSERT INTO web_push_delivery_jobs (
        dedupe_key,
        notification_type,
        wallet_public_key,
        title,
        body,
        destination_url,
        metadata,
        created_by_type,
        created_by_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
      ON CONFLICT (dedupe_key) DO UPDATE
      SET dedupe_key = EXCLUDED.dedupe_key
      RETURNING *,
        (xmax = 0) AS inserted
    `,
    [
      normalized.dedupeKey,
      normalized.notificationType,
      normalized.walletPublicKey,
      normalized.title,
      normalized.body,
      normalized.destinationUrl,
      JSON.stringify(normalized.metadata ?? {}),
      normalized.createdByType,
      normalized.createdById
    ]
  );

  const row = result.rows[0];
  return {
    job: mapWebPushJobRow(row),
    inserted: Boolean(row.inserted)
  };
}

export async function createOrGetTransactionalWebPushJob(
  input: CreateTransactionalWebPushJobInput
): Promise<{ job: TransactionalWebPushJobRecord; inserted: boolean }> {
  if (!hasWebPushDeliveryJobsDatabase()) {
    return createOrGetJobInMemory(input);
  }

  try {
    return await withDbClient((client) => createOrGetJobWithClient(client, input));
  } catch (error) {
    if (isWebPushDeliveryJobsSchemaUnavailableError(error)) {
      return createOrGetJobInMemory(input);
    }
    throw error;
  }
}

export async function getWebPushJobByIdWithClient(client: PoolClient, jobId: string): Promise<TransactionalWebPushJobRecord> {
  const result = await client.query(
    `
      SELECT *
      FROM web_push_delivery_jobs
      WHERE id = $1
      LIMIT 1
    `,
    [assertNonEmptyJobId(jobId)]
  );

  if (!(result.rowCount && result.rows[0])) {
    throw new WebPushDeliveryJobError("Web push delivery job was not found.", 404, "WEB_PUSH_JOB_NOT_FOUND");
  }

  return mapWebPushJobRow(result.rows[0]);
}

export async function listAttemptedSubscriptionIdsWithClient(client: PoolClient, jobId: string): Promise<Set<string>> {
  const result = await client.query(
    `
      SELECT subscription_id
      FROM web_push_delivery_attempts
      WHERE job_id = $1
    `,
    [assertNonEmptyJobId(jobId)]
  );

  return new Set(result.rows.map((row) => String(row.subscription_id)));
}

export async function insertWebPushDeliveryAttempt(
  client: PoolClient,
  input: {
    jobId: string;
    subscriptionId: string;
    endpoint: string;
    status: DeliveryAttemptStatus;
    httpStatus: number | null;
    errorCode: string | null;
    errorMessage: string | null;
  }
): Promise<void> {
  await client.query(
    `
      INSERT INTO web_push_delivery_attempts (
        id,
        job_id,
        subscription_id,
        endpoint,
        status,
        http_status,
        error_code,
        error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (job_id, subscription_id) DO NOTHING
    `,
    [
      randomUUID(),
      input.jobId,
      input.subscriptionId,
      input.endpoint,
      input.status,
      input.httpStatus,
      input.errorCode,
      input.errorMessage
    ]
  );
}

export async function updateWebPushJobWithClient(
  client: PoolClient,
  job: TransactionalWebPushJobRecord
): Promise<TransactionalWebPushJobRecord> {
  const result = await client.query(
    `
      UPDATE web_push_delivery_jobs
      SET status = $2,
          total_subscriptions = $3,
          delivered_count = $4,
          pruned_count = $5,
          failed_count = $6,
          attempt_count = $7,
          last_error = $8,
          updated_at = $9,
          started_at = $10,
          finished_at = $11
      WHERE id = $1
      RETURNING *
    `,
    [
      job.id,
      job.status,
      job.totalSubscriptions,
      job.deliveredCount,
      job.prunedCount,
      job.failedCount,
      job.attemptCount,
      job.lastError,
      nowIso(),
      job.startedAt,
      job.finishedAt
    ]
  );

  return mapWebPushJobRow(result.rows[0]);
}

export function updateInMemoryWebPushJobState(
  state: InMemoryJobState,
  partial: Partial<TransactionalWebPushJobRecord>
): TransactionalWebPushJobRecord {
  state.job = {
    ...state.job,
    ...partial,
    metadata: sanitizeMetadata((partial.metadata as Record<string, unknown> | undefined) ?? state.job.metadata),
    updatedAt: nowIso()
  };

  return cloneWebPushJob(state);
}
