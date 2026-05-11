import { describe, expect, it } from "vitest";

import { toAdminCollectionsPageState } from "@/lib/admin/collections-page-state";

describe("lib/admin/collections-page-state", () => {
  it("keeps only linked rows in the main workspace while exposing the health queue href", () => {
    const state = toAdminCollectionsPageState({
      ok: true,
      data: [
        {
          entryId: "entry-ready",
          title: "Ready collection",
          coverImageUrl: "/cover-ready.png",
          collectionAddress: "CollectionReady",
          candyMachineAddress: "CandyReady",
          updatedAt: "2026-04-28T10:00:00.000Z",
          validationState: "linked",
          editableSections: ["summary"]
        },
        {
          entryId: "entry-review",
          title: "Review collection",
          coverImageUrl: "/cover-review.png",
          collectionAddress: "CollectionReview",
          candyMachineAddress: "CandyReview",
          updatedAt: "2026-04-28T11:00:00.000Z",
          validationState: "inconsistent",
          editableSections: []
        }
      ]
    });

    expect(state).toEqual({
      kind: "success",
      collections: [
        {
          entryId: "entry-ready",
          title: "Ready collection",
          coverImageUrl: "/cover-ready.png",
          collectionAddress: "CollectionReady",
          candyMachineAddress: "CandyReady",
          updatedAt: "2026-04-28T10:00:00.000Z",
          validationState: "linked",
          editableSections: ["summary"]
        }
      ],
      summary: {
        total: 2,
        linked: 1,
        reviewRequired: 1
      },
      healthQueueHref: "/admin/health/collections"
    });
  });
});
