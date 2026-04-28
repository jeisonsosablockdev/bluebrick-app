import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AdminCollectionTextSectionMutationError,
  isAdminCollectionTextSectionDirty,
  normalizeAdminCollectionTextSectionInput,
  updateAdminCollectionTextSection
} from "@/lib/admin/admin-collection-text-section-client";

describe("lib/admin/admin-collection-text-section-client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes blank editor input to null for text PATCH contracts", () => {
    expect(normalizeAdminCollectionTextSectionInput("  ")).toBeNull();
    expect(normalizeAdminCollectionTextSectionInput(" Stable yield. ")).toBe("Stable yield.");
  });

  it("detects dirty state using the normalized persisted contract value", () => {
    expect(isAdminCollectionTextSectionDirty({
      persistedValue: "Stable yield.",
      draftValue: " Stable yield. "
    })).toBe(false);

    expect(isAdminCollectionTextSectionDirty({
      persistedValue: null,
      draftValue: "   "
    })).toBe(false);

    expect(isAdminCollectionTextSectionDirty({
      persistedValue: "Stable yield.",
      draftValue: "Updated yield."
    })).toBe(true);
  });

  it("submits the summary PATCH payload and returns the updated content record", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          section: "summary",
          content: {
            entryId: "entry-1",
            title: "Central Tower",
            city: "Bogota",
            country: "CO",
            locationLabel: "Financial district",
            detailedLocation: "Calle 72 # 10-34, Bogota",
            createdBy: "Admin111",
            coverImageUrl: "https://cdn.example.com/cover.jpg",
            collectionAddress: "Collection111",
            candyMachineAddress: "Candy111",
            galleryImages: [],
            propertyImages: [],
            documents: [],
            fractionalInvestmentSummary: "Updated yield.",
            propertyInformation: null,
            googleMapsPlace: null,
            updatedBy: "Admin111",
            updatedAt: "2026-04-26T17:00:00.000Z"
          }
        }
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await updateAdminCollectionTextSection({
      entryId: "entry-1",
      section: "summary",
      value: " Updated yield. "
    });

    expect(result.fractionalInvestmentSummary).toBe("Updated yield.");
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/collections/entry-1", {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        section: "summary",
        data: {
          fractionalInvestmentSummary: "Updated yield."
        }
      })
    });
  });

  it("submits the property information PATCH payload and returns the updated content record", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          section: "propertyInformation",
          content: {
            entryId: "entry-1",
            title: "Central Tower",
            city: "Bogota",
            country: "CO",
            locationLabel: "Financial district",
            detailedLocation: "Calle 72 # 10-34, Bogota",
            createdBy: "Admin111",
            coverImageUrl: "https://cdn.example.com/cover.jpg",
            collectionAddress: "Collection111",
            candyMachineAddress: "Candy111",
            galleryImages: [],
            propertyImages: [],
            documents: [],
            fractionalInvestmentSummary: "Stable yield.",
            propertyInformation: "Updated property information.",
            googleMapsPlace: null,
            updatedBy: "Admin111",
            updatedAt: "2026-04-26T17:05:00.000Z"
          }
        }
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await updateAdminCollectionTextSection({
      entryId: "entry-1",
      section: "propertyInformation",
      value: " Updated property information. "
    });

    expect(result.propertyInformation).toBe("Updated property information.");
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/collections/entry-1", {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        section: "propertyInformation",
        data: {
          propertyInformation: "Updated property information."
        }
      })
    });
  });

  it("surfaces API errors as mutation errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: {
          code: "COLLECTION_OWNERSHIP_MISMATCH",
          message: "Collection does not belong to the authenticated admin."
        }
      })
    }));

    await expect(updateAdminCollectionTextSection({
      entryId: "entry-1",
      section: "summary",
      value: "Updated yield."
    })).rejects.toEqual(expect.objectContaining<Partial<AdminCollectionTextSectionMutationError>>({
      code: "COLLECTION_OWNERSHIP_MISMATCH",
      message: "Collection does not belong to the authenticated admin."
    }));
  });
});
