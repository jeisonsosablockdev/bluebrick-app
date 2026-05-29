import { describe, expect, it } from "vitest";

import { projectMarketplaceMapPins } from "@/lib/marketplace-map-pins";

describe("lib/marketplace-map-pins", () => {
  it("projects only US listings with valid coordinates into pins", () => {
    const pins = projectMarketplaceMapPins([
      {
        id: "us-1",
        title: "Boston Harbor House",
        locationLabel: "Boston, MA, US",
        country: "US",
        geoLat: 42.3601,
        geoLng: -71.0589,
        supplyTotal: 2000,
        mintedOrSold: 500
      },
      {
        id: "co-1",
        title: "Bogota Tower",
        locationLabel: "Bogota, CO",
        country: "CO",
        geoLat: 4.711,
        geoLng: -74.0721,
        supplyTotal: 1000,
        mintedOrSold: 250
      },
      {
        id: "us-2",
        title: "Broken Coordinates",
        locationLabel: "Miami, FL, US",
        country: "US",
        geoLat: null,
        geoLng: -80.1918,
        supplyTotal: 1000,
        mintedOrSold: 250
      }
    ]);

    expect(pins).toEqual([
      {
        id: "us-1",
        title: "Boston Harbor House",
        locationLabel: "Boston, MA, US",
        href: "/marketplace/us-1",
        latitude: 42.3601,
        longitude: -71.0589,
        soldPercent: 25
      }
    ]);
  });

  it("preserves fractional sold progress for the pin label contract", () => {
    const pins = projectMarketplaceMapPins([
      {
        id: "us-3",
        title: "Houston Heights",
        locationLabel: "Houston, TX, US",
        country: "US",
        geoLat: 29.7604,
        geoLng: -95.3698,
        supplyTotal: 400,
        mintedOrSold: 125
      }
    ]);

    expect(pins[0]?.soldPercent).toBe(31.25);
  });
});
