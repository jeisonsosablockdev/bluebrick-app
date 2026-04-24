import { withDbClient } from "@/lib/db/pool";

import { deleteGcsObjectIfPresent, getGcsUploadConfig } from "@/lib/asset-uploads/gcs";

type ReconcileReason = "temporary" | "abandoned";

type ReconcileCandidateRow = {
  upload_id: string;
  object_key: string;
  reason: ReconcileReason;
};

export type ReconcileOrphanUploadsResult = {
  dryRun: boolean;
  temporaryRetentionDays: number;
  abandonedRetentionDays: number;
  limit: number;
  candidates: number;
  deleted: number;
  byReason: {
    temporary: number;
    abandoned: number;
  };
  storageDeleted: number;
  storageMissing: number;
  storageFailed: number;
  sampleUploadIds: string[];
};

type ReconcileInput = {
  dryRun: boolean;
  temporaryRetentionDays: number;
  abandonedRetentionDays: number;
  limit: number;
};

function toPositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.floor(parsed));
}

export function parseReconcileInput(body: unknown): ReconcileInput {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const dryRunRaw = record.dryRun;
  const dryRun = typeof dryRunRaw === "boolean" ? dryRunRaw : true;

  return {
    dryRun,
    temporaryRetentionDays: toPositiveInteger(
      record.temporaryRetentionDays,
      toPositiveInteger(process.env.ORPHAN_UPLOAD_TEMP_RETENTION_DAYS, 7)
    ),
    abandonedRetentionDays: toPositiveInteger(
      record.abandonedRetentionDays,
      toPositiveInteger(process.env.ORPHAN_UPLOAD_ABANDONED_RETENTION_DAYS, 30)
    ),
    limit: Math.min(500, toPositiveInteger(record.limit, 200))
  };
}

export async function reconcileOrphanedUploads(input: ReconcileInput): Promise<ReconcileOrphanUploadsResult> {
  const candidates = await withDbClient(async (client) => {
    const candidatesResult = await client.query<ReconcileCandidateRow>(
      `
        SELECT
          upload_id,
          object_key,
          CASE
            WHEN finalized_at IS NULL THEN 'temporary'
            ELSE 'abandoned'
          END::text AS reason
        FROM asset_upload_contracts
        WHERE edit_session_id IS NOT NULL
          AND promoted_at IS NULL
          AND (
            (
              finalized_at IS NULL
              AND created_at <= NOW() - ($1::text || ' days')::interval
            )
            OR
            (
              finalized_at IS NOT NULL
              AND COALESCE(canceled_at, created_at) <= NOW() - ($2::text || ' days')::interval
            )
          )
        ORDER BY COALESCE(canceled_at, created_at) ASC, created_at ASC
        LIMIT $3
      `,
      [String(input.temporaryRetentionDays), String(input.abandonedRetentionDays), input.limit]
    );

    return candidatesResult.rows;
  });

  const byReason = candidates.reduce(
    (acc, item) => {
      if (item.reason === "temporary") {
        acc.temporary += 1;
      } else {
        acc.abandoned += 1;
      }
      return acc;
    },
    { temporary: 0, abandoned: 0 }
  );

  if (input.dryRun || candidates.length === 0) {
    return {
      dryRun: input.dryRun,
      temporaryRetentionDays: input.temporaryRetentionDays,
      abandonedRetentionDays: input.abandonedRetentionDays,
      limit: input.limit,
      candidates: candidates.length,
      deleted: 0,
      byReason,
      storageDeleted: 0,
      storageMissing: 0,
      storageFailed: 0,
      sampleUploadIds: candidates.slice(0, 10).map((row) => row.upload_id)
    };
  }

  const config = getGcsUploadConfig();
  const deletableUploadIds: string[] = [];
  let storageDeleted = 0;
  let storageMissing = 0;
  let storageFailed = 0;

  for (const candidate of candidates) {
    try {
      const result = await deleteGcsObjectIfPresent(config, candidate.object_key);

      if (result.deleted) {
        storageDeleted += 1;
      } else if (result.notFound) {
        storageMissing += 1;
      }

      deletableUploadIds.push(candidate.upload_id);
    } catch {
      storageFailed += 1;
    }
  }

  let deleted = 0;
  if (deletableUploadIds.length > 0) {
    deleted = await withDbClient(async (client) => {
      const deleteResult = await client.query<{ upload_id: string }>(
        `
          DELETE FROM asset_upload_contracts
          WHERE upload_id = ANY($1::uuid[])
            AND promoted_at IS NULL
          RETURNING upload_id
        `,
        [deletableUploadIds]
      );

      return deleteResult.rowCount ?? 0;
    });
  }

  return {
    dryRun: input.dryRun,
    temporaryRetentionDays: input.temporaryRetentionDays,
    abandonedRetentionDays: input.abandonedRetentionDays,
    limit: input.limit,
    candidates: candidates.length,
    deleted,
    byReason,
    storageDeleted,
    storageMissing,
    storageFailed,
    sampleUploadIds: candidates.slice(0, 10).map((row) => row.upload_id)
  };
}
