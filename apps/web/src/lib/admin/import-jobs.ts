import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";

import {
  importKeyAliasMap,
  mapImportRowToFormFields,
  normalizeHeaderKey,
  parseTabularText
} from "@/lib/admin/asset-form";
import {
  parseCollectionName,
  parseCollectionSymbol,
  parseExitStrategy
} from "@/lib/admin/asset-compatibility-validation";
import { withDbClient } from "@/lib/db/pool";

const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;
const MAX_IMPORT_ROWS = 10_000;
const CREATE_RATE_LIMIT_PER_MINUTE = 5;
const PROCESS_BATCH_SIZE = 100;
const ERROR_REPORT_PAGE_SIZE_MAX = 200;

const ALLOWED_IMPORT_MIME_TYPES = new Set<string>([
  "text/csv",
  "text/plain",
  "text/tab-separated-values",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

export type ImportJobState =
  | "queued"
  | "processing"
  | "completed"
  | "completed_with_errors"
  | "failed"
  | "delayed";

export type ImportJobOverview = {
  id: string;
  actorPubkey: string;
  draftId: string | null;
  idempotencyKey: string | null;
  sourceFileName: string;
  sourceMimeType: string;
  sourceSizeBytes: number;
  state: ImportJobState;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  warningsCount: number;
  attemptCount: number;
  maxAttempts: number;
  lastError: string | null;
  errorReportUrl: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  lastTransitionAt: string;
};

export type ImportJobError = {
  id: string;
  jobId: string;
  rowNumber: number | null;
  columnName: string | null;
  errorCode: string;
  errorMessage: string;
  createdAt: string;
};

type ImportJobRow = {
  id: string;
  actor_pubkey: string;
  draft_id: string | null;
  idempotency_key: string | null;
  source_file_name: string;
  source_mime_type: string;
  source_size_bytes: string;
  state: ImportJobState;
  total_rows: number;
  processed_rows: number;
  failed_rows: number;
  warnings_count: number;
  attempt_count: number;
  max_attempts: number;
  last_error: string | null;
  error_report_url: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  started_at: Date | string | null;
  finished_at: Date | string | null;
  last_transition_at: Date | string;
};

type ImportJobErrorRow = {
  id: string;
  job_id: string;
  row_number: number | null;
  column_name: string | null;
  error_code: string;
  error_message: string;
  created_at: Date | string;
};

type ImportJobRowRecord = {
  id: number;
  row_number: number;
  row_data: Record<string, string>;
};

type CreateImportJobInput = {
  actorPubkey: string;
  draftId: string | null;
  idempotencyKey: string | null;
  sourceFileName: string;
  sourceMimeType: string;
  sourceSizeBytes: number;
  rows: Array<Record<string, string>>;
};

type ImportValidationError = {
  columnName: string | null;
  errorCode: string;
  errorMessage: string;
};

export class ImportJobInputError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 400, code = "INVALID_IMPORT_REQUEST") {
    super(message);
    this.name = "ImportJobInputError";
    this.status = status;
    this.code = code;
  }
}

function assertNonEmpty(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new ImportJobInputError(`${label} is required.`, 400, "INVALID_IMPORT_REQUEST");
  }
  return trimmed;
}

function toIso(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date(value).toISOString();
}

function sanitizeErrorText(value: string, maxLength = 280): string {
  return value
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function sanitizeCell(value: string): string {
  const noControlChars = value.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "");
  const trimmed = noControlChars.trim();
  const prefixDanger = /^[=+\-@]/;

  if (prefixDanger.test(trimmed)) {
    return `'${trimmed}`;
  }

  return trimmed.slice(0, 2000);
}

function sanitizeRowData(rowData: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(rowData)) {
    sanitized[key] = sanitizeCell(value);
  }

  return sanitized;
}

function mapImportJobRow(row: ImportJobRow): ImportJobOverview {
  return {
    id: row.id,
    actorPubkey: row.actor_pubkey,
    draftId: row.draft_id,
    idempotencyKey: row.idempotency_key,
    sourceFileName: row.source_file_name,
    sourceMimeType: row.source_mime_type,
    sourceSizeBytes: Number(row.source_size_bytes),
    state: row.state,
    totalRows: row.total_rows,
    processedRows: row.processed_rows,
    failedRows: row.failed_rows,
    warningsCount: row.warnings_count,
    attemptCount: row.attempt_count,
    maxAttempts: row.max_attempts,
    lastError: row.last_error,
    errorReportUrl: row.error_report_url,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    startedAt: row.started_at ? toIso(row.started_at) : null,
    finishedAt: row.finished_at ? toIso(row.finished_at) : null,
    lastTransitionAt: toIso(row.last_transition_at)
  };
}

