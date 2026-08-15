import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { isUuidV4 } from "@/lib/asset-uploads/policy";
import { cancelEditSessionUploads } from "@/lib/asset-uploads/repository";

type CancelErrorCode =
  | "INVALID_CANCEL_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "CANCEL_FAILED";

function errorResponse(status: number, code: CancelErrorCode, message: string): NextResponse {
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

function readUuidField(body: Record<string, unknown>, fieldName: "draftId" | "editSessionId"): string | null {
  const value = body[fieldName];
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return isUuidV4(normalized) ? normalized : null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleResult = getRequestRole(request);

  if (!roleResult.authenticated) {
    return errorResponse(401, "UNAUTHENTICATED", "Authentication is required.");
  }

  if (roleResult.role !== "admin" || !roleResult.pubkey) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse(400, "INVALID_CANCEL_REQUEST", "Request body must be a JSON object.");
  }

  const record = body as Record<string, unknown>;
  const draftId = readUuidField(record, "draftId");
  const editSessionId = readUuidField(record, "editSessionId");

  if (!draftId || !editSessionId) {
    return errorResponse(422, "INVALID_CANCEL_REQUEST", "draftId and editSessionId must be valid UUIDv4 values.");
  }

  try {
    const canceledUploads = await cancelEditSessionUploads({
      draftId,
      editSessionId,
      actorPubkey: roleResult.pubkey
    });

    return NextResponse.json({
      canceledUploads
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not cancel edit-session uploads.";
    return errorResponse(500, "CANCEL_FAILED", message);
  }
}
