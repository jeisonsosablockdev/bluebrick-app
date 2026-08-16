import { listUploadedFileRefsByDraftIds } from "../asset-uploads/repository.ts";
import type { UploadedFileRefWithCategory } from "../asset-uploads/types.ts";
import {
  mapCollectionBootstrapFromSnapshot,
  type CollectionBootstrapPayload,
  type CollectionBootstrapReasonCode,
  type CollectionBootstrapStatus
} from "./collection-bootstrap-mapper.ts";
import { withDbClient } from "@/features/shared/infrastructure/db/pool";

export const COLLECTION_BOOTSTRAP_DRY_RUN_VERSION = "2026-04-23-v1";

export type CollectionBootstrapDryRunFailureReason =
  | "missing_snapshot"
  | "inconsistent_snapshot_link"
  | "missing_draft_id"
  | "bootstrap_exception";

export type CollectionBootstrapEntryRecord = {
  entryId: string;
  title: string;
  createdBy: string;
  collectionAddress: string;
  candyMachineAddress: string;
  documentsJson: unknown;
};

export type CollectionBootstrapSnapshotRecord = {
  snapshotId: string;
  createdBy: string;
  collectionAddress: string;
  candyMachineAddress: string;
  draftId: string;
  formSnapshot: Record<string, unknown>;
};

export type CollectionBootstrapDryRunCandidate = CollectionBootstrapEntryRecord & {
  snapshotId: string;
  draftId: string;
  formSnapshot: Record<string, unknown>;
  uploadedFiles: UploadedFileRefWithCategory[];
};

export type CollectionBootstrapDryRunFailureItem = CollectionBootstrapEntryRecord & {
  snapshotId: string | null;
  draftId: string | null;
  status: "failed";
  failureReason: CollectionBootstrapDryRunFailureReason;
  details: string;
};

export type CollectionBootstrapDryRunManifestItem = {
  entryId: string;
  title: string;
  createdBy: string;
  snapshotId: string;
  draftId: string;
  collectionAddress: string;
  candyMachineAddress: string;
  status: CollectionBootstrapStatus;
  reasonCodes: CollectionBootstrapReasonCode[];
  warnings: string[];
  payload: CollectionBootstrapPayload;
};

export type CollectionBootstrapDryRunManifest = {
  version: string;
  dryRun: true;
  generatedAt: string;
  totals: {
    processed: number;
    successes: number;
    manualReviewRequired: number;
    failures: number;
  };
  successes: CollectionBootstrapDryRunManifestItem[];
  manualReviewRequired: CollectionBootstrapDryRunManifestItem[];
  failures: CollectionBootstrapDryRunFailureItem[];
};

export type CollectionBootstrapDryRunPlan = {
  candidates: CollectionBootstrapDryRunCandidate[];
  failures: CollectionBootstrapDryRunFailureItem[];
};

type CollectionBootstrapEntryRow = {
  id: string;
  title: string;
  created_by: string;
  collection_address: string;
  asset_mint_address: string;
  documents_json: unknown;
};

type CollectionBootstrapSnapshotRow = {
  id: string;
  created_by: string;
  collection_address: string;
  candy_machine_address: string;
  draft_id: string;
  form_snapshot: Record<string, unknown>;
};

type ListCollectionBootstrapCandidatesInput = {
  actorPubkey?: string;
  entryIds?: string[];
};

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function buildEntryRecord(row: CollectionBootstrapEntryRow): CollectionBootstrapEntryRecord {
  return {
    entryId: row.id,
    title: row.title,
    createdBy: row.created_by,
    collectionAddress: row.collection_address,
    candyMachineAddress: row.asset_mint_address,
    documentsJson: row.documents_json
  };
}

function toFailureItem(
  entry: CollectionBootstrapEntryRecord,
  input: {
    snapshotId?: string | null;
    draftId?: string | null;
    failureReason: CollectionBootstrapDryRunFailureReason;
    details: string;
  }
): CollectionBootstrapDryRunFailureItem {
  return {
    ...entry,
    snapshotId: input.snapshotId ?? null,
    draftId: input.draftId ?? null,
    status: "failed",
    failureReason: input.failureReason,
    details: input.details
  };
}

function exactSnapshotKey(createdBy: string, collectionAddress: string, candyMachineAddress: string): string {
  return [createdBy.trim(), collectionAddress.trim(), candyMachineAddress.trim()].join("::");
}

function relatedSnapshotKey(createdBy: string, value: string): string {
  return [createdBy.trim(), value.trim()].join("::");
}

