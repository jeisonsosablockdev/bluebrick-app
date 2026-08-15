import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  assertCreateImportRateLimit,
  createImportJob,
  enqueueImportJob,
  ImportJobInputError,
  markImportJobDelayed,
  parseAndSanitizeImportRows
} from "@/lib/admin/import-jobs";
import { isUuidV4 } from "@/lib/asset-uploads/policy";

type ParsedCreateJobRequest = {
  draftId: string | null;
  idempotencyKey: string | null;
  sourceFileName: string;
  sourceMimeType: string;
  sourceSizeBytes: number;
  content: string;
};

function errorResponse(status: number, code: string, message: string): NextResponse {
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

function parseOptionalIdempotencyKey(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, 120);
}

function parseOptionalDraftId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (!isUuidV4(normalized)) {
    throw new ImportJobInputError("draftId must be a UUIDv4.", 400, "INVALID_DRAFT_ID");
  }

  return normalized;
}

function requireFileName(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ImportJobInputError("fileName is required.", 400, "INVALID_IMPORT_REQUEST");
  }

  return value.trim().slice(0, 160);
}

function requireMimeType(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ImportJobInputError("mimeType is required.", 400, "INVALID_IMPORT_REQUEST");
  }

  return value.trim().toLowerCase();
}

async function parseCreateRequest(request: NextRequest): Promise<ParsedCreateJobRequest> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ImportJobInputError("file is required in multipart form data.", 400, "MISSING_IMPORT_FILE");
    }

    const content = await file.text();
    const sourceMimeType = requireMimeType(file.type || "text/csv");
    const sourceSizeBytes = Number(file.size);

    return {
      draftId: parseOptionalDraftId(formData.get("draftId")),
      idempotencyKey: parseOptionalIdempotencyKey(formData.get("idempotencyKey")),
      sourceFileName: requireFileName(file.name || "import.csv"),
      sourceMimeType,
      sourceSizeBytes,
      content
    };
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    throw new ImportJobInputError("Invalid request body.", 400, "INVALID_IMPORT_REQUEST");
  }

  const content = typeof body.csvText === "string" ? body.csvText : "";
  if (!content.trim()) {
    throw new ImportJobInputError("csvText is required when no multipart file is provided.", 400, "MISSING_IMPORT_FILE");
  }

  return {
    draftId: parseOptionalDraftId(body.draftId),
    idempotencyKey: parseOptionalIdempotencyKey(body.idempotencyKey),
    sourceFileName: requireFileName(body.fileName ?? "import.csv"),
    sourceMimeType: requireMimeType(body.mimeType ?? "text/csv"),
    sourceSizeBytes: Buffer.byteLength(content, "utf8"),
    content
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleResult = getRequestRole(request);

  if (!roleResult.authenticated || roleResult.role !== "admin" || !roleResult.pubkey) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    await assertCreateImportRateLimit(roleResult.pubkey);

    const parsedRequest = await parseCreateRequest(request);
    const rows = parseAndSanitizeImportRows({
      sourceMimeType: parsedRequest.sourceMimeType,
      sourceSizeBytes: parsedRequest.sourceSizeBytes,
      content: parsedRequest.content
    });

    const created = await createImportJob({
      actorPubkey: roleResult.pubkey,
      draftId: parsedRequest.draftId,
      idempotencyKey: parsedRequest.idempotencyKey,
      sourceFileName: parsedRequest.sourceFileName,
      sourceMimeType: parsedRequest.sourceMimeType,
      sourceSizeBytes: parsedRequest.sourceSizeBytes,
      rows
    });

    if (created.inserted) {
      try {
        await enqueueImportJob(created.job.id);
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Could not enqueue import job.";
        await markImportJobDelayed(created.job.id, reason);
        throw error;
      }
    }

    const statusCode = created.inserted ? 202 : 200;

    return NextResponse.json(
      {
        importJobId: created.job.id,
        statusUrl: `/api/admin/assets/import-jobs/${created.job.id}`,
        state: created.job.state
      },
      { status: statusCode }
    );
  } catch (error) {
    if (error instanceof ImportJobInputError) {
      return errorResponse(error.status, error.code, error.message);
    }

    const message = error instanceof Error ? error.message : "Could not create import job.";
    return errorResponse(500, "IMPORT_JOB_CREATE_FAILED", message);
  }
}
