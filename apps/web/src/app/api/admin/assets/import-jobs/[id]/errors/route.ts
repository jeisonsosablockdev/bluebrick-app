import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { getImportJobForActor, listImportJobErrors } from "@/lib/admin/import-jobs";
import { isUuidV4 } from "@/lib/asset-uploads/policy";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
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

function parseNumberSearchParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const floored = Math.floor(parsed);
  return Math.min(max, Math.max(min, floored));
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const roleResult = getRequestRole(request);

  if (!roleResult.authenticated || roleResult.role !== "admin" || !roleResult.pubkey) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  const { id } = await params;
  if (!isUuidV4(id)) {
    return errorResponse(400, "INVALID_IMPORT_JOB_ID", "id must be a UUIDv4.");
  }

  const job = await getImportJobForActor(id, roleResult.pubkey);
  if (!job) {
    return errorResponse(404, "IMPORT_JOB_NOT_FOUND", "Import job not found.");
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = parseNumberSearchParam(searchParams.get("limit"), 100, 1, 200);
  const offset = parseNumberSearchParam(searchParams.get("offset"), 0, 0, 10_000);

  const errors = await listImportJobErrors(id, limit, offset);

  return NextResponse.json({
    importJobId: id,
    count: errors.length,
    limit,
    offset,
    errors: errors.map((item) => ({
      row: item.rowNumber,
      column: item.columnName,
      code: item.errorCode,
      message: item.errorMessage
    }))
  });
}
