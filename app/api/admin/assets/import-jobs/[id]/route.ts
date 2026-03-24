import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { getImportJobForActor } from "@/lib/admin/import-jobs";
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

function isDelayed(lastTransitionAtIso: string, state: string): boolean {
  if (state !== "queued" && state !== "processing" && state !== "delayed") {
    return false;
  }

  const transitionTimestamp = Date.parse(lastTransitionAtIso);
  if (!Number.isFinite(transitionTimestamp)) {
    return false;
  }

  return Date.now() - transitionTimestamp > 60_000;
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

  return NextResponse.json({
    importJobId: job.id,
    state: job.state,
    delayed: isDelayed(job.lastTransitionAt, job.state),
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    failedRows: job.failedRows,
    warningsCount: job.warningsCount,
    errorReportUrl: job.errorReportUrl,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt
  });
}
