import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { buildSignedPutUrl, getGcsUploadConfig } from "@/lib/asset-uploads/gcs";
import {
  buildVersionedObjectKey,
  generateUploadId,
  getCategoryPolicy,
  parseSignedUrlRequest,
  sanitizeFileName
} from "@/lib/asset-uploads/policy";
import { createSignedUploadContract } from "@/lib/asset-uploads/repository";

type ErrorCode =
  | "INVALID_UPLOAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "FILE_TOO_LARGE"
  | "MIME_NOT_ALLOWED"
  | "RATE_LIMITED"
  | "SIGN_URL_FAILED";

type RateLimitEntry = {
  windowStartedAt: number;
  requests: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const rateLimitMap = new Map<string, RateLimitEntry>();

function errorResponse(status: number, code: ErrorCode, message: string): NextResponse {
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

function isRateLimited(actorPubkey: string): boolean {
  const now = Date.now();
  const current = rateLimitMap.get(actorPubkey);

  if (!current || now - current.windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(actorPubkey, { windowStartedAt: now, requests: 1 });
    return false;
  }

  current.requests += 1;
  return current.requests > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleResult = getRequestRole(request);

  if (!roleResult.authenticated) {
    return errorResponse(401, "UNAUTHENTICATED", "Authentication is required.");
  }

  if (roleResult.role !== "admin" || !roleResult.pubkey) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  if (isRateLimited(roleResult.pubkey)) {
    return errorResponse(429, "RATE_LIMITED", "Too many signed URL requests. Please retry shortly.");
  }

  const body = await request.json().catch(() => null);
  const parsed = parseSignedUrlRequest(body);

  if (!parsed.ok) {
    if (parsed.code === "FILE_TOO_LARGE") {
      return errorResponse(413, "FILE_TOO_LARGE", parsed.message);
    }

    if (parsed.code === "MIME_NOT_ALLOWED") {
      return errorResponse(415, "MIME_NOT_ALLOWED", parsed.message);
    }

    return errorResponse(400, "INVALID_UPLOAD_REQUEST", parsed.message);
  }

  try {
    const payload = parsed.value;
    const uploadId = generateUploadId();
    const config = getGcsUploadConfig();
    const sanitized = sanitizeFileName(payload.fileName);
    const objectKey = buildVersionedObjectKey({
      category: payload.category,
      draftId: payload.draftId,
      fileName: sanitized.sanitizedFileName,
      contentMd5Base64: payload.contentMd5Base64,
      mimeType: payload.mimeType
    });
    const categoryPolicy = getCategoryPolicy(payload.category);

    const signed = await buildSignedPutUrl({
      config,
      uploadId,
      objectKey,
      mimeType: payload.mimeType,
      sizeBytes: payload.sizeBytes,
      contentMd5Base64: payload.contentMd5Base64
    });

    await createSignedUploadContract({
      uploadId,
      actorPubkey: roleResult.pubkey,
      draftId: payload.draftId,
      editSessionId: payload.editSessionId,
      category: payload.category,
      originalFileName: payload.fileName,
      sanitizedFileName: sanitized.sanitizedFileName,
      objectKey,
      bucket: config.bucketName,
      mimeType: payload.mimeType,
      sizeBytes: payload.sizeBytes,
      contentMd5Base64: payload.contentMd5Base64,
      expiresAt: signed.expiresAt
    });

    return NextResponse.json({
      uploadId,
      uploadUrl: signed.uploadUrl,
      method: "PUT",
      requiredHeaders: signed.requiredHeaders,
      objectKey,
      expiresAt: signed.expiresAt,
      maxSizeBytes: categoryPolicy.maxSizeBytes,
      finalizeUrl: `/api/admin/assets/uploads/${uploadId}/finalize`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate signed URL.";
    return errorResponse(500, "SIGN_URL_FAILED", message);
  }
}
