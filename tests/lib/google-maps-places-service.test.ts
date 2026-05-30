import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  autocompleteGoogleMapsPlaces,
  isGoogleMapsPlacesServiceError,
  resolveGoogleMapsPlace
} from "@/lib/admin/google-maps-places-service";

describe("lib/admin/google-maps-places-service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GOOGLE_MAPS_API_KEY = "test-google-maps-key";
  });

  it("maps autocomplete predictions into compact suggestion DTOs", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [
          {
            placePrediction: {
              placeId: "place-1",
              text: {
                text: "Oceanview Fractional Tower, Cartagena, CO"
              },
              structuredFormat: {
                mainText: {
                  text: "Oceanview Fractional Tower"
                },
                secondaryText: {
                  text: "Cartagena, CO"
                }
              }
            }
          }
        ]
      })
    }));

    const result = await autocompleteGoogleMapsPlaces({
      query: "Oceanview",
      city: "Cartagena",
      country: "CO",
      sessionToken: "session-1"
    });

    expect(result).toEqual([
      {
        placeId: "place-1",
        fullText: "Oceanview Fractional Tower, Cartagena, CO",
        primaryText: "Oceanview Fractional Tower",
        secondaryText: "Cartagena, CO"
      }
    ]);
  });

  it("maps place details into the reduced googleMapsPlace payload", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "place-1",
        displayName: {
          text: "Oceanview Fractional Tower"
        },
        formattedAddress: "Avenida San Martin 7-14, Bocagrande, Cartagena, CO",
        addressComponents: [
          { longText: "7-14", shortText: "7-14", types: ["street_number"] },
          { longText: "Avenida San Martin", shortText: "Av. San Martin", types: ["route"] },
          { longText: "Cartagena", shortText: "Cartagena", types: ["locality"] },
          { longText: "Bolivar", shortText: "BOL", types: ["administrative_area_level_1"] },
          { longText: "Colombia", shortText: "CO", types: ["country"] },
          { longText: "130001", shortText: "130001", types: ["postal_code"] }
        ],
        location: {
          latitude: 10.3997,
          longitude: -75.5553
        },
        googleMapsUri: "https://www.google.com/maps/search/?api=1&query=Oceanview%20Fractional%20Tower"
      })
    }));

    const result = await resolveGoogleMapsPlace({
      placeId: "place-1",
      country: "CO",
      sessionToken: "session-1"
    });

    expect(result).toEqual({
      placeId: "place-1",
      placeLabel: "Oceanview Fractional Tower",
      formattedAddress: "Avenida San Martin 7-14, Bocagrande, Cartagena, CO",
      lat: 10.3997,
      lng: -75.5553,
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Oceanview%20Fractional%20Tower",
      addressLine: "7-14 Avenida San Martin",
      city: "Cartagena",
      stateProvince: "Bolivar",
      country: "CO",
      postalCode: "130001"
    });
  });

  it("returns a typed unavailable error when GOOGLE_MAPS_API_KEY is missing", async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;

    await expect(autocompleteGoogleMapsPlaces({
      query: "Oceanview",
      city: "Cartagena",
      country: "CO",
      sessionToken: "session-1"
    })).rejects.toSatisfy((error: unknown) => (
      isGoogleMapsPlacesServiceError(error) && error.code === "GOOGLE_MAPS_UNAVAILABLE"
    ));
  });
});