function mapImportJobErrorRow(row: ImportJobErrorRow): ImportJobError {
  return {
    id: row.id,
    jobId: row.job_id,
    rowNumber: row.row_number,
    columnName: row.column_name,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    createdAt: toIso(row.created_at)
  };
}

function isAllowedMimeType(value: string): boolean {
  return ALLOWED_IMPORT_MIME_TYPES.has(value.trim().toLowerCase());
}

function canonicalHeaderKey(rawHeader: string): string {
  const normalized = normalizeHeaderKey(rawHeader);
  const mapped = importKeyAliasMap[normalized] ?? rawHeader.trim();
  return mapped.trim().toLowerCase();
}

export function detectHeaderAliasCollisions(headers: string[]): string[] {
  const canonicalToHeader = new Map<string, string>();
  const collisions: string[] = [];

  for (const header of headers) {
    const canonical = canonicalHeaderKey(header);
    const existing = canonicalToHeader.get(canonical);

    if (existing && existing !== header) {
      collisions.push(`${existing} <> ${header} => ${canonical}`);
      continue;
    }

    canonicalToHeader.set(canonical, header);
  }

  return collisions;
}

export function parseAndSanitizeImportRows(input: {
  sourceMimeType: string;
  sourceSizeBytes: number;
  content: string;
}): Array<Record<string, string>> {
  if (!isAllowedMimeType(input.sourceMimeType)) {
    throw new ImportJobInputError(
      `Unsupported MIME type: ${input.sourceMimeType}.`,
      415,
      "UNSUPPORTED_IMPORT_MIME"
    );
  }

  if (!Number.isInteger(input.sourceSizeBytes) || input.sourceSizeBytes <= 0) {
    throw new ImportJobInputError("sourceSizeBytes must be a positive integer.");
  }

  if (input.sourceSizeBytes > MAX_IMPORT_FILE_BYTES) {
    throw new ImportJobInputError(
      `CSV file exceeds max size (${MAX_IMPORT_FILE_BYTES} bytes).`,
      413,
      "IMPORT_FILE_TOO_LARGE"
    );
  }

  const parsed = parseTabularText(input.content);

  if (parsed.headers.length === 0) {
    throw new ImportJobInputError("CSV header row is required.");
  }

  const headerCollisions = detectHeaderAliasCollisions(parsed.headers);
  if (headerCollisions.length > 0) {
    throw new ImportJobInputError(
      `Header alias collision detected: ${headerCollisions[0]}.`,
      422,
      "HEADER_ALIAS_COLLISION"
    );
  }

  if (parsed.rows.length === 0) {
    throw new ImportJobInputError("CSV has no data rows.");
  }

  if (parsed.rows.length > MAX_IMPORT_ROWS) {
    throw new ImportJobInputError(
      `CSV exceeds max rows (${MAX_IMPORT_ROWS}).`,
      413,
      "IMPORT_ROWS_TOO_LARGE"
    );
  }

  return parsed.rows
    .map((row) => mapImportRowToFormFields(row))
    .map((row) => sanitizeRowData(row));
}

export function validateImportRow(rowData: Record<string, string>): ImportValidationError[] {
  const errors: ImportValidationError[] = [];

  const requiredFields = [
    "assetName",
    "slug",
    "internalCode",
    "country",
    "city"
  ] as const;

  for (const field of requiredFields) {
    if (!rowData[field] || !rowData[field].trim()) {
      errors.push({
        columnName: field,
        errorCode: "REQUIRED_FIELD",
        errorMessage: `${field} is required.`
      });
    }
  }

  if (rowData.collectionName) {
    const collectionName = parseCollectionName(rowData.collectionName);
    if (!collectionName.ok) {
      errors.push({
        columnName: "collectionName",
        errorCode: "COLLECTION_NAME_INVALID",
        errorMessage: collectionName.errors[0] || "collectionName is invalid."
      });
    }
  }

  if (rowData.collectionSymbol) {
    const collectionSymbol = parseCollectionSymbol(rowData.collectionSymbol);
    if (!collectionSymbol.ok) {
      errors.push({
        columnName: "collectionSymbol",
        errorCode: "COLLECTION_SYMBOL_INVALID",
        errorMessage: collectionSymbol.errors[0] || "collectionSymbol is invalid."
      });
    }
  }

  const exitStrategy = rowData.buildingExitStrategy || rowData.landExitStrategy;
  if (exitStrategy) {
    const parsedExitStrategy = parseExitStrategy(exitStrategy);
    if (!parsedExitStrategy.ok) {
      errors.push({
        columnName: rowData.buildingExitStrategy ? "buildingExitStrategy" : "landExitStrategy",
        errorCode: "EXIT_STRATEGY_INVALID",
        errorMessage: parsedExitStrategy.errors[0] || "exitStrategy is invalid."
      });
    }
  }

  return errors;
}

