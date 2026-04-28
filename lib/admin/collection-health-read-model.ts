import "server-only";

import type {
  CollectionBootstrapDryRunFailureItem,
  CollectionBootstrapDryRunManifest
} from "@/lib/admin/collection-bootstrap-dry-run";
import type { CollectionBootstrapReasonCode } from "@/lib/admin/collection-bootstrap-mapper";
import type { AdminCollectionReadModel } from "@/lib/admin/collections-read-model";

export const COLLECTION_HEALTH_V1_STATES = [
  "missing_snapshot",
  "inconsistent",
  "bootstrap_failed",
  "manual_review_required"
] as const;

export type AdminCollectionHealthState = (typeof COLLECTION_HEALTH_V1_STATES)[number];

export type AdminCollectionHealthSource = "consistency" | "bootstrap";

export type AdminCollectionHealthCta = {
  href: string;
  label: string;
};

export type AdminCollectionHealthRow = {
  entryId: string;
  title: string;
  collectionAddress: string;
  candyMachineAddress: string;
  healthState: AdminCollectionHealthState;
  source: AdminCollectionHealthSource;
  failureReason: string;
  lastCheckedAt: string;
  cta: AdminCollectionHealthCta | null;
};

const HEALTH_STATE_PRIORITY: Record<AdminCollectionHealthState, number> = {
  missing_snapshot: 1,
  inconsistent: 2,
  bootstrap_failed: 3,
  manual_review_required: 4
};

export function isAdminCollectionHealthState(value: string): value is AdminCollectionHealthState {
  return (COLLECTION_HEALTH_V1_STATES as readonly string[]).includes(value);
}

export function getAdminCollectionHealthPriority(state: AdminCollectionHealthState): number {
  return HEALTH_STATE_PRIORITY[state];
}

export function buildAdminCollectionHealthCta(entryId: string): AdminCollectionHealthCta | null {
  const normalizedEntryId = entryId.trim();
  if (!normalizedEntryId) {
    return null;
  }

  return {
    href: `/admin/collections/${normalizedEntryId}`,
    label: "View collection context"
  };
}

function getConsistencyFailureReason(collection: AdminCollectionReadModel): string {
  switch (collection.validationState) {
    case "missing_snapshot":
      return "No linked asset mint snapshot was found for the marketplace entry.";
    case "inconsistent":
      return "A related asset mint snapshot exists, but collection and candy machine addresses do not both match.";
    default:
      return "Collection consistency requires manual inspection.";
  }
}

export function mapConsistencyCollectionHealthRows(
  collections: AdminCollectionReadModel[]
): AdminCollectionHealthRow[] {
  return collections
    .filter(
      (collection) =>
        collection.validationState === "missing_snapshot" || collection.validationState === "inconsistent"
    )
    .map((collection) => ({
      entryId: collection.entryId,
      title: collection.title,
      collectionAddress: collection.collectionAddress,
      candyMachineAddress: collection.candyMachineAddress,
      healthState: collection.validationState,
      source: "consistency",
      failureReason: getConsistencyFailureReason(collection),
      lastCheckedAt: collection.updatedAt,
      cta: buildAdminCollectionHealthCta(collection.entryId)
    }));
}

const BOOTSTRAP_FAILURE_STATES = new Set<CollectionBootstrapDryRunFailureItem["failureReason"]>([
  "missing_draft_id",
  "bootstrap_exception"
]);

function humanizeBootstrapReasonCode(reasonCode: CollectionBootstrapReasonCode): string {
  return reasonCode.replaceAll("_", " ");
}

function getManualReviewFailureReason(reasonCodes: CollectionBootstrapReasonCode[]): string {
  if (reasonCodes.length === 0) {
    return "Bootstrap mapping requires manual review.";
  }

  return `Bootstrap mapping requires manual review: ${reasonCodes.map(humanizeBootstrapReasonCode).join(", ")}.`;
}

export function mapBootstrapCollectionHealthRows(
  manifest: CollectionBootstrapDryRunManifest
): AdminCollectionHealthRow[] {
  const manualReviewRows = manifest.manualReviewRequired.map<AdminCollectionHealthRow>((item) => ({
    entryId: item.entryId,
    title: item.title,
    collectionAddress: item.collectionAddress,
    candyMachineAddress: item.candyMachineAddress,
    healthState: "manual_review_required",
    source: "bootstrap",
    failureReason: getManualReviewFailureReason(item.reasonCodes),
    lastCheckedAt: manifest.generatedAt,
    cta: buildAdminCollectionHealthCta(item.entryId)
  }));

  const bootstrapFailureRows = manifest.failures
    .filter((item) => BOOTSTRAP_FAILURE_STATES.has(item.failureReason))
    .map<AdminCollectionHealthRow>((item) => ({
      entryId: item.entryId,
      title: item.title,
      collectionAddress: item.collectionAddress,
      candyMachineAddress: item.candyMachineAddress,
      healthState: "bootstrap_failed",
      source: "bootstrap",
      failureReason: item.details,
      lastCheckedAt: manifest.generatedAt,
      cta: buildAdminCollectionHealthCta(item.entryId)
    }));

  return [...manualReviewRows, ...bootstrapFailureRows];
}