function indexSnapshots(snapshots: CollectionBootstrapSnapshotRecord[]): {
  byExactKey: Map<string, CollectionBootstrapSnapshotRecord[]>;
  byCollectionKey: Map<string, CollectionBootstrapSnapshotRecord[]>;
  byCandyMachineKey: Map<string, CollectionBootstrapSnapshotRecord[]>;
} {
  const byExactKey = new Map<string, CollectionBootstrapSnapshotRecord[]>();
  const byCollectionKey = new Map<string, CollectionBootstrapSnapshotRecord[]>();
  const byCandyMachineKey = new Map<string, CollectionBootstrapSnapshotRecord[]>();

  for (const snapshot of snapshots) {
    const exactKey = exactSnapshotKey(snapshot.createdBy, snapshot.collectionAddress, snapshot.candyMachineAddress);
    const collectionKey = relatedSnapshotKey(snapshot.createdBy, snapshot.collectionAddress);
    const candyMachineKey = relatedSnapshotKey(snapshot.createdBy, snapshot.candyMachineAddress);

    const exactMatches = byExactKey.get(exactKey) ?? [];
    exactMatches.push(snapshot);
    byExactKey.set(exactKey, exactMatches);

    const collectionMatches = byCollectionKey.get(collectionKey) ?? [];
    collectionMatches.push(snapshot);
    byCollectionKey.set(collectionKey, collectionMatches);

    const candyMachineMatches = byCandyMachineKey.get(candyMachineKey) ?? [];
    candyMachineMatches.push(snapshot);
    byCandyMachineKey.set(candyMachineKey, candyMachineMatches);
  }

  return { byExactKey, byCollectionKey, byCandyMachineKey };
}

export function buildCollectionBootstrapDryRunPlan(input: {
  entries: CollectionBootstrapEntryRecord[];
  snapshots: CollectionBootstrapSnapshotRecord[];
  uploadedFilesByDraftId: Map<string, UploadedFileRefWithCategory[]>;
}): CollectionBootstrapDryRunPlan {
  const snapshotIndex = indexSnapshots(input.snapshots);
  const candidates: CollectionBootstrapDryRunCandidate[] = [];
  const failures: CollectionBootstrapDryRunFailureItem[] = [];

  for (const entry of input.entries) {
    const exactMatches =
      snapshotIndex.byExactKey.get(exactSnapshotKey(entry.createdBy, entry.collectionAddress, entry.candyMachineAddress)) ?? [];

    if (exactMatches.length > 0) {
      const snapshot = exactMatches[0];
      const draftId = snapshot.draftId.trim();

      if (!draftId) {
        failures.push(
          toFailureItem(entry, {
            snapshotId: snapshot.snapshotId,
            failureReason: "missing_draft_id",
            details: "The linked asset mint snapshot does not contain a usable draftId."
          })
        );
        continue;
      }

      candidates.push({
        ...entry,
        snapshotId: snapshot.snapshotId,
        draftId,
        formSnapshot: snapshot.formSnapshot,
        uploadedFiles: input.uploadedFilesByDraftId.get(draftId) ?? []
      });
      continue;
    }

    const relatedSnapshots = new Map<string, CollectionBootstrapSnapshotRecord>();
    for (const snapshot of snapshotIndex.byCollectionKey.get(relatedSnapshotKey(entry.createdBy, entry.collectionAddress)) ?? []) {
      relatedSnapshots.set(snapshot.snapshotId, snapshot);
    }
    for (const snapshot of snapshotIndex.byCandyMachineKey.get(relatedSnapshotKey(entry.createdBy, entry.candyMachineAddress)) ?? []) {
      relatedSnapshots.set(snapshot.snapshotId, snapshot);
    }

    if (relatedSnapshots.size > 0) {
      const snapshot = relatedSnapshots.values().next().value as CollectionBootstrapSnapshotRecord;
      failures.push(
        toFailureItem(entry, {
          snapshotId: snapshot.snapshotId,
          draftId: snapshot.draftId,
          failureReason: "inconsistent_snapshot_link",
          details:
            "A related asset mint snapshot exists, but collectionAddress and candyMachineAddress do not both match the marketplace entry."
        })
      );
      continue;
    }

    failures.push(
      toFailureItem(entry, {
        failureReason: "missing_snapshot",
        details: "No linked asset mint snapshot was found for the marketplace entry."
      })
    );
  }

  return { candidates, failures };
}

