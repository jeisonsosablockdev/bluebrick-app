import { randomUUID } from "node:crypto";

import type { TransactionalNotificationType } from "@/lib/notifications/web-push-delivery";

export type WebPushDeliveryJobStatus = "queued" | "processing" | "completed" | "completed_with_failures" | "failed";

export type DeliveryActorType = "admin" | "system";

export type CreateTransactionalWebPushJobInput = {
  dedupeKey: string;
  notificationType: TransactionalNotificationType;
  walletPublicKey: string;
  title: string;
  body: string;
  destinationUrl: string | null;
  metadata?: Record<string, unknown>;
  createdByType: DeliveryActorType;
  createdById: string;
};

export type TransactionalWebPushJobRecord = {
  id: string;
  dedupeKey: string;
  notificationType: TransactionalNotificationType;
  walletPublicKey: string;
  title: string;
  body: string;
  destinationUrl: string | null;
  metadata: Record<string, unknown>;
  status: WebPushDeliveryJobStatus;
  totalSubscriptions: number;
  deliveredCount: number;
  prunedCount: number;
  failedCount: number;
  attemptCount: number;
  createdByType: DeliveryActorType;
  createdById: string;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export type ProcessTransactionalWebPushJobResult = {
  job: TransactionalWebPushJobRecord;
  processedInBatch: number;
  deliveredInBatch: number;
  prunedInBatch: number;
  failedInBatch: number;
  needsRequeue: boolean;
};

export type DeliveryAttemptStatus = "delivered" | "pruned" | "failed";

export type DeliveryAttemptRecord = {
  id: string;
  jobId: string;
  subscriptionId: string;
  endpoint: string;
  status: DeliveryAttemptStatus;
  httpStatus: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export type InMemoryJobState = {
  job: TransactionalWebPushJobRecord;
  attempts: DeliveryAttemptRecord[];
};

export class WebPushDeliveryJobError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 400, code = "WEB_PUSH_DELIVERY_ERROR") {
    super(message);
    this.name = "WebPushDeliveryJobError";
    this.status = status;
    this.code = code;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

function assertNonEmpty(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new WebPushDeliveryJobError(`${label} is required.`, 400, "INVALID_WEB_PUSH_JOB");
  }
  return trimmed;
}

function sanitizeNotificationText(value: string, label: string, maxLength: number): string {
  const cleaned = assertNonEmpty(value, label).replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (!cleaned) {
    throw new WebPushDeliveryJobError(`${label} is required.`, 400, "INVALID_WEB_PUSH_JOB");
  }
  return cleaned.slice(0, maxLength);
}

function sanitizeOptionalUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 1024) : null;
}

export function sanitizeMetadata(input: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!input) {
    return {};
  }

  const serialized = JSON.stringify(input);
  return JSON.parse(serialized) as Record<string, unknown>;
}

export function normalizeCreateTransactionalWebPushJobInput(
  input: CreateTransactionalWebPushJobInput
): CreateTransactionalWebPushJobInput {
  return {
    dedupeKey: sanitizeNotificationText(input.dedupeKey, "dedupeKey", 160),
    notificationType: input.notificationType,
    walletPublicKey: sanitizeNotificationText(input.walletPublicKey, "walletPublicKey", 80),
    title: sanitizeNotificationText(input.title, "title", 120),
    body: sanitizeNotificationText(input.body, "body", 320),
    destinationUrl: sanitizeOptionalUrl(input.destinationUrl),
    metadata: sanitizeMetadata(input.metadata),
    createdByType: input.createdByType,
    createdById: sanitizeNotificationText(input.createdById, "createdById", 120)
  };
}

export function cloneWebPushJob(state: InMemoryJobState): TransactionalWebPushJobRecord {
  return {
    ...state.job,
    metadata: sanitizeMetadata(state.job.metadata)
  };
}

export function buildInMemoryWebPushJob(input: CreateTransactionalWebPushJobInput): InMemoryJobState {
  const timestamp = nowIso();
  return {
    job: {
      id: randomUUID(),
      dedupeKey: input.dedupeKey,
      notificationType: input.notificationType,
      walletPublicKey: input.walletPublicKey,
      title: input.title,
      body: input.body,
      destinationUrl: input.destinationUrl,
      metadata: sanitizeMetadata(input.metadata),
      status: "queued",
      totalSubscriptions: 0,
      deliveredCount: 0,
      prunedCount: 0,
      failedCount: 0,
      attemptCount: 0,
      createdByType: input.createdByType,
      createdById: input.createdById,
      lastError: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      startedAt: null,
      finishedAt: null
    },
    attempts: []
  };
}

export function mapWebPushJobRow(row: Record<string, unknown>): TransactionalWebPushJobRecord {
  return {
    id: String(row.id),
    dedupeKey: String(row.dedupe_key),
    notificationType: row.notification_type as TransactionalNotificationType,
    walletPublicKey: String(row.wallet_public_key),
    title: String(row.title),
    body: String(row.body),
    destinationUrl: typeof row.destination_url === "string" ? row.destination_url : null,
    metadata: row.metadata && typeof row.metadata === "object" ? sanitizeMetadata(row.metadata as Record<string, unknown>) : {},
    status: row.status as WebPushDeliveryJobStatus,
    totalSubscriptions: Number(row.total_subscriptions ?? 0),
    deliveredCount: Number(row.delivered_count ?? 0),
    prunedCount: Number(row.pruned_count ?? 0),
    failedCount: Number(row.failed_count ?? 0),
    attemptCount: Number(row.attempt_count ?? 0),
    createdByType: row.created_by_type as DeliveryActorType,
    createdById: String(row.created_by_id),
    lastError: typeof row.last_error === "string" ? row.last_error : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    startedAt: row.started_at ? new Date(String(row.started_at)).toISOString() : null,
    finishedAt: row.finished_at ? new Date(String(row.finished_at)).toISOString() : null
  };
}
