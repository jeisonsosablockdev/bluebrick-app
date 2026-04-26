import { describe, expect, it, vi } from "vitest";

import {
  createEmptyAdminCollectionDocumentDraft,
  isAdminCollectionDocumentsDirty,
  normalizeAdminCollectionDocumentDrafts,
  updateAdminCollectionDocuments,
  AdminCollectionDocumentsMutationError
} from "@/lib/admin/admin-collection-documents-client";

describe("lib/admin/admin-collection-documents-client", () => {
  it("creates empty drafts with marketplace defaults", () => {
    expect(createEmptyAdminCollectionDocumentDraft({ index: 2 })).toEqual({
      id: "document-draft-2",
      tag: "other",
      title: "",
      label: "",
      description: "",
      url: "",
      displayOrder: 3,
      mimeType: null,
      fileName: null,
      fileRefId: null,
      source: "marketplace"
    });
  });

  it("normalizes drafts and rewrites displayOrder from list position", () => {
    const result = normalizeAdminCollectionDocumentDrafts([
      {
        id: "  document-1  ",
        tag: "legal",
        title: "  Operating Agreement ",
        label: " Agreement ",
        description: "  Core legal file.  ",
        url: " https://cdn.example.com/agreement.pdf ",
        displayOrder: 99,
        mimeType: " application/pdf ",
        fileName: " agreement.pdf ",
        fileRefId: " file-legal-1 ",
        source: "upload"
      }
    ]);

    expect(result).toEqual([
      {
        id: "document-1",
        tag: "legal",
        title: "Operating Agreement",
        label: "Agreement",
        description: "Core legal file.",
        url: "https://cdn.example.com/agreement.pdf",
        displayOrder: 1,
        mimeType: "application/pdf",
        fileName: "agreement.pdf",
        fileRefId: "file-legal-1",
        source: "upload"
      }
    ]);
  });

  it("detects dirty document arrays through normalized payload comparison", () => {
    const persistedDocuments = [
      {
        id: "document-1",
        tag: "brochure" as const,
        title: "Brochure",
        label: "Investor brochure",
        description: "",
        url: "https://cdn.example.com/brochure.pdf",
        displayOrder: 1,
        mimeType: "application/pdf",
        fileName: "brochure.pdf",
        fileRefId: "file-brochure-1",
        source: "upload" as const
      }
    ];

    expect(isAdminCollectionDocumentsDirty({
      persistedDocuments,
      draftDocuments: [
        {
          ...persistedDocuments[0]
        }
      ]
    })).toBe(false);

    expect(isAdminCollectionDocumentsDirty({
      persistedDocuments,
      draftDocuments: [
        {
          ...persistedDocuments[0],
          label: "Updated brochure"
        }
      ]
    })).toBe(true);
  });

  it("sends a documents patch payload and returns updated content", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          section: "documents",
          content: {
            entryId: "entry-1",
            title: "Ocean View Residences",
            createdBy: "Admin111",
            coverImageUrl: "https://cdn.example.com/ocean.jpg",
            collectionAddress: "Collection111",
            candyMachineAddress: "Candy111",
            galleryImages: [],
            propertyImages: [],
            documents: [
              {
                id: "document-1",
                tag: "legal",
                title: "Operating Agreement",
                label: "Operating Agreement",
                description: "",
                url: "https://cdn.example.com/agreement.pdf",
                displayOrder: 1,
                mimeType: "application/pdf",
                fileName: "agreement.pdf",
                fileRefId: "file-document-1",
                source: "upload"
              }
            ],
            fractionalInvestmentSummary: null,
            propertyInformation: null,
            googleMapsPlace: null,
            updatedBy: "Admin111",
            updatedAt: "2026-04-26T00:00:00.000Z"
          }
        }
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await updateAdminCollectionDocuments({
      entryId: "entry-1",
      documents: [
        {
          id: "document-1",
          tag: "legal",
          title: "Operating Agreement",
          label: "Operating Agreement",
          description: "",
          url: "https://cdn.example.com/agreement.pdf",
          displayOrder: 1,
          mimeType: "application/pdf",
          fileName: "agreement.pdf",
          fileRefId: "file-document-1",
          source: "upload"
        }
      ]
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/collections/entry-1", expect.objectContaining({
      method: "PATCH"
    }));
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      section: "documents",
      data: {
        documents: [
          {
            id: "document-1",
            tag: "legal",
            title: "Operating Agreement",
            label: "Operating Agreement",
            description: "",
            url: "https://cdn.example.com/agreement.pdf",
            displayOrder: 1,
            mimeType: "application/pdf",
            fileName: "agreement.pdf",
            fileRefId: "file-document-1",
            source: "upload"
          }
        ]
      }
    });
    expect(result.documents).toHaveLength(1);

    vi.unstubAllGlobals();
  });

  it("rejects invalid document drafts before calling the route", async () => {
    await expect(updateAdminCollectionDocuments({
      entryId: "entry-1",
      documents: [
        {
          id: "document-1",
          tag: "legal",
          title: "Operating Agreement",
          label: "",
          description: "",
          url: "not-a-url",
          displayOrder: 1,
          mimeType: null,
          fileName: null,
          fileRefId: null,
          source: "marketplace"
        }
      ]
    })).rejects.toEqual(expect.objectContaining({
      name: "AdminCollectionDocumentsMutationError",
      code: "INVALID_COLLECTION_PAYLOAD"
    }));

    await expect(updateAdminCollectionDocuments({
      entryId: "entry-1",
      documents: [
        {
          id: "document-1",
          tag: "legal",
          title: "Operating Agreement",
          label: "",
          description: "",
          url: "not-a-url",
          displayOrder: 1,
          mimeType: null,
          fileName: null,
          fileRefId: null,
          source: "marketplace"
        }
      ]
    })).rejects.toBeInstanceOf(AdminCollectionDocumentsMutationError);
  });
});
