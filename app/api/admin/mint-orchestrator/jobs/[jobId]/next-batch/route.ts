import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  calculateMintJobProgress,
  isMintOrchestratorError,
  prepareNextMintBatch
} from "@/lib/mint-orchestrator-store";

type RouteParams = {
  params: Promise<{
    jobId: string;
  }>;
};

type NextBatchBody = {
  idempotencyKey?: unknown;
};

function getAdminPubkey(request: NextRequest): string | null {
  const roleResult = getRequestRole(request);

  if (!roleResult.authenticated || roleResult.role !== "admin" || !roleResult.pubkey) {
    return null;
  }

  return roleResult.pubkey;
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const adminPubkey = getAdminPubkey(request);

  if (!adminPubkey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { jobId } = await params;
  const body = (await request.json().catch(() => null)) as NextBatchBody | null;
  const requestIdempotencyKeyHeader = request.headers.get("x-idempotency-key")?.trim();
  const requestIdempotencyKeyBody = typeof body?.idempotencyKey === "string" ? body.idempotencyKey.trim() : undefined;
  const idempotencyKey = requestIdempotencyKeyHeader || requestIdempotencyKeyBody;

  try {
    const { job, batch, items } = prepareNextMintBatch({
      jobId,
      idempotencyKey,
      actorPubkey: adminPubkey
    });

    return NextResponse.json({
      job,
      batch,
      items,
      progress: calculateMintJobProgress(job)
    });
  } catch (error) {
    if (isMintOrchestratorError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Could not prepare next batch." }, { status: 500 });
  }
}
