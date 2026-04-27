import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AdminCollectionLocationClientError,
  createAdminCollectionLocationSessionToken,
  resolveAdminCollectionLocationPlace,
  updateAdminCollectionLocationPlace
} from "@/lib/admin/admin-collection-location-client";

describe("lib/admin/admin-collection-location-client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a session token for grouped autocomplete/detail requests", () => {
    expect(createAdminCollectionLocationSessionToken()).toBeTruthy();
  });

  it("resolves a selected place through the protected admin route", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          googleMapsPlace: {
            placeId: "place-1",
            placeLabel: "Oceanview Fractional Tower",
            formattedAddress: "Avenida San Martin 7-14, Bocagrande, Cartagena, CO",
            lat: 10.3997,
            lng: -75.5553,
            googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Oceanview%20Fractional%20Tower"
          }
        }
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveAdminCollectionLocationPlace({
      entryId: "entry-1",
      placeId: "place-1",
      sessionToken: "session-1"
    });

    expect(result.placeId).toBe("place-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/collections/entry-1/location-maps/resolve?placeId=place-1&sessionToken=session-1",
      { cache: "no-store" }
    );
  });

  it("persists the reduced place payload through the existing PATCH route", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          section: "googleMapsPlace",
          content: {
            googleMapsPlace: {
              placeId: "place-1",
              placeLabel: "Oceanview Fractional Tower",
              formattedAddress: "Avenida San Martin 7-14, Bocagrande, Cartagena, CO",
              lat: 10.3997,
              lng: -75.5553,
              googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Oceanview%20Fractional%20Tower"
            }
          }
        }
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await updateAdminCollectionLocationPlace({
      entryId: "entry-1",
      googleMapsPlace: {
        placeId: "place-1",
        placeLabel: "Oceanview Fractional Tower",
        formattedAddress: "Avenida San Martin 7-14, Bocagrande, Cartagena, CO",
        lat: 10.3997,
        lng: -75.5553,
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Oceanview%20Fractional%20Tower"
      }
    });

    expect(result?.placeId).toBe("place-1");
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/collections/entry-1", {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        section: "googleMapsPlace",
        data: {
          googleMapsPlace: {
            placeId: "place-1",
            placeLabel: "Oceanview Fractional Tower",
            formattedAddress: "Avenida San Martin 7-14, Bocagrande, Cartagena, CO",
            lat: 10.3997,
            lng: -75.5553,
            googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Oceanview%20Fractional%20Tower"
          }
        }
      })
    });
  });

  it("surfaces API errors as typed location client errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: {
          code: "COLLECTION_OWNERSHIP_MISMATCH",
          message: "Collection does not belong to the authenticated admin."
        }
      })
    }));

    await expect(updateAdminCollectionLocationPlace({
      entryId: "entry-1",
      googleMapsPlace: null
    })).rejects.toEqual(expect.objectContaining<Partial<AdminCollectionLocationClientError>>({
      code: "COLLECTION_OWNERSHIP_MISMATCH",
      message: "Collection does not belong to the authenticated admin."
    }));
  });
});
