import { describe, expect, it } from "vitest";

import {
  COLLECTION_BOOTSTRAP_DRY_RUN_VERSION,
  buildCollectionBootstrapDryRunPlan,
  createCollectionBootstrapDryRunManifest
} from "@/lib/admin/collection-bootstrap-dry-run";
import type { UploadedFileRefWithCategory } from "@/lib/asset-uploads/types";

function buildUploadedFile(input: Partial<UploadedFileRefWithCategory> = {}): UploadedFileRefWithCategory {
  return {
    fileRefId: "file-ref-1",
    uploadId: "upload-1",
    actorPubkey: "Admin1111111111111111111111111111111111111",
    draftId: "draft-1",
    bucket: "uploads",
    objectKey: "draft-1/file-1.pdf",
    cdnUrl: "https://cdn.example.com/file-1.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
    contentMd5Base64: "AAAAAAAAAAAAAAAAAAAAAA==",
    etag: "\"etag\"",
    uploadedAt: "2026-04-23T10:00:00.000Z",
    createdAt: "2026-04-23T10:00:00.000Z",
    category: "brochureFile",
    ...input
  };
}

describe("lib/admin/collection-bootstrap-dry-run", () => {
  it("builds a plan with linked candidates and deterministic preflight failures", () => {
    const uploadsByDraftId = new Map<string, UploadedFileRefWithCategory[]>();
    uploadsByDraftId.set("draft-linked", [
      buildUploadedFile({
        fileRefId: "file-gallery-1",
        uploadId: "upload-gallery-1",
        draftId: "draft-linked",
        category: "galleryImage",
        objectKey: "draft-linked/gallery-1.jpg",
        cdnUrl: "https://cdn.example.com/gallery-1.jpg",
        mimeType: "image/jpeg"
      })
    ]);

    const plan = buildCollectionBootstrapDryRunPlan({
      entries: [
        {
          entryId: "entry-linked",
          title: "Linked entry",
          createdBy: "Admin111",
          collectionAddress: "Collection111",
          candyMachineAddress: "Candy111",
          documentsJson: []
        },
        {
          entryId: "entry-inconsistent",
          title: "Inconsistent entry",
          createdBy: "Admin111",
          collectionAddress: "Collection999",
          candyMachineAddress: "Candy111",
          documentsJson: []
        },
        {
          entryId: "entry-missing",
          title: "Missing snapshot entry",
          createdBy: "Admin111",
          collectionAddress: "CollectionMissing",
          candyMachineAddress: "CandyMissing",
          documentsJson: []
        },
        {
          entryId: "entry-no-draft",
          title: "Blank draft snapshot",
          createdBy: "Admin111",
          collectionAddress: "CollectionNoDraft",
          candyMachineAddress: "CandyNoDraft",
          documentsJson: []
        }
      ],
      snapshots: [
        {
          snapshotId: "snapshot-linked",
          createdBy: "Admin111",
          collectionAddress: "Collection111",
          candyMachineAddress: "Candy111",
          draftId: "draft-linked",
          formSnapshot: {
            uploadRefs: {
              galleryImages: ["file-gallery-1"]
            }
          }
        },
        {
          snapshotId: "snapshot-other",
          createdBy: "Admin111",
          collectionAddress: "CollectionOther",
          candyMachineAddress: "Candy111",
          draftId: "draft-other",
          formSnapshot: {}
        },
        {
          snapshotId: "snapshot-no-draft",
          createdBy: "Admin111",
          collectionAddress: "CollectionNoDraft",
          candyMachineAddress: "CandyNoDraft",
          draftId: "   ",
          formSnapshot: {}
        }
      ],
      uploadedFilesByDraftId: uploadsByDraftId
    });

    expect(plan.candidates).toHaveLength(1);
    expect(plan.candidates[0]).toMatchObject({
      entryId: "entry-linked",
      snapshotId: "snapshot-linked",
      draftId: "draft-linked"
    });
    expect(plan.candidates[0].uploadedFiles).toHaveLength(1);

    expect(plan.failures).toEqual([
      expect.objectContaining({
        entryId: "entry-inconsistent",
        failureReason: "inconsistent_snapshot_link",
        snapshotId: "snapshot-linked",
        draftId: "draft-linked"
      }),
      expect.objectContaining({
        entryId: "entry-missing",
        failureReason: "missing_snapshot",
        snapshotId: null,
        draftId: null
      }),
      expect.objectContaining({
        entryId: "entry-no-draft",
        failureReason: "missing_draft_id",
        snapshotId: "snapshot-no-draft",
        draftId: null
      })
    ]);
  });

  it("emits a versioned manifest with successes, manual review rows, and failures", () => {
    const manifest = createCollectionBootstrapDryRunManifest({
      generatedAt: "2026-04-23T16:00:00.000Z",
      version: COLLECTION_BOOTSTRAP_DRY_RUN_VERSION,
      failures: [
        {
          entryId: "entry-failed",
          title: "Failed entry",
          createdBy: "Admin111",
          collectionAddress: "CollectionFailed",
          candyMachineAddress: "CandyFailed",
          documentsJson: [],
          snapshotId: null,
          draftId: null,
          status: "failed",
          failureReason: "missing_snapshot",
          details: "No linked asset mint snapshot was found for the marketplace entry."
        }
      ],
      candidates: [
        {
          entryId: "entry-success",
          title: "Successful entry",
          createdBy: "Admin111",
          collectionAddress: "CollectionSuccess",
          candyMachineAddress: "CandySuccess",
          documentsJson: [],
          snapshotId: "snapshot-success",
          draftId: "draft-success",
          formSnapshot: {
            investmentThesis: "Stable yield profile.",
            longDescription: "Prime mixed-use building."
          },
          uploadedFiles: []
        },
        {
          entryId: "entry-review",
          title: "Manual review entry",
          createdBy: "Admin111",
          collectionAddress: "CollectionReview",
          candyMachineAddress: "CandyReview",
          documentsJson: [],
          snapshotId: "snapshot-review",
          draftId: "draft-review",
          formSnapshot: {
            longDescription: 42
          } as unknown as Record<string, unknown>,
          uploadedFiles: []
        },
        {
          entryId: "entry-exception",
          title: "Exception entry",
          createdBy: "Admin111",
          collectionAddress: "CollectionException",
          candyMachineAddress: "CandyException",
          documentsJson: [],
          snapshotId: "snapshot-exception",
          draftId: "draft-exception",
          formSnapshot: null as unknown as Record<string, unknown>,
          uploadedFiles: []
        }
      ]
    });

    expect(manifest).toMatchObject({
      version: COLLECTION_BOOTSTRAP_DRY_RUN_VERSION,
      dryRun: true,
      generatedAt: "2026-04-23T16:00:00.000Z",
      totals: {
        processed: 4,
        successes: 1,
        manualReviewRequired: 1,
        failures: 2
      }
    });
    expect(manifest.successes).toHaveLength(1);
    expect(manifest.successes[0]).toMatchObject({
      entryId: "entry-success",
      status: "ready"
    });
    expect(manifest.manualReviewRequired).toHaveLength(1);
    expect(manifest.manualReviewRequired[0]).toMatchObject({
      entryId: "entry-review",
      status: "manual_review_required"
    });
    expect(manifest.manualReviewRequired[0].reasonCodes).toContain("property_information_invalid");
    expect(manifest.failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entryId: "entry-failed",
          failureReason: "missing_snapshot"
        }),
        expect.objectContaining({
          entryId: "entry-exception",
          failureReason: "bootstrap_exception",
          snapshotId: "snapshot-exception",
          draftId: "draft-exception"
        })
      ])
    );
  });
});
