import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { invalidateCdnPaths } from "@/lib/asset-uploads/cdn-invalidation";
import { buildCdnUrl, getGcsUploadConfig, headGcsObject } from "@/lib/asset-uploads/gcs";
import { isUuidV4, parseFinalizeUploadRequest } from "@/lib/asset-uploads/policy";
import {
  getSignedUploadContract,
  getUploadedFileRefByUploadId,
  persistFinalizedUpload
} from "@/lib/asset-uploads/repository";

type RouteParams = {
  params: Promise<{
    uploadId: string;
  }>;
};

type FinalizeErrorCode =
  | "INVALID_UPLOAD_ID"
  | "UPLOAD_NOT_FOUND"
  | "UPLOAD_EXPIRED"
  | "DRAFT_MISMATCH"
  | "CONTENT_MD5_MISMATCH"
  | "UPLOAD_VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "FINALIZE_FAILED";

function errorResponse(status: number, code: FinalizeErrorCode, message: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message
      }
    },
    { status }
  );
}

function normalizeMimeType(value: string): string {
  return value.trim().toLowerCase();
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const roleResult = getRequestRole(request);

  if (!roleResult.authenticated) {
    return errorResponse(401, "UNAUTHENTICATED", "Authentication is required.");
  }

  if (roleResult.role !== "admin" || !roleResult.pubkey) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  const { uploadId } = await params;
  if (!isUuidV4(uploadId)) {
    return errorResponse(400, "INVALID_UPLOAD_ID", "uploadId must be a valid UUIDv4.");
  }

  const body = await request.json().catch(() => null);
  const parsed = parseFinalizeUploadRequest(body);

  if (!parsed.ok) {
    return errorResponse(422, "UPLOAD_VALIDATION_FAILED", parsed.message);
  }

  const payload = parsed.value;

  try {
    const contract = await getSignedUploadContract(uploadId);

    if (!contract) {
      return errorResponse(404, "UPLOAD_NOT_FOUND", "Signed upload contract was not found.");
    }

    if (contract.finalizedAt) {
      const existingFileRef = await getUploadedFileRefByUploadId(uploadId);
      if (!existingFileRef) {
        return errorResponse(500, "FINALIZE_FAILED", "Upload contract is finalized but fileRef is missing.");
      }

      return NextResponse.json({
        fileRefId: existingFileRef.fileRefId,
        bucket: existingFileRef.bucket,
        objectKey: existingFileRef.objectKey,
        cdnUrl: existingFileRef.cdnUrl,
        uploadedAt: existingFileRef.uploadedAt
      });
    }

    const now = Date.now();
    const expiresAtMs = Date.parse(contract.expiresAt);
    if (Number.isFinite(expiresAtMs) && now > expiresAtMs) {
      return errorResponse(409, "UPLOAD_EXPIRED", "Signed upload contract has expired.");
    }

    if (payload.draftId !== contract.draftId) {
      return errorResponse(409, "DRAFT_MISMATCH", "draftId does not match the signed upload contract.");
    }

    if (payload.contentMd5Base64 !== contract.contentMd5Base64) {
      return errorResponse(422, "CONTENT_MD5_MISMATCH", "contentMd5Base64 does not match the signed upload contract.");
    }

    if (payload.sizeBytes !== contract.sizeBytes) {
      return errorResponse(422, "UPLOAD_VALIDATION_FAILED", "sizeBytes does not match the signed upload contract.");
    }

    if (normalizeMimeType(payload.mimeType) !== normalizeMimeType(contract.mimeType)) {
      return errorResponse(422, "UPLOAD_VALIDATION_FAILED", "mimeType does not match the signed upload contract.");
    }

    const config = getGcsUploadConfig();
    const metadata = await headGcsObject(config, contract.objectKey);

    if (!metadata.found) {
      return errorResponse(422, "UPLOAD_VALIDATION_FAILED", "Uploaded object was not found in storage.");
    }

    if (metadata.sizeBytes === null) {
      return errorResponse(422, "UPLOAD_VALIDATION_FAILED", "Stored object size metadata is unavailable.");
    }

    if (metadata.sizeBytes !== payload.sizeBytes) {
      return errorResponse(422, "UPLOAD_VALIDATION_FAILED", "Stored object size does not match signed contract.");
    }

    if (!metadata.mimeType) {
      return errorResponse(422, "UPLOAD_VALIDATION_FAILED", "Stored object content-type metadata is unavailable.");
    }

    if (normalizeMimeType(metadata.mimeType) !== normalizeMimeType(payload.mimeType)) {
      return errorResponse(422, "UPLOAD_VALIDATION_FAILED", "Stored object content-type does not match signed contract.");
    }

    if (!metadata.md5Base64) {
      return errorResponse(422, "UPLOAD_VALIDATION_FAILED", "Stored object MD5 metadata is unavailable.");
    }

    if (metadata.md5Base64 !== payload.contentMd5Base64) {
      return errorResponse(422, "CONTENT_MD5_MISMATCH", "Stored object MD5 does not match signed contract.");
    }

    if (payload.etag && metadata.etag && payload.etag !== metadata.etag) {
      return errorResponse(422, "UPLOAD_VALIDATION_FAILED", "etag does not match stored object ETag.");
    }

    const persisted = await persistFinalizedUpload({
      uploadId: contract.uploadId,
      actorPubkey: roleResult.pubkey,
      draftId: contract.draftId,
      bucket: contract.bucket,
      objectKey: contract.objectKey,
      cdnUrl: buildCdnUrl(config, contract.objectKey),
      mimeType: contract.mimeType,
      sizeBytes: contract.sizeBytes,
      contentMd5Base64: contract.contentMd5Base64,
      etag: metadata.etag ?? payload.etag,
      uploadedAt: new Date().toISOString()
    });

    let cdnInvalidationStatus: "success" | "failed" | "skipped" | null = null;
    let invalidatedPaths: string[] = [];

    if (payload.previousCdnUrl && payload.previousCdnUrl !== persisted.fileRef.cdnUrl) {
      const invalidation = await invalidateCdnPaths({
        actorPubkey: roleResult.pubkey,
        source: "finalize-replace",
        uploadId: contract.uploadId,
        paths: [payload.previousCdnUrl]
      });

      cdnInvalidationStatus = invalidation.status;
      invalidatedPaths = invalidation.paths;
    }

    return NextResponse.json({
      fileRefId: persisted.fileRef.fileRefId,
      bucket: persisted.fileRef.bucket,
      objectKey: persisted.fileRef.objectKey,
      cdnUrl: persisted.fileRef.cdnUrl,
      uploadedAt: persisted.fileRef.uploadedAt,
      cdnInvalidationStatus,
      invalidatedPaths
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UPLOAD_NOT_FOUND") {
      return errorResponse(404, "UPLOAD_NOT_FOUND", "Signed upload contract was not found.");
    }

    const message = error instanceof Error ? error.message : "Could not finalize upload.";
    return errorResponse(500, "FINALIZE_FAILED", message);
  }
}