export function createCollectionBootstrapDryRunManifest(input: {
  candidates: CollectionBootstrapDryRunCandidate[];
  failures?: CollectionBootstrapDryRunFailureItem[];
  generatedAt?: string;
  version?: string;
}): CollectionBootstrapDryRunManifest {
  const successes: CollectionBootstrapDryRunManifestItem[] = [];
  const manualReviewRequired: CollectionBootstrapDryRunManifestItem[] = [];
  const failures = [...(input.failures ?? [])];

  for (const candidate of input.candidates) {
    try {
      const result = mapCollectionBootstrapFromSnapshot({
        formSnapshot: candidate.formSnapshot,
        uploadedFiles: candidate.uploadedFiles,
        existingDocumentsJson: candidate.documentsJson
      });

      const manifestItem: CollectionBootstrapDryRunManifestItem = {
        entryId: candidate.entryId,
        title: candidate.title,
        createdBy: candidate.createdBy,
        snapshotId: candidate.snapshotId,
        draftId: candidate.draftId,
        collectionAddress: candidate.collectionAddress,
        candyMachineAddress: candidate.candyMachineAddress,
        status: result.status,
        reasonCodes: result.reasonCodes,
        warnings: result.warnings,
        payload: result.payload
      };

      if (result.status === "manual_review_required") {
        manualReviewRequired.push(manifestItem);
      } else {
        successes.push(manifestItem);
      }
    } catch (error) {
      failures.push(
        toFailureItem(candidate, {
          snapshotId: candidate.snapshotId,
          draftId: candidate.draftId,
          failureReason: "bootstrap_exception",
          details: error instanceof Error ? error.message : "Unknown bootstrap exception."
        })
      );
    }
  }

  return {
    version: input.version ?? COLLECTION_BOOTSTRAP_DRY_RUN_VERSION,
    dryRun: true,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    totals: {
      processed: successes.length + manualReviewRequired.length + failures.length,
      successes: successes.length,
      manualReviewRequired: manualReviewRequired.length,
      failures: failures.length
    },
    successes,
    manualReviewRequired,
    failures
  };
}

export async function listCollectionBootstrapDryRunPlan(
  input: ListCollectionBootstrapCandidatesInput = {}
): Promise<CollectionBootstrapDryRunPlan> {
  if (!isDatabaseConfigured()) {
    return { candidates: [], failures: [] };
  }

  const normalizedActorPubkey = input.actorPubkey?.trim() || null;
  const normalizedEntryIds = unique((input.entryIds ?? []).map((entryId) => entryId.trim()));

  return withDbClient(async (client) => {
    const whereClauses: string[] = [];
    const values: Array<string | string[]> = [];

    if (normalizedActorPubkey) {
      values.push(normalizedActorPubkey);
      whereClauses.push(`created_by = $${values.length}`);
    }

    if (normalizedEntryIds.length > 0) {
      values.push(normalizedEntryIds);
      whereClauses.push(`id = ANY($${values.length}::text[])`);
    }

    const entryQuery = `
      SELECT
        id,
        title,
        created_by,
        collection_address,
        asset_mint_address,
        documents_json
      FROM marketplace_entries
      ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""}
      ORDER BY created_at ASC, id ASC
    `;

    const entryResult = await client.query<CollectionBootstrapEntryRow>(entryQuery, values);
    if (entryResult.rowCount === 0) {
      return { candidates: [], failures: [] };
    }

    const entries = entryResult.rows.map(buildEntryRecord);
    const createdByValues = unique(entries.map((entry) => entry.createdBy));
    const collectionAddresses = unique(entries.map((entry) => entry.collectionAddress));
    const candyMachineAddresses = unique(entries.map((entry) => entry.candyMachineAddress));

    const snapshotResult = await client.query<CollectionBootstrapSnapshotRow>(
      `
        SELECT
          id,
          created_by,
          collection_address,
          candy_machine_address,
          draft_id,
          form_snapshot
        FROM asset_mint_snapshots
        WHERE created_by = ANY($1::text[])
          AND (
            collection_address = ANY($2::text[])
            OR candy_machine_address = ANY($3::text[])
          )
        ORDER BY updated_at DESC, created_at DESC
      `,
      [createdByValues, collectionAddresses, candyMachineAddresses]
    );

    const snapshots: CollectionBootstrapSnapshotRecord[] = snapshotResult.rows.map((row) => ({
      snapshotId: row.id,
      createdBy: row.created_by,
      collectionAddress: row.collection_address,
      candyMachineAddress: row.candy_machine_address,
      draftId: row.draft_id,
      formSnapshot: row.form_snapshot
    }));

    const exactLinkedDraftIds = unique(
      entries.flatMap((entry) => {
        const exactMatches = snapshots.filter(
          (snapshot) =>
            snapshot.createdBy === entry.createdBy &&
            snapshot.collectionAddress === entry.collectionAddress &&
            snapshot.candyMachineAddress === entry.candyMachineAddress
        );

        return exactMatches
          .map((snapshot) => snapshot.draftId.trim())
          .filter((draftId) => draftId.length > 0);
      })
    );

    const uploadedFilesByDraftId = await listUploadedFileRefsByDraftIds(exactLinkedDraftIds);

    return buildCollectionBootstrapDryRunPlan({
      entries,
      snapshots,
      uploadedFilesByDraftId
    });
  });
}

export async function runCollectionBootstrapDryRun(
  input: ListCollectionBootstrapCandidatesInput & {
    generatedAt?: string;
    version?: string;
  } = {}
): Promise<CollectionBootstrapDryRunManifest> {
  const plan = await listCollectionBootstrapDryRunPlan({
    actorPubkey: input.actorPubkey,
    entryIds: input.entryIds
  });

  return createCollectionBootstrapDryRunManifest({
    candidates: plan.candidates,
    failures: plan.failures,
    generatedAt: input.generatedAt,
    version: input.version
  });
}
