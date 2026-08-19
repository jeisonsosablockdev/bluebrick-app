import { randomUUID } from "node:crypto";

import { withDbClient } from "@/features/shared/infrastructure/db/pool";
import {
  type AssetUploadCategory,
  type SignedUploadContract,
  type UploadedFileRef,
  type UploadedFileRefWithCategory
} from "./types.ts";

type SignedUploadContractRow = {
  upload_id: string;
  actor_pubkey: string;
  draft_id: string;
  edit_session_id: string | null;
  category: AssetUploadCategory;
  original_file_name: string;
  sanitized_file_name: string;
  object_key: string;
  bucket: string;
  mime_type: string;
  size_bytes: string;
  content_md5_base64: string;
  expires_at: string;
  created_at: string;
  finalized_at: string | null;
  final_file_ref_id: string | null;
  promoted_at: string | null;
  promoted_by: string | null;
  canceled_at: string | null;
  canceled_by: string | null;
};

type UploadedFileRefRow = {
  file_ref_id: string;
  upload_id: string;
  actor_pubkey: string;
  draft_id: string;
  bucket: string;
  object_key: string;
  cdn_url: string;
  mime_type: string;
  size_bytes: string;
  content_md5_base64: string;
  etag: string | null;
  uploaded_at: string;
  created_at: string;
};

type UploadedFileRefWithCategoryRow = UploadedFileRefRow & {
  category: AssetUploadCategory;
};

type CreateSignedUploadContractInput = {
  uploadId: string;
  actorPubkey: string;
  draftId: string;
  editSessionId: string | null;
  category: AssetUploadCategory;
  originalFileName: string;
  sanitizedFileName: string;
  objectKey: string;
  bucket: string;
  mimeType: string;
  sizeBytes: number;
  contentMd5Base64: string;
  expiresAt: string;
};

type FinalizeUploadInput = {
  uploadId: string;
  actorPubkey: string;
  draftId: string;
  bucket: string;
  objectKey: string;
  cdnUrl: string;
  mimeType: string;
  sizeBytes: number;
  contentMd5Base64: string;
  etag: string | null;
  uploadedAt: string;
};

export type EditSessionUploadLifecycleState = "temporary" | "finalized" | "promoted" | "canceled";

type EditSessionUploadRow = UploadedFileRefWithCategoryRow & {
  edit_session_id: string;
  finalized_at: string | null;
  promoted_at: string | null;
  promoted_by: string | null;
  canceled_at: string | null;
  canceled_by: string | null;
};

export type EditSessionUploadRecord = UploadedFileRefWithCategory & {
  editSessionId: string;
  lifecycleState: EditSessionUploadLifecycleState;
  promotedAt: string | null;
  promotedBy: string | null;
  canceledAt: string | null;
  canceledBy: string | null;
};

function toSignedUploadContract(row: SignedUploadContractRow): SignedUploadContract {
  return {
    uploadId: row.upload_id,
    actorPubkey: row.actor_pubkey,
    draftId: row.draft_id,
    editSessionId: row.edit_session_id,
    category: row.category,
    originalFileName: row.original_file_name,
    sanitizedFileName: row.sanitized_file_name,
    objectKey: row.object_key,
    bucket: row.bucket,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    contentMd5Base64: row.content_md5_base64,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    finalizedAt: row.finalized_at,
    finalFileRefId: row.final_file_ref_id
  };
}

function toUploadedFileRef(row: UploadedFileRefRow): UploadedFileRef {
  return {
    fileRefId: row.file_ref_id,
    uploadId: row.upload_id,
    actorPubkey: row.actor_pubkey,
    draftId: row.draft_id,
    bucket: row.bucket,
    objectKey: row.object_key,
    cdnUrl: row.cdn_url,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    contentMd5Base64: row.content_md5_base64,
    etag: row.etag,
    uploadedAt: row.uploaded_at,
    createdAt: row.created_at
  };
}

function toUploadedFileRefWithCategory(row: UploadedFileRefWithCategoryRow): UploadedFileRefWithCategory {
  return {
    ...toUploadedFileRef(row),
    category: row.category
  };
}

function toEditSessionUploadRecord(row: EditSessionUploadRow): EditSessionUploadRecord {
  let lifecycleState: EditSessionUploadLifecycleState = "temporary";

  if (row.canceled_at) {
    lifecycleState = "canceled";
  } else if (row.promoted_at) {
    lifecycleState = "promoted";
  } else if (row.finalized_at) {
    lifecycleState = "finalized";
  }

  return {
    ...toUploadedFileRefWithCategory(row),
    editSessionId: row.edit_session_id,
    lifecycleState,
    promotedAt: row.promoted_at,
    promotedBy: row.promoted_by,
    canceledAt: row.canceled_at,
    canceledBy: row.canceled_by
  };
}

