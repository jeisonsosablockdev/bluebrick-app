import { randomUUID } from "crypto";
import type { PoolClient } from "pg";

import { withDbClient } from "@/features/shared/infrastructure/db/pool";
import type {
  MintBatchRecord,
  MintBatchStatus,
  MintItemRecord,
  MintItemSignatureRecord,
  MintJobOverview,
  MintJobRecord,
  MintJobStatus,
  SignatureConfirmationStatus,
  WebhookEventRecord
} from "@/lib/mint-jobs/types";

function assertNonEmpty(value: string, label: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }

  return trimmed;
}

function toIso(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function mapMintJobRow(row: Record<string, unknown>): MintJobRecord {
  return {
    id: String(row.id),
    emissionId: String(row.emission_id),
    idempotencyKey: String(row.idempotency_key),
    status: row.status as MintJobStatus,
    totalItems: Number(row.total_items),
    preparedItems: Number(row.prepared_items),
    submittedItems: Number(row.submitted_items),
    confirmedItems: Number(row.confirmed_items),
    failedItems: Number(row.failed_items),
    collectionAddress: row.collection_address ? String(row.collection_address) : null,
    lastError: row.last_error ? String(row.last_error) : null,
    createdAt: toIso(row.created_at as Date | string),
    updatedAt: toIso(row.updated_at as Date | string)
  };
}

function mapMintBatchRow(row: Record<string, unknown>): MintBatchRecord {
  return {
    id: String(row.id),
    jobId: String(row.job_id),
    batchNo: Number(row.batch_no),
    batchToken: String(row.batch_token),
    requestFingerprint: String(row.request_fingerprint),
    status: row.status as MintBatchStatus,
    preparedCount: Number(row.prepared_count),
    submittedCount: Number(row.submitted_count),
    confirmedCount: Number(row.confirmed_count),
    failedCount: Number(row.failed_count),
    lastError: row.last_error ? String(row.last_error) : null,
    createdAt: toIso(row.created_at as Date | string),
    updatedAt: toIso(row.updated_at as Date | string)
  };
}

function mapMintItemRow(row: Record<string, unknown>): MintItemRecord {
  return {
    id: String(row.id),
    jobId: String(row.job_id),
    batchId: row.batch_id ? String(row.batch_id) : null,
    serialNo: Number(row.serial_no),
    assetPubkey: String(row.asset_pubkey),
    status: row.status as MintItemRecord["status"],
    signature: row.signature ? String(row.signature) : null,
    lastError: row.last_error ? String(row.last_error) : null,
    submittedAt: row.submitted_at ? toIso(row.submitted_at as Date | string) : null,
    confirmedAt: row.confirmed_at ? toIso(row.confirmed_at as Date | string) : null,
    createdAt: toIso(row.created_at as Date | string),
    updatedAt: toIso(row.updated_at as Date | string)
  };
}

function mapMintItemSignatureRow(row: Record<string, unknown>): MintItemSignatureRecord {
  return {
    id: String(row.id),
    jobItemId: String(row.job_item_id),
    batchId: row.batch_id ? String(row.batch_id) : null,
    signature: String(row.signature),
    confirmationStatus: row.confirmation_status as SignatureConfirmationStatus,
    slot: row.slot === null ? null : Number(row.slot),
    firstSeenAt: toIso(row.first_seen_at as Date | string),
    lastSeenAt: toIso(row.last_seen_at as Date | string)
  };
}

function mapWebhookRow(row: Record<string, unknown>): WebhookEventRecord {
  return {
    id: String(row.id),
    provider: String(row.provider),
    eventId: row.event_id ? String(row.event_id) : null,
    eventFingerprint: String(row.event_fingerprint),
    signature: row.signature ? String(row.signature) : null,
    eventType: row.event_type ? String(row.event_type) : null,
    slot: row.slot === null ? null : Number(row.slot),
    processingStatus: row.processing_status as WebhookEventRecord["processingStatus"],
    errorMessage: row.error_message ? String(row.error_message) : null,
    receivedAt: toIso(row.received_at as Date | string),
    processedAt: row.processed_at ? toIso(row.processed_at as Date | string) : null
  };
}

type CreateMintJobInput = {
  emissionId: string;
  idempotencyKey: string;
  totalItems: number;
};

export async function createOrGetMintJob(input: CreateMintJobInput): Promise<{ job: MintJobRecord; inserted: boolean }> {
  const emissionId = assertNonEmpty(input.emissionId, "emissionId");
  const idempotencyKey = assertNonEmpty(input.idempotencyKey, "idempotencyKey");

  if (!Number.isInteger(input.totalItems) || input.totalItems <= 0) {
    throw new Error("totalItems must be a positive integer.");
  }

  return withDbClient(async (client) => {
    const result = await client.query(
      `INSERT INTO mint_jobs (id, emission_id, idempotency_key, status, total_items)
       VALUES ($1, $2, $3, 'queued', $4)
       ON CONFLICT (emission_id) DO UPDATE
       SET updated_at = NOW()
       RETURNING *, (xmax = 0) AS inserted`,
      [randomUUID(), emissionId, idempotencyKey, input.totalItems]
    );

    const row = result.rows[0] as Record<string, unknown>;
    const job = mapMintJobRow(row);

    if (job.idempotencyKey !== idempotencyKey) {
      throw new Error(`Emission ${emissionId} already exists with a different idempotency key.`);
    }

    return { job, inserted: Boolean(row.inserted) };
  });
}

type CreateMintBatchInput = {
  jobId: string;
  batchNo: number;
  batchToken: string;
  requestFingerprint: string;
  preparedCount: number;
};

export async function createOrGetMintBatch(input: CreateMintBatchInput): Promise<MintBatchRecord> {
  const jobId = assertNonEmpty(input.jobId, "jobId");
  const batchToken = assertNonEmpty(input.batchToken, "batchToken");
  const requestFingerprint = assertNonEmpty(input.requestFingerprint, "requestFingerprint");

  if (!Number.isInteger(input.batchNo) || input.batchNo <= 0) {
    throw new Error("batchNo must be a positive integer.");
  }

  if (!Number.isInteger(input.preparedCount) || input.preparedCount < 0) {
    throw new Error("preparedCount must be a non-negative integer.");
  }

  return withDbClient(async (client) => {
    const result = await client.query(
      `INSERT INTO mint_job_batches (
          id,
          job_id,
          batch_no,
          batch_token,
          request_fingerprint,
          status,
          prepared_count
       )
       VALUES ($1, $2, $3, $4, $5, 'prepared', $6)
       ON CONFLICT (job_id, batch_no) DO UPDATE
       SET updated_at = NOW()
       RETURNING *`,
      [randomUUID(), jobId, input.batchNo, batchToken, requestFingerprint, input.preparedCount]
    );

    const batch = mapMintBatchRow(result.rows[0] as Record<string, unknown>);

    if (batch.batchToken !== batchToken || batch.requestFingerprint !== requestFingerprint) {
      throw new Error(`Batch ${input.batchNo} for job ${jobId} already exists with different idempotency values.`);
    }

    return batch;
  });
}

type CreateMintItemInput = {
  jobId: string;
  batchId: string | null;
  serialNo: number;
  assetPubkey: string;
};

export async function createOrGetMintItem(input: CreateMintItemInput): Promise<MintItemRecord> {
  const jobId = assertNonEmpty(input.jobId, "jobId");
  const assetPubkey = assertNonEmpty(input.assetPubkey, "assetPubkey");
  const batchId = input.batchId ? assertNonEmpty(input.batchId, "batchId") : null;

  if (!Number.isInteger(input.serialNo) || input.serialNo <= 0) {
    throw new Error("serialNo must be a positive integer.");
  }

  return withDbClient(async (client) => {
    const result = await client.query(
      `INSERT INTO mint_job_items (id, job_id, batch_id, serial_no, asset_pubkey, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       ON CONFLICT (job_id, serial_no) DO UPDATE
       SET updated_at = NOW(),
           batch_id = COALESCE(mint_job_items.batch_id, EXCLUDED.batch_id)
       RETURNING *`,
      [randomUUID(), jobId, batchId, input.serialNo, assetPubkey]
    );

    const item = mapMintItemRow(result.rows[0] as Record<string, unknown>);

    if (item.assetPubkey !== assetPubkey) {
      throw new Error(`Job ${jobId} serial ${input.serialNo} already exists with a different asset pubkey.`);
    }

    return item;
  });
}

type UpsertItemSignatureInput = {
  jobItemId: string;
  batchId: string | null;
  signature: string;
  confirmationStatus: SignatureConfirmationStatus;
  slot?: number | null;
};

export async function upsertMintItemSignature(input: UpsertItemSignatureInput): Promise<MintItemSignatureRecord> {
  const jobItemId = assertNonEmpty(input.jobItemId, "jobItemId");
  const signature = assertNonEmpty(input.signature, "signature");
  const batchId = input.batchId ? assertNonEmpty(input.batchId, "batchId") : null;

  if (input.slot !== undefined && input.slot !== null && (!Number.isInteger(input.slot) || input.slot < 0)) {
    throw new Error("slot must be a non-negative integer.");
  }

  return withDbClient(async (client) => {
    const result = await client.query(
      `INSERT INTO mint_item_signatures (
          id,
          job_item_id,
          batch_id,
          signature,
          confirmation_status,
          slot
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (signature) DO UPDATE
       SET last_seen_at = NOW(),
           confirmation_status = EXCLUDED.confirmation_status,
           slot = COALESCE(EXCLUDED.slot, mint_item_signatures.slot)
       RETURNING *`,
      [randomUUID(), jobItemId, batchId, signature, input.confirmationStatus, input.slot ?? null]
    );

    return mapMintItemSignatureRow(result.rows[0] as Record<string, unknown>);
  });
}

type RecordWebhookEventInput = {
  provider: string;
  eventId?: string | null;
  eventFingerprint: string;
  signature?: string | null;
  eventType?: string | null;
  slot?: number | null;
  payload: unknown;
};

async function selectExistingWebhook(client: PoolClient, provider: string, eventId: string | null, eventFingerprint: string): Promise<WebhookEventRecord | null> {
  if (eventId) {
    const byEventId = await client.query(
      `SELECT *
       FROM webhook_events
       WHERE provider = $1
         AND event_id = $2
       LIMIT 1`,
      [provider, eventId]
    );

    if ((byEventId.rowCount ?? 0) > 0) {
      return mapWebhookRow(byEventId.rows[0] as Record<string, unknown>);
    }
  }

  const byFingerprint = await client.query(
    `SELECT *
     FROM webhook_events
     WHERE provider = $1
       AND event_fingerprint = $2
     LIMIT 1`,
    [provider, eventFingerprint]
  );

  if ((byFingerprint.rowCount ?? 0) === 0) {
    return null;
  }

  return mapWebhookRow(byFingerprint.rows[0] as Record<string, unknown>);
}

export async function recordWebhookEvent(input: RecordWebhookEventInput): Promise<WebhookEventRecord> {
  const provider = assertNonEmpty(input.provider, "provider");
  const eventFingerprint = assertNonEmpty(input.eventFingerprint, "eventFingerprint");
  const eventId = input.eventId ? input.eventId.trim() : null;
  const signature = input.signature ? input.signature.trim() : null;
  const eventType = input.eventType ? input.eventType.trim() : null;

  if (input.slot !== undefined && input.slot !== null && (!Number.isInteger(input.slot) || input.slot < 0)) {
    throw new Error("slot must be a non-negative integer.");
  }

  return withDbClient(async (client) => {
    try {
      const result = await client.query(
        `INSERT INTO webhook_events (
            id,
            provider,
            event_id,
            event_fingerprint,
            signature,
            event_type,
            slot,
            payload
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [randomUUID(), provider, eventId, eventFingerprint, signature, eventType, input.slot ?? null, JSON.stringify(input.payload)]
      );

      return mapWebhookRow(result.rows[0] as Record<string, unknown>);
    } catch (error) {
      const pgError = error as { code?: string };

      if (pgError.code !== "23505") {
        throw error;
      }

      const existing = await selectExistingWebhook(client, provider, eventId, eventFingerprint);

      if (!existing) {
        throw error;
      }

      return existing;
    }
  });
}

export async function getMintJobById(jobId: string): Promise<MintJobRecord | null> {
  const safeJobId = assertNonEmpty(jobId, "jobId");

  return withDbClient(async (client) => {
    const result = await client.query(
      `SELECT *
       FROM mint_jobs
       WHERE id = $1
       LIMIT 1`,
      [safeJobId]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return mapMintJobRow(result.rows[0] as Record<string, unknown>);
  });
}

export async function getMintJobOverviewById(jobId: string): Promise<MintJobOverview | null> {
  const safeJobId = assertNonEmpty(jobId, "jobId");

  return withDbClient(async (client) => {
    const result = await client.query(
      `SELECT
         j.*,
         COALESCE(b.batch_total, 0) AS batches_total,
         COALESCE(b.batch_confirming, 0) AS batches_confirming,
         COALESCE(i.items_total, 0) AS items_total,
         COALESCE(i.items_confirmed, 0) AS items_confirmed,
         COALESCE(i.items_failed, 0) AS items_failed
       FROM mint_jobs AS j
       LEFT JOIN (
         SELECT
           job_id,
           COUNT(*) AS batch_total,
           COUNT(*) FILTER (WHERE status = 'confirming') AS batch_confirming
         FROM mint_job_batches
         GROUP BY job_id
       ) AS b
         ON b.job_id = j.id
       LEFT JOIN (
         SELECT
           job_id,
           COUNT(*) AS items_total,
           COUNT(*) FILTER (WHERE status = 'confirmed') AS items_confirmed,
           COUNT(*) FILTER (WHERE status = 'failed') AS items_failed
         FROM mint_job_items
         GROUP BY job_id
       ) AS i
         ON i.job_id = j.id
       WHERE j.id = $1
       LIMIT 1`,
      [safeJobId]
    );

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0] as Record<string, unknown>;

    return {
      job: mapMintJobRow(row),
      batchesTotal: Number(row.batches_total),
      batchesConfirming: Number(row.batches_confirming),
      itemsTotal: Number(row.items_total),
      itemsConfirmed: Number(row.items_confirmed),
      itemsFailed: Number(row.items_failed)
    };
  });
}
