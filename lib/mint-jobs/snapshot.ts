import { withDbClient } from "@/lib/db/pool";

type JobStatus = "draft" | "running" | "partial" | "completed" | "failed";
type BatchStatus = "prepared" | "submitted" | "confirmed" | "failed";
type ItemStatus = "pending" | "prepared" | "submitted" | "confirmed" | "failed";

type SnapshotItem = {
  itemId: string;
  serial: number;
  status: ItemStatus;
  batchNo: number | null;
  signature: string | null;
  expectedAddress: string | null;
  lastError: string | null;
};

type SnapshotBatch = {
  batchNo: number;
  idempotencyKey: string;
  status: BatchStatus;
  itemIds: string[];
  signatures: string[];
  lastError: string | null;
};

type MintOrchestratorSnapshot = {
  jobId: string;
  status: JobStatus;
  totalItems: number;
  collectionAddress: string | null;
  lastError: string | null;
  items: SnapshotItem[];
  batches: SnapshotBatch[];
};

function mapJobStatus(status: JobStatus):
  | "queued"
  | "preparing"
  | "signing"
  | "submitting"
  | "confirming"
  | "partial"
  | "completed"
  | "failed" {
  if (status === "draft") {
    return "queued";
  }

  if (status === "running") {
    return "submitting";
  }

  return status;
}

function mapBatchStatus(status: BatchStatus): "prepared" | "submitted" | "confirming" | "confirmed" | "partial" | "failed" {
  if (status === "prepared" || status === "submitted" || status === "confirmed" || status === "failed") {
    return status;
  }

  return "failed";
}

function mapItemStatus(status: ItemStatus): ItemStatus {
  return status;
}

export async function syncMintOrchestratorSnapshot(snapshot: MintOrchestratorSnapshot): Promise<void> {
  await withDbClient(async (client) => {
    const preparedItems = snapshot.items.filter((item) => item.status === "prepared").length;
    const submittedItems = snapshot.items.filter((item) => item.status === "submitted").length;
    const confirmedItems = snapshot.items.filter((item) => item.status === "confirmed").length;
    const failedItems = snapshot.items.filter((item) => item.status === "failed").length;
    const now = new Date().toISOString();

    await client.query("BEGIN");

    try {
      await client.query(
        `INSERT INTO mint_jobs (
           id,
           emission_id,
           idempotency_key,
           status,
           total_items,
           prepared_items,
           submitted_items,
           confirmed_items,
           failed_items,
           collection_address,
           last_error
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE
         SET status = EXCLUDED.status,
             total_items = EXCLUDED.total_items,
             prepared_items = EXCLUDED.prepared_items,
             submitted_items = EXCLUDED.submitted_items,
             confirmed_items = EXCLUDED.confirmed_items,
             failed_items = EXCLUDED.failed_items,
             collection_address = EXCLUDED.collection_address,
             last_error = EXCLUDED.last_error,
             updated_at = NOW()`,
        [
          snapshot.jobId,
          snapshot.jobId,
          `mint-orchestrator:${snapshot.jobId}`,
          mapJobStatus(snapshot.status),
          snapshot.totalItems,
          preparedItems,
          submittedItems,
          confirmedItems,
          failedItems,
          snapshot.collectionAddress,
          snapshot.lastError
        ]
      );

      for (const batch of snapshot.batches) {
        const preparedCount = batch.itemIds.length;
        const submittedCount = batch.signatures.length;
        const confirmedCount = snapshot.items.filter((item) => batch.itemIds.includes(item.itemId) && item.status === "confirmed").length;
        const failedCount = snapshot.items.filter((item) => batch.itemIds.includes(item.itemId) && item.status === "failed").length;

        await client.query(
          `INSERT INTO mint_job_batches (
             id,
             job_id,
             batch_no,
             batch_token,
             request_fingerprint,
             status,
             prepared_count,
             submitted_count,
             confirmed_count,
             failed_count,
             last_error
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (job_id, batch_no) DO UPDATE
           SET batch_token = EXCLUDED.batch_token,
               request_fingerprint = EXCLUDED.request_fingerprint,
               status = EXCLUDED.status,
               prepared_count = EXCLUDED.prepared_count,
               submitted_count = EXCLUDED.submitted_count,
               confirmed_count = EXCLUDED.confirmed_count,
               failed_count = EXCLUDED.failed_count,
               last_error = EXCLUDED.last_error,
               updated_at = NOW()`,
          [
            `${snapshot.jobId}:${batch.batchNo}`,
            snapshot.jobId,
            batch.batchNo,
            batch.idempotencyKey,
            `mint-orchestrator:${snapshot.jobId}:${batch.batchNo}`,
            mapBatchStatus(batch.status),
            preparedCount,
            submittedCount,
            confirmedCount,
            failedCount,
            batch.lastError
          ]
        );
      }

      for (const item of snapshot.items) {
        const batchId = item.batchNo ? `${snapshot.jobId}:${item.batchNo}` : null;
        const assetPubkey = item.expectedAddress ?? `pending-${item.itemId}`;
        const submittedAt = item.status === "submitted" || item.status === "confirmed" || item.status === "failed" ? now : null;
        const confirmedAt = item.status === "confirmed" ? now : null;

        const itemResult = await client.query(
          `INSERT INTO mint_job_items (
             id,
             job_id,
             batch_id,
             serial_no,
             asset_pubkey,
             status,
             signature,
             last_error,
             submitted_at,
             confirmed_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (job_id, serial_no) DO UPDATE
           SET batch_id = EXCLUDED.batch_id,
               asset_pubkey = EXCLUDED.asset_pubkey,
               status = EXCLUDED.status,
               signature = EXCLUDED.signature,
               last_error = EXCLUDED.last_error,
               submitted_at = COALESCE(EXCLUDED.submitted_at, mint_job_items.submitted_at),
               confirmed_at = COALESCE(EXCLUDED.confirmed_at, mint_job_items.confirmed_at),
               updated_at = NOW()
           RETURNING id`,
          [
            item.itemId,
            snapshot.jobId,
            batchId,
            item.serial,
            assetPubkey,
            mapItemStatus(item.status),
            item.signature,
            item.lastError,
            submittedAt,
            confirmedAt
          ]
        );

        if (item.signature) {
          const persistedItemId = String(itemResult.rows[0]?.id ?? item.itemId);
          const confirmationStatus = item.status === "confirmed"
            ? "confirmed"
            : item.status === "failed"
              ? "failed"
              : "submitted";

          await client.query(
            `INSERT INTO mint_item_signatures (
               id,
               job_item_id,
               batch_id,
               signature,
               confirmation_status
             )
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (signature) DO UPDATE
             SET job_item_id = EXCLUDED.job_item_id,
                 batch_id = EXCLUDED.batch_id,
                 confirmation_status = EXCLUDED.confirmation_status,
                 last_seen_at = NOW()`,
            [
              `${snapshot.jobId}:${item.itemId}:${item.signature}`,
              persistedItemId,
              batchId,
              item.signature,
              confirmationStatus
            ]
          );
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}
