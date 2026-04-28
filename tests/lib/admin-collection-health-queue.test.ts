import { beforeEach, describe, expect, it, vi } from "vitest";

const healthQueueMocks = vi.hoisted(() => ({
  listAdminCollectionReadModels: vi.fn(),
  runCollectionBootstrapDryRun: vi.fn()
}));

vi.mock("@/lib/admin/collections-read-model", () => ({
  listAdminCollectionReadModels: healthQueueMocks.listAdminCollectionReadModels
}));

vi.mock("@/lib/admin/collection-bootstrap-dry-run", () => ({
  runCollectionBootstrapDryRun: healthQueueMocks.runCollectionBootstrapDryRun
}));

import {
  listAdminCollectionHealthRows,
  mergeAdminCollectionHealthRows
} from "@/lib/admin/collection-health-read-model";

describe("lib/admin/collection-health-read-model queue aggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dedupes by entry id using severity priority before recency", () => {
    const rows = mergeAdminCollectionHealthRows([
      {
        entryId: "entry-1",
        title: "Tower",
        collectionAddress: "Collection1",
        candyMachineAddress: "Candy1",
        healthState: "missing_snapshot",
        source: "consistency",
        failureReason: "No snapshot",
        lastCheckedAt: "2026-04-28T10:00:00.000Z",
        cta: null
      },
      {
        entryId: "entry-1",
        title: "Tower",
        collectionAddress: "Collection1",
        candyMachineAddress: "Candy1",
        healthState: "manual_review_required",
        source: "bootstrap",
        failureReason: "Review required",
        lastCheckedAt: "2026-04-28T09:00:00.000Z",
        cta: null
      },
      {
        entryId: "entry-2",
        title: "Harbor",
        collectionAddress: "Collection2",
        candyMachineAddress: "Candy2",
        healthState: "bootstrap_failed",
        source: "bootstrap",
        failureReason: "Failed",
        lastCheckedAt: "2026-04-28T12:00:00.000Z",
        cta: null
      }
    ]);

    expect(rows.map((row) => [row.entryId, row.healthState])).toEqual([
      ["entry-1", "manual_review_required"],
      ["entry-2", "bootstrap_failed"]
    ]);
  });

  it("aggregates actor-scoped consistency and bootstrap rows", async () => {
    healthQueueMocks.listAdminCollectionReadModels.mockResolvedValue([
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
        entryId: "entry-linked",
        title: "Linked collection",
        coverImageUrl: "/cover-linked.png",
        collectionAddress: "CollectionLinked",
        candyMachineAddress: "CandyLinked",
        updatedAt: "2026-04-28T10:00:00.000Z",
        validationState: "linked",
        editableSections: ["summary"]
      }
    ]);

    healthQueueMocks.runCollectionBootstrapDryRun.mockResolvedValue({
      version: "2026-04-23-v1",
      dryRun: true,
      generatedAt: "2026-04-28T13:00:00.000Z",
      totals: {
        processed: 2,
        successes: 0,
        manualReviewRequired: 1,
        failures: 1
      },
      successes: [],
      manualReviewRequired: [
        {
          entryId: "entry-review",
          title: "Manual review entry",
          createdBy: "Admin111",
          snapshotId: "snapshot-review",
          draftId: "draft-review",
          collectionAddress: "CollectionReview",
          candyMachineAddress: "CandyReview",
          status: "manual_review_required",
          reasonCodes: ["google_maps_place_invalid"],
          warnings: [],
          payload: {
            galleryImagesJson: [],
            propertyImagesJson: [],
            documentsJson: [],
            fractionalInvestmentSummary: null,
            propertyInformation: null,
            googleMapsPlaceJson: null
          }
        }
      ],
      failures: [
        {
          entryId: "entry-missing",
          title: "Missing snapshot",
          createdBy: "Admin111",
          collectionAddress: "CollectionMissing",
          candyMachineAddress: "CandyMissing",
          documentsJson: [],
          snapshotId: null,
          draftId: null,
          status: "failed",
          failureReason: "missing_snapshot",
          details: "No linked asset mint snapshot was found for the marketplace entry."
        }
      ]
    });

    const rows = await listAdminCollectionHealthRows(" Admin111 ");

    expect(healthQueueMocks.listAdminCollectionReadModels).toHaveBeenCalledWith("Admin111");
    expect(healthQueueMocks.runCollectionBootstrapDryRun).toHaveBeenCalledWith({
      actorPubkey: "Admin111"
    });
    expect(rows.map((row) => [row.entryId, row.healthState])).toEqual([
      ["entry-review", "manual_review_required"],
      ["entry-missing", "missing_snapshot"]
    ]);
  });
});
