import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { DasClient, isDasClientError } from "@/lib/das-client";
import {
  calculateMintJobProgress,
  getMintJob,
  isMintOrchestratorError,
  reconcileMintJobSignatures,
  type MintItemRecord,
  type MintJobRecord
} from "@/lib/mint-orchestrator-store";
import { syncMintOrchestratorSnapshot } from "@/lib/mint-jobs/snapshot";

type RouteParams = {
  params: Promise<{
    jobId: string;
  }>;
};

type ReconcileDasBody = {
  owner?: unknown;
  collectionAddress?: unknown;
  page?: unknown;
  limit?: unknown;
  maxPages?: unknown;
};

type DasGroupingItem = {
  group_key?: unknown;
  group_value?: unknown;
};

type ReconcileScope = {
  owner: string | null;
  collectionAddress: string | null;
};

type SignatureResolution = {
  signature: string;
  confirmed: boolean;
  failed: boolean;
  errorMessage: string | null;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;
const DEFAULT_MAX_PAGES = 10;
const MAX_LIMIT = 1000;
const MAX_MAX_PAGES = 100;

function getAdminPubkey(request: NextRequest): string | null {
  const roleResult = getRequestRole(request);

  if (!roleResult.authenticated || roleResult.role !== "admin" || !roleResult.pubkey) {
    return null;
  }

  return roleResult.pubkey;
}

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return input as Record<string, unknown>;
}

function asNonEmptyString(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asPositiveInt(input: unknown): number | null {
  if (typeof input !== "number" || !Number.isInteger(input) || input < 1) {
    return null;
  }

  return input;
}

function normalizePaging(input: ReconcileDasBody): { page: number; limit: number; maxPages: number } {
  const page = asPositiveInt(input.page) ?? DEFAULT_PAGE;
  const limit = Math.min(asPositiveInt(input.limit) ?? DEFAULT_LIMIT, MAX_LIMIT);
  const maxPages = Math.min(asPositiveInt(input.maxPages) ?? DEFAULT_MAX_PAGES, MAX_MAX_PAGES);

  return { page, limit, maxPages };
}

function resolveScope(job: MintJobRecord, input: ReconcileDasBody): ReconcileScope {
  const owner = asNonEmptyString(input.owner);
  const collectionAddress = asNonEmptyString(input.collectionAddress) ?? job.collectionAddress;

  if (!owner && !collectionAddress) {
    throw new Error("owner or collectionAddress is required.");
  }

  return {
    owner: owner ?? null,
    collectionAddress: collectionAddress ?? null
  };
}

function resolveCollectionFromAsset(input: unknown): string | null {
  const item = asRecord(input);
  const grouping = item.grouping;

  if (!Array.isArray(grouping)) {
    return null;
  }

  const collectionEntry = grouping.find((entry) => {
    if (!entry || typeof entry !== "object") {
      return false;
    }

    const typed = entry as DasGroupingItem;
    return typed.group_key === "collection" && typeof typed.group_value === "string";
  }) as DasGroupingItem | undefined;

  return collectionEntry && typeof collectionEntry.group_value === "string"
    ? collectionEntry.group_value
    : null;
}

function shouldKeepAsset(input: unknown, collectionAddress: string | null): boolean {
  if (!collectionAddress) {
    return true;
  }

  const assetCollection = resolveCollectionFromAsset(input);

  if (!assetCollection) {
    return false;
  }

  return assetCollection === collectionAddress;
}

function resolveAssetAddress(input: unknown): string | null {
  const item = asRecord(input);
  return asNonEmptyString(item.id);
}

function collectSubmittedTargets(job: MintJobRecord): MintItemRecord[] {
  return job.items.filter((item) => {
    return item.status === "submitted" && Boolean(item.signature) && Boolean(item.expectedAddress);
  });
}

function toResolutions(items: MintItemRecord[], confirmedAddresses: Set<string>): SignatureResolution[] {
  const resolutions: SignatureResolution[] = [];

  for (const item of items) {
    if (!item.signature || !item.expectedAddress) {
      continue;
    }

    if (!confirmedAddresses.has(item.expectedAddress)) {
      continue;
    }

    resolutions.push({
      signature: item.signature,
      confirmed: true,
      failed: false,
      errorMessage: null
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
  const body = (await request.json().catch(() => ({}))) as ReconcileDasBody;

  let job: MintJobRecord;
  let scope: ReconcileScope;
  let paging: { page: number; limit: number; maxPages: number };

  try {
    job = getMintJob(jobId);
    scope = resolveScope(job, body);
    paging = normalizePaging(body);
  } catch (error) {
    if (isMintOrchestratorError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid reconcile payload." },
      { status: 400 }
    );
  }

  const submittedTargets = collectSubmittedTargets(job);

  if (submittedTargets.length === 0) {
    return NextResponse.json({
      job,
      updatedItems: [],
      progress: calculateMintJobProgress(job),
      das: {
        mode: scope.owner ? "owner" : "collection",
        page: paging.page,
        limit: paging.limit,
        pagesFetched: 0,
        assetsScanned: 0,
        matchedAssets: 0,
        resolvedSignatures: 0,
        nextPage: null
      }
    });
  }

  const targetAddresses = new Set(
    submittedTargets
      .map((item) => item.expectedAddress)
      .filter((address): address is string => Boolean(address))
  );
  const confirmedAddresses = new Set<string>();
  const dasClient = new DasClient();

  let page = paging.page;
  let pagesFetched = 0;
  let assetsScanned = 0;
  let nextPage: number | null = null;

  try {
    while (pagesFetched < paging.maxPages && confirmedAddresses.size < targetAddresses.size) {
      const pageResult = scope.owner
        ? await dasClient.getAssetsByOwner(scope.owner, { page, limit: paging.limit })
        : await dasClient.getAssetsByCollection(scope.collectionAddress as string, { page, limit: paging.limit });

      pagesFetched += 1;
      assetsScanned += pageResult.items.length;

      for (const rawItem of pageResult.items) {
        if (!shouldKeepAsset(rawItem, scope.collectionAddress)) {
          continue;
        }

        const assetAddress = resolveAssetAddress(rawItem);

        if (!assetAddress || !targetAddresses.has(assetAddress)) {
          continue;
        }

        confirmedAddresses.add(assetAddress);
      }

      if (pageResult.items.length < paging.limit) {
        nextPage = null;
        break;
      }

      page += 1;
      nextPage = page;
    }

    const resolutions = toResolutions(submittedTargets, confirmedAddresses);
    const reconciliation = resolutions.length > 0
      ? reconcileMintJobSignatures({
          jobId,
          actorPubkey: adminPubkey,
          resolutions
        })
      : {
          job: getMintJob(jobId),
          updatedItems: []
        };
    const updatedJob = reconciliation.job;
    await syncMintOrchestratorSnapshot(updatedJob);

    return NextResponse.json({
      job: updatedJob,
      updatedItems: reconciliation.updatedItems,
      progress: calculateMintJobProgress(updatedJob),
      das: {
        mode: scope.owner ? "owner" : "collection",
        owner: scope.owner,
        collectionAddress: scope.collectionAddress,
        page: paging.page,
        limit: paging.limit,
        maxPages: paging.maxPages,
        pagesFetched,
        assetsScanned,
        matchedAssets: confirmedAddresses.size,
        resolvedSignatures: resolutions.length,
        nextPage
      }
    });
  } catch (error) {
    if (isDasClientError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    if (isMintOrchestratorError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Could not reconcile using DAS." }, { status: 500 });
  }
}
