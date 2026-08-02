import { NextRequest, NextResponse } from "next/server";
import { createSolanaRpc, signature as solanaSignature } from "@solana/kit";

import { getRequestRole } from "@/lib/auth-session";
import {
  calculateMintJobProgress,
  getBatchSignatures,
  isMintOrchestratorError,
  reconcileMintJobSignatures
} from "@/lib/state/mint-orchestrator-store";
import { syncMintOrchestratorSnapshot } from "@/lib/mint-jobs/snapshot";
import { getSolanaRpcUrl } from "@/lib/infrastructure/solana";

type RouteParams = {
  params: Promise<{
    jobId: string;
  }>;
};

type ReconcileBody = {
  signatures?: unknown;
};

type SignatureResolution = {
  signature: string;
  confirmed: boolean;
  failed: boolean;
  errorMessage: string | null;
};

const SIGNATURE_STATUS_BATCH_LIMIT = 256;

function getAdminPubkey(request: NextRequest): string | null {
  const roleResult = getRequestRole(request);

  if (!roleResult.authenticated || roleResult.role !== "admin" || !roleResult.pubkey) {
    return null;
  }

  return roleResult.pubkey;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function normalizeSignatureList(input: unknown): string[] {
  if (input === undefined) {
    return [];
  }

  if (!Array.isArray(input)) {
    throw new Error("signatures must be an array of strings.");
  }

  const signatures = input
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);

  return Array.from(new Set(signatures));
}

async function resolveSignatures(signatures: string[]): Promise<SignatureResolution[]> {
  if (signatures.length === 0) {
    return [];
  }

  const rpc = createSolanaRpc(getSolanaRpcUrl());
  const resolutions: SignatureResolution[] = [];

  for (const signatureChunk of chunkArray(signatures, SIGNATURE_STATUS_BATCH_LIMIT)) {
    const statuses = await rpc.getSignatureStatuses(signatureChunk.map((sig) => solanaSignature(sig)), {
      searchTransactionHistory: true
    }).send();

    signatureChunk.forEach((signature, index) => {
      const status = statuses.value[index];
      const confirmationStatus = status?.confirmationStatus;
      const confirmed = confirmationStatus === "confirmed" || confirmationStatus === "finalized";
      const failed = Boolean(status?.err);

      resolutions.push({
        signature,
        confirmed,
        failed,
        errorMessage: failed ? JSON.stringify(status?.err ?? "Unknown signature error.") : null
      });
    });
  }

  return resolutions;
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const adminPubkey = getAdminPubkey(request);

  if (!adminPubkey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { jobId } = await params;
  const body = (await request.json().catch(() => ({}))) as ReconcileBody;

  let requestedSignatures: string[];

  try {
    requestedSignatures = normalizeSignatureList(body.signatures);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid signatures payload." }, { status: 400 });
  }

  try {
    const signaturesToResolve = requestedSignatures.length > 0 ? requestedSignatures : getBatchSignatures(jobId);
    const resolutions = await resolveSignatures(signaturesToResolve);
    const { job, updatedItems } = reconcileMintJobSignatures({
      jobId,
      actorPubkey: adminPubkey,
      resolutions
    });
    await syncMintOrchestratorSnapshot(job);

    return NextResponse.json({
      job,
      updatedItems,
      progress: calculateMintJobProgress(job),
      checkedSignatures: signaturesToResolve.length
    });
  } catch (error) {
    if (isMintOrchestratorError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Could not reconcile mint job signatures." }, { status: 500 });
  }
}
