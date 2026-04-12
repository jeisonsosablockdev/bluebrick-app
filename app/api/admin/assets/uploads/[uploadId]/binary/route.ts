import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { getGcsUploadConfig, putBlobObject } from "@/lib/asset-uploads/gcs";
import { getSignedUploadContract } from "@/lib/asset-uploads/repository";
import { isUuidV4 } from "@/lib/asset-uploads/policy";

type RouteParams = {
  params: Promise<{
    uploadId: string;
  }>;
};

type UploadBinaryErrorCode =
  | "INVALID_UPLOAD_ID"
  | "UPLOAD_NOT_FOUND"
  | "UPLOAD_EXPIRED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "CONTENT_MD5_MISMATCH"
  | "UPLOAD_VALIDATION_FAILED"
  | "UPLOAD_FAILED";

function errorResponse(status: number, code: UploadBinaryErrorCode, message: string): NextResponse {
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

export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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

  try {
    const contract = await getSignedUploadContract(uploadId);

    if (!contract) {
      return errorResponse(404, "UPLOAD_NOT_FOUND", "Signed upload contract was not found.");
    }

    const now = Date.now();
    const expiresAtMs = Date.parse(contract.expiresAt);
    if (Number.isFinite(expiresAtMs) && now > expiresAtMs) {
      return errorResponse(409, "UPLOAD_EXPIRED", "Signed upload contract has expired.");
    }

    if (contract.finalizedAt) {
      return errorResponse(409, "UPLOAD_VALIDATION_FAILED", "Upload contract is already finalized.");
    }

    const contentTypeHeader = request.headers.get("content-type");
    if (!contentTypeHeader) {
      return errorResponse(422, "UPLOAD_VALIDATION_FAILED", "Content-Type header is required.");
    }

    if (normalizeMimeType(contentTypeHeader) !== normalizeMimeType(contract.mimeType)) {
      return errorResponse(422, "UPLOAD_VALIDATION_FAILED", "Content-Type does not match signed upload contract.");
    }

    const contentMd5Header = request.headers.get("content-md5");
    if (!contentMd5Header) {
      return errorResponse(422, "UPLOAD_VALIDATION_FAILED", "Content-MD5 header is required.");
    }

    if (contentMd5Header !== contract.contentMd5Base64) {
      return errorResponse(422, "CONTENT_MD5_MISMATCH", "Content-MD5 does not match signed upload contract.");
    }

    const bodyBuffer = Buffer.from(await request.arrayBuffer());
    if (bodyBuffer.byteLength !== contract.sizeBytes) {
      return errorResponse(422, "UPLOAD_VALIDATION_FAILED", "Body size does not match signed upload contract.");
    }

    const computedMd5 = createHash("md5").update(bodyBuffer).digest("base64");
    if (computedMd5 !== contract.contentMd5Base64) {
      return errorResponse(422, "CONTENT_MD5_MISMATCH", "Body checksum does not match signed upload contract.");
    }

    const config = getGcsUploadConfig();
    const uploadResult = await putBlobObject({
      config,
      objectKey: contract.objectKey,
      mimeType: contract.mimeType,
      body: bodyBuffer
    });

    return new NextResponse(null, {
      status: 200,
      headers: uploadResult.etag
        ? {
            ETag: uploadResult.etag
          }
        : undefined
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload file bytes.";
    return errorResponse(500, "UPLOAD_FAILED", message);
  }
}