export async function createSignedUploadContract(
  input: CreateSignedUploadContractInput
): Promise<SignedUploadContract> {
  return withDbClient(async (client) => {
    const result = await client.query<SignedUploadContractRow>(
      `
        INSERT INTO asset_upload_contracts (
          upload_id,
          actor_pubkey,
          draft_id,
          edit_session_id,
          category,
          original_file_name,
          sanitized_file_name,
          object_key,
          bucket,
          mime_type,
          size_bytes,
          content_md5_base64,
          expires_at
        )
        VALUES ($1, $2, $3, $4::uuid, $5, $6, $7, $8, $9, $10, $11, $12, $13::timestamptz)
        RETURNING
          upload_id,
          actor_pubkey,
          draft_id,
          edit_session_id,
          category,
          original_file_name,
          sanitized_file_name,
          object_key,
          bucket,
          mime_type,
          size_bytes,
          content_md5_base64,
          expires_at,
          created_at,
          finalized_at,
          final_file_ref_id,
          promoted_at,
          promoted_by,
          canceled_at,
          canceled_by
      `,
      [
        input.uploadId,
        input.actorPubkey,
        input.draftId,
        input.editSessionId,
        input.category,
        input.originalFileName,
        input.sanitizedFileName,
        input.objectKey,
        input.bucket,
        input.mimeType,
        input.sizeBytes,
        input.contentMd5Base64,
        input.expiresAt
      ]
    );

    if (result.rowCount !== 1) {
      throw new Error("Could not create signed upload contract.");
    }

    return toSignedUploadContract(result.rows[0]);
  });
}

