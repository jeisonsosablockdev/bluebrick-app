import { describe, expect, it } from "vitest";

import { createMarketplaceMapOrbitViewState } from "@/lib/marketplace-map-camera-motion";

describe("lib/marketplace-map-camera-motion", () => {
  it("creates a subtle circular offset around the base camera", () => {
    const base = {
      latitude: 27.9378,
      longitude: -82.2859,
      zoom: 7.25,
      bearing: 0,
      pitch: 52,
      width: 1,
      height: 1,
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    };

    const orbit = createMarketplaceMapOrbitViewState(base, 1);

    expect(orbit.latitude).not.toBe(base.latitude);
    expect(orbit.longitude).not.toBe(base.longitude);
    expect(Math.abs(orbit.latitude - base.latitude)).toBeLessThan(0.02);
    expect(Math.abs(orbit.longitude - base.longitude)).toBeLessThan(0.02);
    expect(orbit.zoom).toBe(base.zoom);
    expect(orbit.pitch).toBeGreaterThanOrEqual(base.pitch);
  });
});
