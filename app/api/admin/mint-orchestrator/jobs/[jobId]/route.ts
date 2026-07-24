import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  calculateMintJobProgress,
  getMintJob,
  isMintOrchestratorError
} from "@/lib/state/mint-orchestrator-store";

type RouteParams = {
  params: Promise<{
    jobId: string;
  }>;
};

function isAdminRequest(request: NextRequest): boolean {
  const roleResult = getRequestRole(request);
  return roleResult.authenticated && roleResult.role === "admin";
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { jobId } = await params;

  try {
    const job = getMintJob(jobId);
    return NextResponse.json({
      job,
      progress: calculateMintJobProgress(job)
    });
  } catch (error) {
    if (isMintOrchestratorError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Could not fetch mint job." }, { status: 500 });
  }
}