async function getExistingJobByIdempotency(
  client: PoolClient,
  actorPubkey: string,
  idempotencyKey: string
): Promise<ImportJobOverview | null> {
  const result = await client.query<ImportJobRow>(
    `
      SELECT *
      FROM asset_import_jobs
      WHERE actor_pubkey = $1
        AND idempotency_key = $2
      LIMIT 1
    `,
    [actorPubkey, idempotencyKey]
  );

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  return mapImportJobRow(result.rows[0]);
}

export async function countRecentImportJobs(actorPubkey: string): Promise<number> {
  const actor = assertNonEmpty(actorPubkey, "actorPubkey");

  return withDbClient(async (client) => {
    const result = await client.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM asset_import_jobs
        WHERE actor_pubkey = $1
          AND created_at >= NOW() - INTERVAL '1 minute'
      `,
      [actor]
    );

    return Number(result.rows[0]?.count ?? 0);
  });
}

export async function assertCreateImportRateLimit(actorPubkey: string): Promise<void> {
  const count = await countRecentImportJobs(actorPubkey);
  if (count >= CREATE_RATE_LIMIT_PER_MINUTE) {
    throw new ImportJobInputError(
      `Rate limit exceeded. Max ${CREATE_RATE_LIMIT_PER_MINUTE} import jobs per minute.`,
      429,
      "IMPORT_RATE_LIMITED"
    );
  }
}

export async function createImportJob(input: CreateImportJobInput): Promise<{ job: ImportJobOverview; inserted: boolean }> {
  const actorPubkey = assertNonEmpty(input.actorPubkey, "actorPubkey");
  const sourceFileName = assertNonEmpty(input.sourceFileName, "sourceFileName");
  const sourceMimeType = assertNonEmpty(input.sourceMimeType, "sourceMimeType").toLowerCase();
  const sourceSizeBytes = input.sourceSizeBytes;

  if (!Number.isInteger(sourceSizeBytes) || sourceSizeBytes <= 0) {
    throw new ImportJobInputError("sourceSizeBytes must be a positive integer.");
  }

  if (input.rows.length === 0) {
    throw new ImportJobInputError("rows cannot be empty.");
  }

  return withDbClient(async (client) => {
    await client.query("BEGIN");

    try {
      if (input.idempotencyKey) {
        const existing = await getExistingJobByIdempotency(client, actorPubkey, input.idempotencyKey);
        if (existing) {
          await client.query("COMMIT");
          return { job: existing, inserted: false };
        }
      }

      const jobId = randomUUID();
      const errorReportUrl = `/api/admin/assets/import-jobs/${jobId}/errors`;

      const jobResult = await client.query<ImportJobRow>(
        `
          INSERT INTO asset_import_jobs (
            id,
            actor_pubkey,
            draft_id,
            idempotency_key,
            source_file_name,
            source_mime_type,
            source_size_bytes,
            state,
            total_rows,
            error_report_url
          )
          VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6, $7, 'queued', $8, $9)
          RETURNING *
        `,
        [
          jobId,
          actorPubkey,
          input.draftId,
          input.idempotencyKey,
          sourceFileName,
          sourceMimeType,
          sourceSizeBytes,
          input.rows.length,
          errorReportUrl
        ]
      );

      const job = mapImportJobRow(jobResult.rows[0]);

      for (let index = 0; index < input.rows.length; index += 1) {
        const rowNumber = index + 1;
        const rowData = input.rows[index] ?? {};

        await client.query(
          `
            INSERT INTO asset_import_job_rows (
              job_id,
              row_number,
              row_data
            )
            VALUES ($1::uuid, $2, $3::jsonb)
          `,
          [job.id, rowNumber, JSON.stringify(rowData)]
        );
      }

      await client.query("COMMIT");
      return { job, inserted: true };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function getImportJobForActor(jobId: string, actorPubkey: string): Promise<ImportJobOverview | null> {
  return withDbClient(async (client) => {
    const result = await client.query<ImportJobRow>(
      `
        SELECT *
        FROM asset_import_jobs
        WHERE id = $1::uuid
          AND actor_pubkey = $2
        LIMIT 1
      `,
      [jobId, actorPubkey]
    );

    if ((result.rowCount ?? 0) === 0) {
      return null;
    }

    return mapImportJobRow(result.rows[0]);
  });
}

export async function listImportJobErrors(
  jobId: string,
  limit = 100,
  offset = 0
): Promise<ImportJobError[]> {
  const safeLimit = Math.max(1, Math.min(ERROR_REPORT_PAGE_SIZE_MAX, Math.floor(limit)));
  const safeOffset = Math.max(0, Math.floor(offset));

  return withDbClient(async (client) => {
    const result = await client.query<ImportJobErrorRow>(
      `
        SELECT *
        FROM asset_import_job_errors
        WHERE job_id = $1::uuid
        ORDER BY row_number ASC NULLS LAST, created_at ASC
        LIMIT $2
        OFFSET $3
      `,
      [jobId, safeLimit, safeOffset]
    );

    return result.rows.map((row) => mapImportJobErrorRow(row));
  });
}

export async function markImportJobDelayed(jobId: string, reason: string): Promise<void> {
  await withDbClient(async (client) => {
    await client.query(
      `
        UPDATE asset_import_jobs
        SET
          state = 'delayed',
          last_error = $2,
          last_transition_at = NOW(),
          updated_at = NOW()
        WHERE id = $1::uuid
          AND state IN ('queued', 'processing')
      `,
      [jobId, sanitizeErrorText(reason)]
    );
  });
}

function isTerminalState(state: ImportJobState): boolean {
  return state === "completed" || state === "completed_with_errors" || state === "failed";
}

async function insertImportError(
  client: PoolClient,
  input: {
    jobId: string;
    rowNumber: number | null;
    columnName: string | null;
    errorCode: string;
    errorMessage: string;
  }
): Promise<void> {
  await client.query(
    `
      INSERT INTO asset_import_job_errors (
        id,
        job_id,
        row_number,
        column_name,
        error_code,
        error_message
      )
      VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6)
    `,
    [
      randomUUID(),
      input.jobId,
      input.rowNumber,
      input.columnName,
      sanitizeErrorText(input.errorCode, 80),
      sanitizeErrorText(input.errorMessage, 400)
    ]
  );
}

async function finalizeImportJob(
  client: PoolClient,
  jobId: string
): Promise<ImportJobOverview> {
  const failedRowsResult = await client.query<{ failed_rows: number }>(
    `
      SELECT failed_rows
      FROM asset_import_jobs
      WHERE id = $1::uuid
      LIMIT 1
    `,
    [jobId]
  );

  const failedRows = failedRowsResult.rows[0]?.failed_rows ?? 0;
  const nextState: ImportJobState = failedRows > 0 ? "completed_with_errors" : "completed";

  if (failedRows === 0) {
    await client.query(
      `
        UPDATE asset_import_job_rows
        SET validation_status = 'committed'
        WHERE job_id = $1::uuid
          AND validation_status = 'valid'
      `,
      [jobId]
    );
  }

  const updateResult = await client.query<ImportJobRow>(
    `
      UPDATE asset_import_jobs
      SET
        state = $2,
        finished_at = NOW(),
        last_transition_at = NOW(),
        updated_at = NOW()
      WHERE id = $1::uuid
        AND state = 'processing'
      RETURNING *
    `,
    [jobId, nextState]
  );

  if ((updateResult.rowCount ?? 0) === 0) {
    const fallbackResult = await client.query<ImportJobRow>(
      `SELECT * FROM asset_import_jobs WHERE id = $1::uuid LIMIT 1`,
      [jobId]
    );

    return mapImportJobRow(fallbackResult.rows[0]);
  }

  return mapImportJobRow(updateResult.rows[0]);
}

export async function processImportJobBatch(
  jobId: string,
  batchSize = PROCESS_BATCH_SIZE
): Promise<{ job: ImportJobOverview; processedInBatch: number; failedInBatch: number; needsRequeue: boolean }> {
  return withDbClient(async (client) => {
    await client.query("BEGIN");

    try {
      const jobResult = await client.query<ImportJobRow>(
        `
          SELECT *
          FROM asset_import_jobs
          WHERE id = $1::uuid
          FOR UPDATE
        `,
        [jobId]
      );

      if ((jobResult.rowCount ?? 0) === 0) {
        throw new ImportJobInputError("Import job not found.", 404, "IMPORT_JOB_NOT_FOUND");
      }

      let job = mapImportJobRow(jobResult.rows[0]);

      if (isTerminalState(job.state)) {
        await client.query("COMMIT");
        return {
          job,
          processedInBatch: 0,
          failedInBatch: 0,
          needsRequeue: false
        };
      }

      if (job.state === "queued" || job.state === "delayed") {
        const transition = await client.query<ImportJobRow>(
          `
            UPDATE asset_import_jobs
            SET
              state = 'processing',
              started_at = COALESCE(started_at, NOW()),
              last_transition_at = NOW(),
              updated_at = NOW()
            WHERE id = $1::uuid
              AND state IN ('queued', 'delayed')
            RETURNING *
          `,
          [jobId]
        );

        if ((transition.rowCount ?? 0) > 0) {
          job = mapImportJobRow(transition.rows[0]);
        }
      }

      if (job.state !== "processing") {
        await client.query("COMMIT");
        return {
          job,
          processedInBatch: 0,
          failedInBatch: 0,
          needsRequeue: false
        };
      }

      const rowsResult = await client.query<ImportJobRowRecord>(
        `
          SELECT id, row_number, row_data
          FROM asset_import_job_rows
          WHERE job_id = $1::uuid
            AND validation_status = 'pending'
          ORDER BY row_number ASC
          LIMIT $2
          FOR UPDATE SKIP LOCKED
        `,
        [jobId, Math.max(1, Math.floor(batchSize))]
      );

      let processedInBatch = 0;
      let failedInBatch = 0;

      for (const row of rowsResult.rows) {
        const rowValidationErrors = validateImportRow(row.row_data ?? {});
        const hasErrors = rowValidationErrors.length > 0;

        await client.query(
          `
            UPDATE asset_import_job_rows
            SET
              validation_status = $3,
              processed_at = NOW()
            WHERE id = $1
              AND job_id = $2::uuid
          `,
          [row.id, jobId, hasErrors ? "invalid" : "valid"]
        );

        processedInBatch += 1;

        if (hasErrors) {
          failedInBatch += 1;
          for (const validationError of rowValidationErrors) {
            await insertImportError(client, {
              jobId,
              rowNumber: row.row_number,
              columnName: validationError.columnName,
              errorCode: validationError.errorCode,
              errorMessage: validationError.errorMessage
            });
          }
        }
      }

      if (processedInBatch > 0) {
        await client.query(
          `
            UPDATE asset_import_jobs
            SET
              processed_rows = processed_rows + $2,
              failed_rows = failed_rows + $3,
              last_transition_at = NOW(),
              updated_at = NOW()
            WHERE id = $1::uuid
              AND state = 'processing'
          `,
          [jobId, processedInBatch, failedInBatch]
        );
      }

      const pendingRowsResult = await client.query<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM asset_import_job_rows
          WHERE job_id = $1::uuid
            AND validation_status = 'pending'
        `,
        [jobId]
      );

      const pendingRows = Number(pendingRowsResult.rows[0]?.count ?? 0);

      if (pendingRows === 0) {
        job = await finalizeImportJob(client, jobId);
      } else {
        const refreshed = await client.query<ImportJobRow>(
          `SELECT * FROM asset_import_jobs WHERE id = $1::uuid LIMIT 1`,
          [jobId]
        );
        job = mapImportJobRow(refreshed.rows[0]);
      }

      await client.query("COMMIT");

      return {
        job,
        processedInBatch,
        failedInBatch,
        needsRequeue: pendingRows > 0
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function registerImportJobProcessingFailure(
  jobId: string,
  reason: string,
  payload: unknown
): Promise<{ failedPermanently: boolean; attemptCount: number; maxAttempts: number; state: ImportJobState } | null> {
  return withDbClient(async (client) => {
    await client.query("BEGIN");

    try {
      const jobResult = await client.query<ImportJobRow>(
        `
          SELECT *
          FROM asset_import_jobs
          WHERE id = $1::uuid
          FOR UPDATE
        `,
        [jobId]
      );

      if ((jobResult.rowCount ?? 0) === 0) {
        await client.query("COMMIT");
        return null;
      }

      const job = mapImportJobRow(jobResult.rows[0]);

      if (isTerminalState(job.state)) {
        await client.query("COMMIT");
        return {
          failedPermanently: true,
          attemptCount: job.attemptCount,
          maxAttempts: job.maxAttempts,
          state: job.state
        };
      }

      const nextAttempt = job.attemptCount + 1;
      const failedPermanently = nextAttempt >= job.maxAttempts;
      const nextState: ImportJobState = failedPermanently ? "failed" : "queued";

      const updateResult = await client.query<ImportJobRow>(
        `
          UPDATE asset_import_jobs
          SET
            state = $2,
            attempt_count = $3,
            last_error = $4,
            finished_at = CASE WHEN $2 = 'failed' THEN NOW() ELSE finished_at END,
            last_transition_at = NOW(),
            updated_at = NOW()
          WHERE id = $1::uuid
            AND state IN ('queued', 'processing', 'delayed')
          RETURNING *
        `,
        [jobId, nextState, nextAttempt, sanitizeErrorText(reason, 400)]
      );

      const updated = mapImportJobRow(updateResult.rows[0]);

      if (failedPermanently) {
        await client.query(
          `
            INSERT INTO asset_import_job_dlq (
              id,
              job_id,
              attempt_count,
              reason,
              payload
            )
            VALUES ($1::uuid, $2::uuid, $3, $4, $5::jsonb)
          `,
          [randomUUID(), jobId, nextAttempt, sanitizeErrorText(reason, 400), JSON.stringify(payload ?? {})]
        );

        await insertImportError(client, {
          jobId,
          rowNumber: null,
          columnName: null,
          errorCode: "POISON_PILL",
          errorMessage: `Job moved to DLQ after ${nextAttempt} attempts: ${reason}`
        });
      }

      await client.query("COMMIT");

      return {
        failedPermanently,
        attemptCount: updated.attemptCount,
        maxAttempts: updated.maxAttempts,
        state: updated.state
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

type QstashConfig = {
  token: string;
  baseUrl: string;
  processUrl: string;
  workerToken: string | null;
};

function getQstashConfig(): QstashConfig {
  const token = process.env.QSTASH_TOKEN?.trim();
  const baseUrl = (process.env.QSTASH_BASE_URL?.trim() || "https://qstash.upstash.io").replace(/\/+$/, "");
  const processUrlFromEnv = process.env.QSTASH_IMPORT_PROCESS_URL?.trim();
  const appBaseUrl = process.env.APP_BASE_URL?.trim()?.replace(/\/+$/, "");
  const processUrl = processUrlFromEnv || (appBaseUrl ? `${appBaseUrl}/api/admin/assets/import-jobs/process` : "");
  const workerToken = process.env.IMPORT_WORKER_TOKEN?.trim() || null;

  if (!token) {
    throw new ImportJobInputError("QSTASH_TOKEN is required for async import queue.", 500, "QSTASH_CONFIG_MISSING");
  }

  if (!processUrl) {
    throw new ImportJobInputError(
      "QSTASH_IMPORT_PROCESS_URL or APP_BASE_URL is required for async import queue.",
      500,
      "QSTASH_CONFIG_MISSING"
    );
  }

  return {
    token,
    baseUrl,
    processUrl,
    workerToken
  };
}

export async function enqueueImportJob(jobId: string): Promise<void> {
  const config = getQstashConfig();
  const endpoint = `${config.baseUrl}/v2/publish/${encodeURIComponent(config.processUrl)}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.token}`,
    "Content-Type": "application/json",
    "Upstash-Method": "POST"
  };

  if (config.workerToken) {
    headers["Upstash-Forward-x-import-worker-token"] = config.workerToken;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ jobId })
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    throw new ImportJobInputError(
      `Could not enqueue import job: ${response.status} ${payload}`,
      500,
      "QSTASH_ENQUEUE_FAILED"
    );
  }
}

export function isImportWorkerRequest(workerTokenFromRequest: string | null): boolean {
  const expectedToken = process.env.IMPORT_WORKER_TOKEN?.trim();
  if (!expectedToken) {
    return false;
  }

  return workerTokenFromRequest === expectedToken;
}
