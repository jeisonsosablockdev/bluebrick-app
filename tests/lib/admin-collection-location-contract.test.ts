import { describe, expect, it } from "vitest";

import { buildAdminCollectionLocationMapsSection } from "@/lib/admin/admin-collection-location-contract";

describe("lib/admin/admin-collection-location-contract", () => {
  it("serializes current location context and reduced place payload into one section contract", () => {
    process.env.GOOGLE_MAPS_API_KEY = "test-google-maps-key";

    const result = buildAdminCollectionLocationMapsSection({
      entryId: "entry-1",
      title: "Ocean View Residences",
      city: "Cartagena",
      country: "CO",
      stateProvince: "Bolivar",
      locationLabel: "Bocagrande Waterfront",
      detailedLocation: "Avenida San Martin 7-14, Bocagrande",
      geoLat: 10.3997,
      geoLng: -75.5553,
      createdBy: "Admin111",
      coverImageUrl: "https://cdn.example.com/ocean.jpg",
      collectionAddress: "Collection111",
      candyMachineAddress: "Candy111",
      galleryImages: [],
      propertyImages: [],
      documents: [],
      fractionalInvestmentSummary: null,
      propertyInformation: null,
      googleMapsPlace: {
        placeLabel: "Ocean View Residences",
        formattedAddress: "Avenida San Martin 7-14, Bocagrande, Cartagena, CO",
        lat: 10.3997,
        lng: -75.5553,
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Ocean%20View%20Residences",
        placeId: "place-ocean-view"
      },
      updatedBy: "Admin111",
      updatedAt: "2026-04-26T02:00:00.000Z"
    });

    expect(result.context.currentLabel).toBe(
      "Bocagrande Waterfront · Avenida San Martin 7-14, Bocagrande"
    );
    expect(result.context.currentQuery).toBe(
      "Avenida San Martin 7-14, Bocagrande, Cartagena, CO, Ocean View Residences"
    );
    expect(result.googleMapsPlace?.placeId).toBe("place-ocean-view");
    expect(result.outboundUrl).toContain("google.com/maps/search/");
    expect(result.embedUrl).toContain("google.com/maps/embed/v1/place");
    expect(result.embedUrl).toContain("place_id%3Aplace-ocean-view");
  });
});
