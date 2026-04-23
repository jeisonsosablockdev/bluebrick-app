import { describe, expect, it } from "vitest";

import { mapCollectionBootstrapFromSnapshot, type CollectionBootstrapInput } from "@/lib/admin/collection-bootstrap-mapper";
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

function buildInput(input: Partial<CollectionBootstrapInput> = {}): CollectionBootstrapInput {
  return {
    formSnapshot: {},
    uploadedFiles: [],
    existingDocumentsJson: [],
    ...input
  };
}

describe("lib/admin/collection-bootstrap-mapper", () => {
  it("maps snapshot text and typed uploads deterministically while deduping existing documents", () => {
    const result = mapCollectionBootstrapFromSnapshot(
      buildInput({
        formSnapshot: {
          investmentThesis: "Monthly distributions from stabilized rents.",
          longDescription: "A coastal mixed-use project.",
          galleryImages: ["https://cdn.example.com/gallery-fallback.jpg"],
          propertyImages: ["https://cdn.example.com/property-fallback.jpg"],
          brochureFile: "https://cdn.example.com/brochure.pdf",
          legalDocs: ["https://cdn.example.com/legal-1.pdf"],
          financialDocs: ["https://cdn.example.com/financial-1.pdf"],
          uploadRefs: {
            galleryImages: ["file-gallery-2", "file-gallery-1"],
            propertyImages: ["file-property-1"],
            brochureFile: ["file-brochure-1"],
            legalDocs: ["file-legal-1"],
            financialDocs: ["file-financial-1"]
          }
        },
        uploadedFiles: [
          buildUploadedFile({
            fileRefId: "file-gallery-1",
            uploadId: "upload-gallery-1",
            category: "galleryImage",
            objectKey: "draft-1/gallery-1.jpg",
            cdnUrl: "https://cdn.example.com/gallery-1.jpg",
            mimeType: "image/jpeg",
            uploadedAt: "2026-04-23T10:02:00.000Z"
          }),
          buildUploadedFile({
            fileRefId: "file-financial-1",
            uploadId: "upload-financial-1",
            category: "financialDoc",
            objectKey: "draft-1/financial-1.pdf",
            cdnUrl: "https://cdn.example.com/financial-1.pdf"
          }),
          buildUploadedFile({
            fileRefId: "file-gallery-2",
            uploadId: "upload-gallery-2",
            category: "galleryImage",
            objectKey: "draft-1/gallery-2.jpg",
            cdnUrl: "https://cdn.example.com/gallery-2.jpg",
            mimeType: "image/jpeg",
            uploadedAt: "2026-04-23T10:01:00.000Z"
          }),
          buildUploadedFile({
            fileRefId: "file-property-1",
            uploadId: "upload-property-1",
            category: "propertyImage",
            objectKey: "draft-1/property-1.jpg",
            cdnUrl: "https://cdn.example.com/property-1.jpg",
            mimeType: "image/jpeg"
          }),
          buildUploadedFile({
            fileRefId: "file-brochure-1",
            uploadId: "upload-brochure-1",
            category: "brochureFile",
            objectKey: "draft-1/brochure.pdf",
            cdnUrl: "https://cdn.example.com/brochure.pdf"
          }),
          buildUploadedFile({
            fileRefId: "file-legal-1",
            uploadId: "upload-legal-1",
            category: "legalDoc",
            objectKey: "draft-1/legal-1.pdf",
            cdnUrl: "https://cdn.example.com/legal-1.pdf"
          })
        ],
        existingDocumentsJson: [
          {
            id: "existing-brochure",
            label: "Brochure",
            url: "https://cdn.example.com/brochure.pdf"
          },
          {
            id: "existing-dd",
            label: "Due diligence",
            url: "https://cdn.example.com/dd.pdf"
          }
        ]
      })
    );

    expect(result.status).toBe("ready");
    expect(result.reasonCodes).toEqual([]);
    expect(result.payload.galleryImagesJson.map((item) => item.url)).toEqual([
      "https://cdn.example.com/gallery-2.jpg",
      "https://cdn.example.com/gallery-1.jpg",
      "https://cdn.example.com/gallery-fallback.jpg"
    ]);
    expect(result.payload.propertyImagesJson.map((item) => item.url)).toEqual([
      "https://cdn.example.com/property-1.jpg",
      "https://cdn.example.com/property-fallback.jpg"
    ]);
    expect(result.payload.documentsJson.map((item) => [item.tag, item.url])).toEqual([
      ["brochure", "https://cdn.example.com/brochure.pdf"],
      ["other", "https://cdn.example.com/dd.pdf"],
      ["legal", "https://cdn.example.com/legal-1.pdf"],
      ["financial", "https://cdn.example.com/financial-1.pdf"]
    ]);
    expect(result.payload.fractionalInvestmentSummary).toBe("Monthly distributions from stabilized rents.");
    expect(result.payload.propertyInformation).toBe("A coastal mixed-use project.");
    expect(result.payload.googleMapsPlaceJson).toBeNull();
  });

  it("falls back to snapshot URLs and uses sorted uploads when uploadRefs are absent", () => {
    const result = mapCollectionBootstrapFromSnapshot(
      buildInput({
        formSnapshot: {
          galleryImages: ["https://cdn.example.com/gallery-a.jpg", "https://cdn.example.com/gallery-b.jpg"],
          propertyImages: "https://cdn.example.com/property-a.jpg"
        },
        uploadedFiles: [
          buildUploadedFile({
            fileRefId: "file-legal-2",
            uploadId: "upload-legal-2",
            category: "legalDoc",
            objectKey: "draft-1/legal-2.pdf",
            cdnUrl: "https://cdn.example.com/legal-2.pdf",
            uploadedAt: "2026-04-23T10:02:00.000Z"
          }),
          buildUploadedFile({
            fileRefId: "file-legal-1",
            uploadId: "upload-legal-1",
            category: "legalDoc",
            objectKey: "draft-1/legal-1.pdf",
            cdnUrl: "https://cdn.example.com/legal-1.pdf",
            uploadedAt: "2026-04-23T10:01:00.000Z"
          })
        ]
      })
    );

    expect(result.status).toBe("ready");
    expect(result.payload.galleryImagesJson.map((item) => item.source)).toEqual(["snapshot", "snapshot"]);
    expect(result.payload.propertyImagesJson.map((item) => item.url)).toEqual(["https://cdn.example.com/property-a.jpg"]);
    expect(result.payload.documentsJson.map((item) => item.url)).toEqual([
      "https://cdn.example.com/legal-1.pdf",
      "https://cdn.example.com/legal-2.pdf"
    ]);
  });

  it("marks corrupt snapshot shapes and unresolved refs for manual review while still returning safe payload", () => {
    const result = mapCollectionBootstrapFromSnapshot(
      buildInput({
        formSnapshot: {
          longDescription: 42,
          galleryImages: [],
          uploadRefs: {
            galleryImages: ["missing-gallery-ref"]
          },
          googleMapsPlaceJson: {
            placeLabel: "Tower A"
          }
        }
      })
    );

    expect(result.status).toBe("manual_review_required");
    expect(result.reasonCodes).toEqual(
      expect.arrayContaining([
        "gallery_upload_refs_unresolved",
        "property_information_invalid",
        "google_maps_place_invalid"
      ])
    );
    expect(result.payload.galleryImagesJson).toEqual([]);
    expect(result.payload.propertyInformation).toBeNull();
    expect(result.payload.googleMapsPlaceJson).toBeNull();
  });
});
