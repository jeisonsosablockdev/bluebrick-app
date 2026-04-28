import "server-only";

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
