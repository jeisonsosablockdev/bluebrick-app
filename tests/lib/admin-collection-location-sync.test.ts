import { describe, expect, it } from "vitest";

import {
  deriveAdminCanonicalLocationLabel,
  reconcileAdminCollectionGoogleMapsPlace
} from "@/lib/admin/admin-collection-location-sync";

describe("lib/admin/admin-collection-location-sync", () => {
  it("derives a deterministic location label from canonical location fields", () => {
    expect(
      deriveAdminCanonicalLocationLabel({
        city: "Medellin",
        stateProvince: "Antioquia",
        postalCode: "050021",
        country: "CO"
      })
    ).toBe("Medellin, Antioquia, 050021, CO");
  });

  it("keeps the maps payload when canonical location still represents the same place", () => {
    const place = {
      placeId: "place-1",
      placeLabel: "Ocean View Residences",
      formattedAddress: "Carrera 43A #1-50, Medellin, Antioquia, CO",
      lat: 6.25184,
      lng: -75.56359,
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=place-1"
    };

    expect(
      reconcileAdminCollectionGoogleMapsPlace({
        location: {
          city: "Medellin",
          stateProvince: "Antioquia",
          postalCode: "050021",
          country: "CO",
          address: "Carrera 43A #1-50",
          geoLat: 6.25184,
          geoLng: -75.56359
        },
        googleMapsPlace: place
      })
    ).toEqual(place);
  });

  it("clears the maps payload when canonical location drifts away from the place", () => {
    expect(
      reconcileAdminCollectionGoogleMapsPlace({
        location: {
          city: "Bogota",
          stateProvince: "Cundinamarca",
          postalCode: null,
          country: "CO",
          address: "Calle 72 #10-34",
          geoLat: 4.711,
          geoLng: -74.072
        },
        googleMapsPlace: {
          placeId: "place-1",
          placeLabel: "Ocean View Residences",
          formattedAddress: "Carrera 43A #1-50, Medellin, Antioquia, CO",
          lat: 6.25184,
          lng: -75.56359,
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=place-1"
        }
      })
    ).toBeNull();
  });
});
