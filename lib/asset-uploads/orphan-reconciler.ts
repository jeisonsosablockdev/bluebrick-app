import { withDbClient } from "@/lib/db/pool";

type ReconcileReason = "temporary" | "abandoned";

type ReconcileCandidateRow = {
  upload_id: string;
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
  return withDbClient(async (client) => {
    await client.query("BEGIN");

    try {
      const candidatesResult = await client.query<ReconcileCandidateRow>(
        `
          SELECT
            upload_id,
            CASE
              WHEN finalized_at IS NULL THEN 'temporary'
              ELSE 'abandoned'
            END::text AS reason
          FROM asset_upload_contracts
          WHERE
            (
              finalized_at IS NULL
              AND created_at <= NOW() - ($1::text || ' days')::interval
            )
            OR
            (
              finalized_at IS NOT NULL
              AND created_at <= NOW() - ($2::text || ' days')::interval
            )
          ORDER BY created_at ASC
          LIMIT $3
          FOR UPDATE
        `,
        [String(input.temporaryRetentionDays), String(input.abandonedRetentionDays), input.limit]
      );

      const candidates = candidatesResult.rows;
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

      let deleted = 0;

      if (!input.dryRun && candidates.length > 0) {
        const uploadIds = candidates.map((row) => row.upload_id);
        const deleteResult = await client.query<{ upload_id: string }>(
          `
            DELETE FROM asset_upload_contracts
            WHERE upload_id = ANY($1::uuid[])
            RETURNING upload_id
          `,
          [uploadIds]
        );
        deleted = deleteResult.rowCount ?? 0;
      }

      await client.query("COMMIT");

      return {
        dryRun: input.dryRun,
        temporaryRetentionDays: input.temporaryRetentionDays,
        abandonedRetentionDays: input.abandonedRetentionDays,
        limit: input.limit,
        candidates: candidates.length,
        deleted,
        byReason,
        sampleUploadIds: candidates.slice(0, 10).map((row) => row.upload_id)
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}
