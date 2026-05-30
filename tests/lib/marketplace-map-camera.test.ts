import { describe, expect, it } from "vitest";

import { createMarketplaceMapCameraViewState } from "@/lib/marketplace-map-camera";
import type { MarketplaceMapPin } from "@/lib/marketplace-map-pins";

const pins: MarketplaceMapPin[] = [
  {
    id: "fl-1",
    title: "Brandon Residence",
    locationLabel: "Brandon, FL, US",
    href: "/marketplace/fl-1",
    latitude: 27.9378,
    longitude: -82.2859,
    soldPercent: 0
  },
  {
    id: "tx-1",
    title: "Austin Yield House",
    locationLabel: "Austin, TX, US",
    href: "/marketplace/tx-1",
    latitude: 30.2672,
    longitude: -97.7431,
    soldPercent: 42
  },
  {
    id: "ma-1",
    title: "Boston Harbor House",
    locationLabel: "Boston, MA, US",
    href: "/marketplace/ma-1",
    latitude: 42.3601,
    longitude: -71.0589,
    soldPercent: 25
  }
];

describe("lib/marketplace-map-camera", () => {
  it("centers the map around the midpoint of available marketplace pins when nothing is selected", () => {
    const viewState = createMarketplaceMapCameraViewState(pins);

    expect(viewState.latitude).toBeCloseTo(35.149, 3);
    expect(viewState.longitude).toBeCloseTo(-84.401, 3);
    expect(viewState.zoom).toBeGreaterThanOrEqual(3.8);
    expect(viewState.zoom).toBeLessThanOrEqual(4.8);
    expect(viewState.pitch).toBe(45);
  });

  it("focuses the selected marketplace pin over the aggregate midpoint", () => {
    const viewState = createMarketplaceMapCameraViewState(pins, "tx-1");

    expect(viewState.latitude).toBe(30.2672);
    expect(viewState.longitude).toBe(-97.7431);
    expect(viewState.zoom).toBeGreaterThanOrEqual(7.25);
    expect(viewState.pitch).toBe(52);
  });

  it("falls back to the aggregate midpoint when the selected id is not in the pin set", () => {
    const viewState = createMarketplaceMapCameraViewState(pins, "missing");

    expect(viewState.latitude).toBeCloseTo(35.149, 3);
    expect(viewState.longitude).toBeCloseTo(-84.401, 3);
  });
});
