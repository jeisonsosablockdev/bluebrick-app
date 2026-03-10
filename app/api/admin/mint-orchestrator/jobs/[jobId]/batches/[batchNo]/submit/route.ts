import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  calculateMintJobProgress,
  isMintOrchestratorError,
  submitMintBatch
} from "@/lib/mint-orchestrator-store";

type RouteParams = {
  params: Promise<{
    jobId: string;
    batchNo: string;
  }>;
};

type SubmitBatchBody = {
  submissions?: Array<{
    itemId?: unknown;
    serial?: unknown;
    signature?: unknown;
    expectedAddress?: unknown;
  }>;
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

  const { jobId, batchNo: batchNoParam } = await params;
  const batchNo = Number(batchNoParam);
  const body = (await request.json().catch(() => null)) as SubmitBatchBody | null;

  if (!Number.isInteger(batchNo) || batchNo < 1) {
    return NextResponse.json({ error: "batchNo must be a positive integer." }, { status: 400 });
  }

  if (!body || !Array.isArray(body.submissions)) {
    return NextResponse.json({ error: "submissions must be an array." }, { status: 400 });
  }

  try {
    const { job, batch, items } = submitMintBatch({
      jobId,
      batchNo,
      actorPubkey: adminPubkey,
      submissions: body.submissions.map((submission, index) => {
        if (
          !submission ||
          typeof submission.itemId !== "string" ||
          typeof submission.serial !== "number" ||
          typeof submission.signature !== "string"
        ) {
          throw new Error(`Invalid submission at index ${index}.`);
        }

        return {
          itemId: submission.itemId,
          serial: submission.serial,
          signature: submission.signature,
          expectedAddress: typeof submission.expectedAddress === "string" ? submission.expectedAddress : undefined
        };
      })
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

    if (error instanceof Error && error.message.startsWith("Invalid submission at index")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Could not submit batch signatures." }, { status: 500 });
  }
}
