import { randomUUID } from "node:crypto";

import { withDbClient } from "@/lib/db/pool";
import {
  type AssetUploadCategory,
  type SignedUploadContract,
  type UploadedFileRef,
  type UploadedFileRefWithCategory
} from "@/lib/asset-uploads/types";

type SignedUploadContractRow = {
  upload_id: string;
  actor_pubkey: string;
  draft_id: string;
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

function toSignedUploadContract(row: SignedUploadContractRow): SignedUploadContract {
  return {
    uploadId: row.upload_id,
    actorPubkey: row.actor_pubkey,
    draftId: row.draft_id,
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::timestamptz)
        RETURNING
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
      `,
      [
        input.uploadId,
        input.actorPubkey,
        input.draftId,
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
        WHERE files.draft_id = $1::uuid
        ORDER BY files.uploaded_at ASC, files.created_at ASC, files.file_ref_id ASC
      `,
      [normalizedDraftId]
    );

    return result.rows.map(toUploadedFileRefWithCategory);
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
