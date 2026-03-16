import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  enqueueImportJob,
  ImportJobInputError,
  isImportWorkerRequest,
  processImportJobBatch,
  registerImportJobProcessingFailure
} from "@/lib/admin/import-jobs";
import { isUuidV4 } from "@/lib/asset-uploads/policy";

type ProcessBody = {
  jobId?: unknown;
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

function isAuthorized(request: NextRequest): boolean {
  if (isImportWorkerRequest(request.headers.get("x-import-worker-token"))) {
    return true;
  }

  const roleResult = getRequestRole(request);
  return roleResult.authenticated && roleResult.role === "admin";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return errorResponse(403, "FORBIDDEN", "Worker token or admin role is required.");
  }

  const body = (await request.json().catch(() => null)) as ProcessBody | null;
  if (!body || typeof body.jobId !== "string" || !isUuidV4(body.jobId)) {
    return errorResponse(400, "INVALID_IMPORT_JOB_ID", "jobId must be a UUIDv4.");
  }

  try {
    const result = await processImportJobBatch(body.jobId);

    if (result.needsRequeue) {
      await enqueueImportJob(body.jobId);
    }

    return NextResponse.json({
      ok: true,
      importJobId: body.jobId,
      state: result.job.state,
      processedInBatch: result.processedInBatch,
      failedInBatch: result.failedInBatch,
      needsRequeue: result.needsRequeue
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected import worker error.";

    const failure = await registerImportJobProcessingFailure(body.jobId, message, {
      source: "worker",
      jobId: body.jobId
    });

    if (failure && !failure.failedPermanently) {
      try {
        await enqueueImportJob(body.jobId);
      } catch {
        // If enqueue retry fails, the next manual/process trigger can continue.
      }
    }

    if (error instanceof ImportJobInputError) {
      return errorResponse(error.status, error.code, error.message);
    }

    return NextResponse.json(
      {
        ok: false,
        importJobId: body.jobId,
        failedPermanently: failure?.failedPermanently ?? false,
        message
      },
      { status: 200 }
    );
  }
}
