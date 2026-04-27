import { describe, expect, it } from "vitest";

import {
  buildAdminCollectionGoogleMapsEmbedUrl,
  buildAdminCollectionGoogleMapsUrl,
  buildAdminCollectionLocationLabel,
  buildAdminCollectionLocationQuery
} from "@/lib/admin/admin-collection-location-view";

const baseContent = {
  title: "Ocean View Residences",
  city: "Cartagena",
  country: "CO",
  locationLabel: "Bocagrande Waterfront",
  detailedLocation: "Avenida San Martin 7-14, Bocagrande",
  googleMapsPlace: null
};

describe("lib/admin/admin-collection-location-view", () => {
  it("returns null for the embed preview when no Google Maps embed key is configured", () => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    expect(buildAdminCollectionGoogleMapsEmbedUrl(baseContent)).toBeNull();
  });

  it("builds label and outbound query from persisted text fields when no place exists", () => {
    process.env.GOOGLE_MAPS_API_KEY = "test-google-maps-key";

    expect(buildAdminCollectionLocationLabel(baseContent)).toBe(
      "Bocagrande Waterfront · Avenida San Martin 7-14, Bocagrande"
    );
    expect(buildAdminCollectionLocationQuery(baseContent)).toBe(
      "Avenida San Martin 7-14, Bocagrande, Bocagrande Waterfront, Cartagena, CO"
    );
    expect(buildAdminCollectionGoogleMapsUrl(baseContent)).toContain("google.com/maps/search/");
    expect(buildAdminCollectionGoogleMapsEmbedUrl(baseContent)).toContain("google.com/maps/embed/v1/place");
    expect(buildAdminCollectionGoogleMapsEmbedUrl(baseContent)).toContain("key=test-google-maps-key");
  });

  it("prefers the reduced place payload when it is already persisted", () => {
    process.env.GOOGLE_MAPS_API_KEY = "test-google-maps-key";

    const content = {
      ...baseContent,
      googleMapsPlace: {
        placeLabel: "Ocean View Residences",
        formattedAddress: "Avenida San Martin 7-14, Bocagrande, Cartagena, CO",
        lat: 10.3997,
        lng: -75.5553,
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Ocean%20View%20Residences",
        placeId: "place-ocean-view"
      }
    };

    expect(buildAdminCollectionLocationQuery(content)).toBe(
      "Avenida San Martin 7-14, Bocagrande, Cartagena, CO, Ocean View Residences"
    );
    expect(buildAdminCollectionGoogleMapsUrl(content)).toBe(content.googleMapsPlace.googleMapsUrl);
    expect(buildAdminCollectionGoogleMapsEmbedUrl(content)).toContain("place_id%3Aplace-ocean-view");
  });
});
