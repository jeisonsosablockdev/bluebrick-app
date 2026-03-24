import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { invalidateCdnPaths } from "@/lib/asset-uploads/cdn-invalidation";

type PurgeErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INVALID_PURGE_REQUEST"
  | "CDN_INVALIDATION_FAILED";

function errorResponse(status: number, code: PurgeErrorCode, message: string): NextResponse {
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

function parsePurgePaths(body: unknown): string[] {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be an object.");
  }

  const paths = (body as { paths?: unknown }).paths;
  if (!Array.isArray(paths)) {
    throw new Error("paths must be an array.");
  }

  const normalized = paths
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  if (normalized.length === 0) {
    throw new Error("paths must include at least one valid string.");
  }

  return normalized;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleResult = getRequestRole(request);

  if (!roleResult.authenticated) {
    return errorResponse(401, "UNAUTHENTICATED", "Authentication is required.");
  }

  if (roleResult.role !== "admin" || !roleResult.pubkey) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  let paths: string[];
  try {
    const body = await request.json().catch(() => null);
    paths = parsePurgePaths(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid purge request.";
    return errorResponse(400, "INVALID_PURGE_REQUEST", message);
  }

  const invalidation = await invalidateCdnPaths({
    actorPubkey: roleResult.pubkey,
    source: "manual",
    paths
  });

  if (invalidation.status === "failed") {
    return errorResponse(
      502,
      "CDN_INVALIDATION_FAILED",
      invalidation.reason || "CDN invalidation provider returned an error."
    );
  }

  if (invalidation.status === "skipped") {
    return errorResponse(
      503,
      "CDN_INVALIDATION_FAILED",
      invalidation.reason || "CDN invalidation provider is unavailable."
    );
  }

  return NextResponse.json({
    ok: true,
    status: invalidation.status,
    paths: invalidation.paths,
    providerRequestId: invalidation.providerRequestId
  });
}
