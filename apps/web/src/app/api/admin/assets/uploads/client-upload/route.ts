import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { getSignedUploadContract } from "@/lib/asset-uploads/repository";

type ClientUploadErrorCode =
  | "INVALID_CLIENT_UPLOAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "UPLOAD_NOT_FOUND"
  | "UPLOAD_EXPIRED"
  | "UPLOAD_VALIDATION_FAILED"
  | "CLIENT_UPLOAD_TOKEN_FAILED";

type ClientUploadPayload = {
  uploadId: string;
};

class ClientUploadRouteError extends Error {
  constructor(
    readonly status: number,
    readonly code: ClientUploadErrorCode,
    message: string
  ) {
    super(message);
  }
}

function errorResponse(status: number, code: ClientUploadErrorCode, message: string): NextResponse {
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

function parseClientPayload(clientPayload: string | null): ClientUploadPayload {
  if (!clientPayload) {
    throw new ClientUploadRouteError(400, "INVALID_CLIENT_UPLOAD_REQUEST", "clientPayload is required.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(clientPayload);
  } catch {
    throw new ClientUploadRouteError(400, "INVALID_CLIENT_UPLOAD_REQUEST", "clientPayload must be valid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ClientUploadRouteError(400, "INVALID_CLIENT_UPLOAD_REQUEST", "clientPayload must be a JSON object.");
  }

  const uploadId = (parsed as Record<string, unknown>).uploadId;
  if (typeof uploadId !== "string" || !uploadId.trim()) {
    throw new ClientUploadRouteError(400, "INVALID_CLIENT_UPLOAD_REQUEST", "clientPayload.uploadId is required.");
  }

  return {
    uploadId: uploadId.trim()
  };
}

function ensureActiveUploadContract(input: {
  pathname: string;
  actorPubkey: string;
  contract: NonNullable<Awaited<ReturnType<typeof getSignedUploadContract>>>;
}): void {
  if (input.contract.actorPubkey !== input.actorPubkey) {
    throw new ClientUploadRouteError(403, "FORBIDDEN", "Upload contract belongs to a different admin wallet.");
  }

  if (input.contract.objectKey !== input.pathname) {
    throw new ClientUploadRouteError(409, "UPLOAD_VALIDATION_FAILED", "Upload pathname does not match signed contract.");
  }

  const expiresAtMs = Date.parse(input.contract.expiresAt);
  if (Number.isFinite(expiresAtMs) && Date.now() > expiresAtMs) {
    throw new ClientUploadRouteError(409, "UPLOAD_EXPIRED", "Signed upload contract has expired.");
  }

  if (input.contract.finalizedAt) {
    throw new ClientUploadRouteError(409, "UPLOAD_VALIDATION_FAILED", "Upload contract is already finalized.");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleResult = getRequestRole(request);

  if (!roleResult.authenticated) {
    return errorResponse(401, "UNAUTHENTICATED", "Authentication is required.");
  }

  if (roleResult.role !== "admin" || !roleResult.pubkey) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  const actorPubkey = roleResult.pubkey;
  const body = await request.json().catch(() => null) as HandleUploadBody | null;
  if (!body) {
    return errorResponse(400, "INVALID_CLIENT_UPLOAD_REQUEST", "Request body must be a Vercel Blob upload event.");
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = parseClientPayload(clientPayload);
        const contract = await getSignedUploadContract(payload.uploadId);

        if (!contract) {
          throw new ClientUploadRouteError(404, "UPLOAD_NOT_FOUND", "Signed upload contract was not found.");
        }

        ensureActiveUploadContract({
          pathname,
          actorPubkey,
          contract
        });

        return {
          allowedContentTypes: [contract.mimeType],
          maximumSizeInBytes: contract.sizeBytes,
          addRandomSuffix: false,
          allowOverwrite: true,
          tokenPayload: JSON.stringify({ uploadId: contract.uploadId })
        };
      }
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    if (error instanceof ClientUploadRouteError) {
      return errorResponse(error.status, error.code, error.message);
    }

    const message = error instanceof Error ? error.message : "Could not generate Vercel Blob client upload token.";
    return errorResponse(400, "CLIENT_UPLOAD_TOKEN_FAILED", message);
  }
}
