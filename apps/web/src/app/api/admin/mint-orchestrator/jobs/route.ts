import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  calculateMintJobProgress,
  createMintJob,
  isMintOrchestratorError,
  listMintJobs
} from "@/lib/state/mint-orchestrator-store";
import { syncMintOrchestratorSnapshot } from "@/lib/mint-jobs/snapshot";

type CreateMintJobBody = {
  totalItems?: unknown;
  batchSize?: unknown;
  startSerial?: unknown;
  collectionAddress?: unknown;
};

function getAdminPubkey(request: NextRequest): string | null {
  const roleResult = getRequestRole(request);

  if (!roleResult.authenticated || roleResult.role !== "admin" || !roleResult.pubkey) {
    return null;
  }

  return roleResult.pubkey;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const pubkey = getAdminPubkey(request);

  if (!pubkey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limitValue = Number(searchParams.get("limit") || 20);
  const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.floor(limitValue) : 20;
  const jobs = listMintJobs(limit).map((job) => ({
    ...job,
    progress: calculateMintJobProgress(job)
  }));

  return NextResponse.json({
    jobs
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const pubkey = getAdminPubkey(request);

  if (!pubkey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as CreateMintJobBody | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const job = createMintJob({
      createdBy: pubkey,
      totalItems: Number(body.totalItems),
      batchSize: body.batchSize === undefined ? 20 : Number(body.batchSize),
      startSerial: body.startSerial === undefined ? 1 : Number(body.startSerial),
      collectionAddress: typeof body.collectionAddress === "string" ? body.collectionAddress : undefined
    });
    await syncMintOrchestratorSnapshot(job);

    return NextResponse.json({
      job,
      progress: calculateMintJobProgress(job)
    });
  } catch (error) {
    if (isMintOrchestratorError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Could not create mint job." }, { status: 500 });
  }
}
