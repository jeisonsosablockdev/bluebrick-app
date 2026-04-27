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
  it("builds label and outbound query from persisted text fields when no place exists", () => {
    expect(buildAdminCollectionLocationLabel(baseContent)).toBe(
      "Bocagrande Waterfront · Avenida San Martin 7-14, Bocagrande"
    );
    expect(buildAdminCollectionLocationQuery(baseContent)).toBe(
      "Avenida San Martin 7-14, Bocagrande, Bocagrande Waterfront, Cartagena, CO"
    );
    expect(buildAdminCollectionGoogleMapsUrl(baseContent)).toContain("google.com/maps/search/");
    expect(buildAdminCollectionGoogleMapsEmbedUrl(baseContent)).toContain("output=embed");
  });

  it("prefers the reduced place payload when it is already persisted", () => {
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
    expect(buildAdminCollectionGoogleMapsEmbedUrl(content)).toContain("10.3997%2C-75.5553");
  });
});