export async function getSignedUploadContract(uploadId: string): Promise<SignedUploadContract | null> {
  return withDbClient(async (client) => {
    const result = await client.query<SignedUploadContractRow>(
      `
        SELECT
          upload_id,
          actor_pubkey,
          draft_id,
          edit_session_id,
          category,
          original_file_name,
          sanitized_file_name,
          object_key,
          bucket,
          mime_type,
          size_bytes,
          content_md5_base64,
          expires_at,
          created_at,
          finalized_at,
          final_file_ref_id,
          promoted_at,
          promoted_by,
          canceled_at,
          canceled_by
        FROM asset_upload_contracts
        WHERE upload_id = $1
      `,
      [uploadId]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return toSignedUploadContract(result.rows[0]);
  });
}

export async function getUploadedFileRefByUploadId(uploadId: string): Promise<UploadedFileRef | null> {
  return withDbClient(async (client) => {
    const result = await client.query<UploadedFileRefRow>(
      `
        SELECT
          file_ref_id,
          upload_id,
          actor_pubkey,
          draft_id,
          bucket,
          object_key,
          cdn_url,
          mime_type,
          size_bytes,
          content_md5_base64,
          etag,
          uploaded_at,
          created_at
        FROM asset_uploaded_files
        WHERE upload_id = $1
      `,
      [uploadId]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return toUploadedFileRef(result.rows[0]);
  });
}

export async function listUploadedFileRefsByDraftId(draftId: string): Promise<UploadedFileRefWithCategory[]> {
  const normalizedDraftId = draftId.trim();
  if (!normalizedDraftId) {
    return [];
  }

  const uploadsByDraftId = await listUploadedFileRefsByDraftIds([normalizedDraftId]);
  return uploadsByDraftId.get(normalizedDraftId) ?? [];
}

export async function listUploadedFileRefsByDraftIds(draftIds: string[]): Promise<Map<string, UploadedFileRefWithCategory[]>> {
  const normalizedDraftIds = Array.from(
    new Set(
      draftIds
        .map((draftId) => draftId.trim())
        .filter((draftId) => draftId.length > 0)
    )
  );

  const uploadsByDraftId = new Map<string, UploadedFileRefWithCategory[]>();
  if (normalizedDraftIds.length === 0) {
    return uploadsByDraftId;
  }

  return withDbClient(async (client) => {
    const result = await client.query<UploadedFileRefWithCategoryRow>(
      `
        SELECT
          files.file_ref_id,
          files.upload_id,
          files.actor_pubkey,
          files.draft_id,
          files.bucket,
          files.object_key,
          files.cdn_url,
          files.mime_type,
          files.size_bytes,
          files.content_md5_base64,
          files.etag,
          files.uploaded_at,
          files.created_at,
          contracts.category
        FROM asset_uploaded_files AS files
        INNER JOIN asset_upload_contracts AS contracts
          ON contracts.upload_id = files.upload_id
        WHERE files.draft_id = ANY($1::uuid[])
        ORDER BY files.draft_id ASC, files.uploaded_at ASC, files.created_at ASC, files.file_ref_id ASC
      `,
      [normalizedDraftIds]
    );

    for (const row of result.rows) {
      const fileRef = toUploadedFileRefWithCategory(row);
      const currentDraftFiles = uploadsByDraftId.get(fileRef.draftId) ?? [];
      currentDraftFiles.push(fileRef);
      uploadsByDraftId.set(fileRef.draftId, currentDraftFiles);
    }

    return uploadsByDraftId;
  });
}

export async function listEditSessionUploads(input: {
  draftId: string;
  editSessionId: string;
}): Promise<EditSessionUploadRecord[]> {
  const draftId = input.draftId.trim();
  const editSessionId = input.editSessionId.trim();

  if (!draftId || !editSessionId) {
    return [];
  }

  return withDbClient(async (client) => {
    const result = await client.query<EditSessionUploadRow>(
      `
        SELECT
          files.file_ref_id,
          files.upload_id,
          files.actor_pubkey,
          files.draft_id,
          files.bucket,
          files.object_key,
          files.cdn_url,
          files.mime_type,
          files.size_bytes,
          files.content_md5_base64,
          files.etag,
          files.uploaded_at,
          files.created_at,
          contracts.category,
          contracts.edit_session_id,
          contracts.finalized_at,
          contracts.promoted_at,
          contracts.promoted_by,
          contracts.canceled_at,
          contracts.canceled_by
        FROM asset_uploaded_files AS files
        INNER JOIN asset_upload_contracts AS contracts
          ON contracts.upload_id = files.upload_id
        WHERE files.draft_id = $1::uuid
          AND contracts.edit_session_id = $2::uuid
        ORDER BY files.uploaded_at ASC, files.created_at ASC, files.file_ref_id ASC
      `,
      [draftId, editSessionId]
    );

    return result.rows.map(toEditSessionUploadRecord);
  });
}

export async function promoteEditSessionUploads(input: {
  draftId: string;
  editSessionId: string;
  actorPubkey: string;
}): Promise<EditSessionUploadRecord[]> {
  const draftId = input.draftId.trim();
  const editSessionId = input.editSessionId.trim();
  const actorPubkey = input.actorPubkey.trim();

  if (!draftId || !editSessionId) {
    return [];
  }

  if (!actorPubkey) {
    throw new Error("actorPubkey is required.");
  }

  return withDbClient(async (client) => {
    await client.query(
      `
        UPDATE asset_upload_contracts
        SET
          promoted_at = COALESCE(promoted_at, NOW()),
          promoted_by = COALESCE(promoted_by, $3),
          canceled_at = NULL,
          canceled_by = NULL
        WHERE draft_id = $1::uuid
          AND edit_session_id = $2::uuid
          AND finalized_at IS NOT NULL
      `,
      [draftId, editSessionId, actorPubkey]
    );

    const result = await client.query<EditSessionUploadRow>(
      `
        SELECT
          files.file_ref_id,
          files.upload_id,
          files.actor_pubkey,
          files.draft_id,
          files.bucket,
          files.object_key,
          files.cdn_url,
          files.mime_type,
          files.size_bytes,
          files.content_md5_base64,
          files.etag,
          files.uploaded_at,
          files.created_at,
          contracts.category,
          contracts.edit_session_id,
          contracts.finalized_at,
          contracts.promoted_at,
          contracts.promoted_by,
          contracts.canceled_at,
          contracts.canceled_by
        FROM asset_uploaded_files AS files
        INNER JOIN asset_upload_contracts AS contracts
          ON contracts.upload_id = files.upload_id
        WHERE files.draft_id = $1::uuid
          AND contracts.edit_session_id = $2::uuid
          AND contracts.promoted_at IS NOT NULL
        ORDER BY files.uploaded_at ASC, files.created_at ASC, files.file_ref_id ASC
      `,
      [draftId, editSessionId]
    );

    return result.rows.map(toEditSessionUploadRecord);
  });
}

export async function cancelEditSessionUploads(input: {
  draftId: string;
  editSessionId: string;
  actorPubkey: string;
}): Promise<number> {
  const draftId = input.draftId.trim();
  const editSessionId = input.editSessionId.trim();
  const actorPubkey = input.actorPubkey.trim();

  if (!draftId || !editSessionId) {
    return 0;
  }

  if (!actorPubkey) {
    throw new Error("actorPubkey is required.");
  }

  return withDbClient(async (client) => {
    const result = await client.query<{ upload_id: string }>(
      `
        UPDATE asset_upload_contracts
        SET
          canceled_at = COALESCE(canceled_at, NOW()),
          canceled_by = COALESCE(canceled_by, $3)
        WHERE draft_id = $1::uuid
          AND edit_session_id = $2::uuid
          AND promoted_at IS NULL
        RETURNING upload_id
      `,
      [draftId, editSessionId, actorPubkey]
    );

    return result.rowCount ?? 0;
  });
}

export async function persistFinalizedUpload(input: FinalizeUploadInput): Promise<{ created: boolean; fileRef: UploadedFileRef }> {
  return withDbClient(async (client) => {
    await client.query("BEGIN");

    try {
      const contractResult = await client.query<SignedUploadContractRow>(
        `
          SELECT
            upload_id,
            actor_pubkey,
            draft_id,
            category,
            original_file_name,
            sanitized_file_name,
            object_key,
            bucket,
            mime_type,
            size_bytes,
            content_md5_base64,
            expires_at,
            created_at,
            finalized_at,
            final_file_ref_id
          FROM asset_upload_contracts
          WHERE upload_id = $1
          FOR UPDATE
        `,
        [input.uploadId]
      );

      if (contractResult.rowCount === 0) {
        throw new Error("UPLOAD_NOT_FOUND");
      }

      const existingFileRef = await client.query<UploadedFileRefRow>(
        `
          SELECT
            file_ref_id,
            upload_id,
            actor_pubkey,
            draft_id,
            bucket,
            object_key,
            cdn_url,
            mime_type,
            size_bytes,
            content_md5_base64,
            etag,
            uploaded_at,
            created_at
          FROM asset_uploaded_files
          WHERE upload_id = $1
        `,
        [input.uploadId]
      );

      if (existingFileRef.rowCount === 1) {
        await client.query(
          `
            UPDATE asset_upload_contracts
            SET
              finalized_at = COALESCE(finalized_at, NOW()),
              final_file_ref_id = COALESCE(final_file_ref_id, $2::uuid)
            WHERE upload_id = $1
          `,
          [input.uploadId, existingFileRef.rows[0].file_ref_id]
        );
        await client.query("COMMIT");
        return { created: false, fileRef: toUploadedFileRef(existingFileRef.rows[0]) };
      }

      const fileRefId = randomUUID();
      const insertResult = await client.query<UploadedFileRefRow>(
        `
          INSERT INTO asset_uploaded_files (
            file_ref_id,
            upload_id,
            actor_pubkey,
            draft_id,
            bucket,
            object_key,
            cdn_url,
            mime_type,
            size_bytes,
            content_md5_base64,
            etag,
            uploaded_at
          )
          VALUES ($1::uuid, $2::uuid, $3, $4::uuid, $5, $6, $7, $8, $9, $10, $11, $12::timestamptz)
          ON CONFLICT (upload_id) DO NOTHING
          RETURNING
            file_ref_id,
            upload_id,
            actor_pubkey,
            draft_id,
            bucket,
            object_key,
            cdn_url,
            mime_type,
            size_bytes,
            content_md5_base64,
            etag,
            uploaded_at,
            created_at
        `,
        [
          fileRefId,
          input.uploadId,
          input.actorPubkey,
          input.draftId,
          input.bucket,
          input.objectKey,
          input.cdnUrl,
          input.mimeType,
          input.sizeBytes,
          input.contentMd5Base64,
          input.etag,
          input.uploadedAt
        ]
      );

      let persistedRow: UploadedFileRefRow | null = null;
      let created = false;

      if (insertResult.rowCount === 1) {
        persistedRow = insertResult.rows[0];
        created = true;
      } else {
        const rowResult = await client.query<UploadedFileRefRow>(
          `
            SELECT
              file_ref_id,
              upload_id,
              actor_pubkey,
              draft_id,
              bucket,
              object_key,
              cdn_url,
              mime_type,
              size_bytes,
              content_md5_base64,
              etag,
              uploaded_at,
              created_at
            FROM asset_uploaded_files
            WHERE upload_id = $1
          `,
          [input.uploadId]
        );

        if (rowResult.rowCount !== 1) {
          throw new Error("Could not persist finalized upload.");
        }

        persistedRow = rowResult.rows[0];
      }

      await client.query(
        `
          UPDATE asset_upload_contracts
          SET
            finalized_at = COALESCE(finalized_at, NOW()),
            final_file_ref_id = COALESCE(final_file_ref_id, $2::uuid)
          WHERE upload_id = $1::uuid
        `,
        [input.uploadId, persistedRow.file_ref_id]
      );

      await client.query("COMMIT");
      return { created, fileRef: toUploadedFileRef(persistedRow) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}
