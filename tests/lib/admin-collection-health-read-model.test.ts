import { describe, expect, it } from "vitest";

import {
  buildAdminCollectionHealthCta,
  COLLECTION_HEALTH_V1_STATES,
  getAdminCollectionHealthPriority,
  isAdminCollectionHealthState,
  mapConsistencyCollectionHealthRows
} from "@/lib/admin/collection-health-read-model";

describe("lib/admin/collection-health-read-model", () => {
  it("locks the approved v1 health vocabulary", () => {
    expect(COLLECTION_HEALTH_V1_STATES).toEqual([
      "missing_snapshot",
      "inconsistent",
      "bootstrap_failed",
      "manual_review_required"
    ]);
    expect(COLLECTION_HEALTH_V1_STATES).not.toContain("orphaned_uploads_detected");
  });

  it("exposes a type guard for supported health states", () => {
    expect(isAdminCollectionHealthState("missing_snapshot")).toBe(true);
    expect(isAdminCollectionHealthState("manual_review_required")).toBe(true);
    expect(isAdminCollectionHealthState("orphaned_uploads_detected")).toBe(false);
  });

  it("keeps the severity priority stable for downstream dedupe rules", () => {
    expect(getAdminCollectionHealthPriority("missing_snapshot")).toBeLessThan(
      getAdminCollectionHealthPriority("inconsistent")
    );
    expect(getAdminCollectionHealthPriority("bootstrap_failed")).toBeLessThan(
      getAdminCollectionHealthPriority("manual_review_required")
    );
  });

  it("builds the collection-context CTA only when an entry id exists", () => {
    expect(buildAdminCollectionHealthCta(" entry-123 ")).toEqual({
      href: "/admin/collections/entry-123",
      label: "View collection context"
    });
    expect(buildAdminCollectionHealthCta("   ")).toBeNull();
  });

  it("maps only degraded consistency rows into the health-row contract", () => {
    const rows = mapConsistencyCollectionHealthRows([
      {
        entryId: "entry-linked",
        title: "Ready collection",
        coverImageUrl: "/cover-linked.png",
        collectionAddress: "CollectionLinked",
        candyMachineAddress: "CandyLinked",
        updatedAt: "2026-04-28T10:00:00.000Z",
        validationState: "linked",
        editableSections: ["summary"]
      },
      {
        entryId: "entry-missing",
        title: "Missing snapshot",
        coverImageUrl: "/cover-missing.png",
        collectionAddress: "CollectionMissing",
        candyMachineAddress: "CandyMissing",
        updatedAt: "2026-04-28T11:00:00.000Z",
        validationState: "missing_snapshot",
        editableSections: []
      },
      {
        entryId: "entry-inconsistent",
        title: "Inconsistent snapshot link",
        coverImageUrl: "/cover-inconsistent.png",
        collectionAddress: "CollectionInconsistent",
        candyMachineAddress: "CandyInconsistent",
        updatedAt: "2026-04-28T12:00:00.000Z",
        validationState: "inconsistent",
        editableSections: []
      }
    ]);

    expect(rows).toEqual([
      {
        entryId: "entry-missing",
        title: "Missing snapshot",
        collectionAddress: "CollectionMissing",
        candyMachineAddress: "CandyMissing",
        healthState: "missing_snapshot",
        source: "consistency",
        failureReason: "No linked asset mint snapshot was found for the marketplace entry.",
        lastCheckedAt: "2026-04-28T11:00:00.000Z",
        cta: {
          href: "/admin/collections/entry-missing",
          label: "View collection context"
        }
      },
      {
        entryId: "entry-inconsistent",
        title: "Inconsistent snapshot link",
        collectionAddress: "CollectionInconsistent",
        candyMachineAddress: "CandyInconsistent",
        healthState: "inconsistent",
        source: "consistency",
        failureReason:
          "A related asset mint snapshot exists, but collection and candy machine addresses do not both match.",
        lastCheckedAt: "2026-04-28T12:00:00.000Z",
        cta: {
          href: "/admin/collections/entry-inconsistent",
          label: "View collection context"
        }
      }
    ]);
  });
});
