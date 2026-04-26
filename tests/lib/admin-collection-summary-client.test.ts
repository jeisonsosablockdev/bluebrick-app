import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AdminCollectionSummaryMutationError,
  isAdminCollectionSummaryDirty,
  normalizeAdminCollectionSummaryInput,
  updateAdminCollectionSummary
} from "@/lib/admin/admin-collection-summary-client";

describe("lib/admin/admin-collection-summary-client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes blank editor input to null for the PATCH contract", () => {
    expect(normalizeAdminCollectionSummaryInput("  ")).toBeNull();
    expect(normalizeAdminCollectionSummaryInput(" Stable yield. ")).toBe("Stable yield.");
  });

  it("detects dirty state using the normalized persisted contract value", () => {
    expect(isAdminCollectionSummaryDirty({
      persistedValue: "Stable yield.",
      draftValue: " Stable yield. "
    })).toBe(false);

    expect(isAdminCollectionSummaryDirty({
      persistedValue: null,
      draftValue: "   "
    })).toBe(false);

    expect(isAdminCollectionSummaryDirty({
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

    const result = await updateAdminCollectionSummary({
      entryId: "entry-1",
      summary: " Updated yield. "
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

    await expect(updateAdminCollectionSummary({
      entryId: "entry-1",
      summary: "Updated yield."
    })).rejects.toEqual(expect.objectContaining<Partial<AdminCollectionSummaryMutationError>>({
      code: "COLLECTION_OWNERSHIP_MISMATCH",
      message: "Collection does not belong to the authenticated admin."
    }));
  });
});
