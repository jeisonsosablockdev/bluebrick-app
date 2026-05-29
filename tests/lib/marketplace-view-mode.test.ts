import { describe, expect, it } from "vitest";

import {
  getMarketplaceViewModeButtonLabel,
  getNextMarketplaceViewMode,
  type MarketplaceViewMode
} from "@/lib/marketplace-view-mode";

describe("lib/marketplace-view-mode", () => {
  it("cycles through the agreed marketplace view states in order", () => {
    const cycle: MarketplaceViewMode[] = [];
    let current: MarketplaceViewMode = "combined-map-top";

    for (let index = 0; index < 4; index += 1) {
      cycle.push(current);
      current = getNextMarketplaceViewMode(current);
    }

    expect(cycle).toEqual([
      "combined-map-top",
      "list-only",
      "map-only",
      "combined-list-top"
    ]);
    expect(getNextMarketplaceViewMode(current)).toBe("list-only");
  });

  it("exposes a label that changes with the current view mode", () => {
    expect(getMarketplaceViewModeButtonLabel("combined-map-top").toLowerCase()).toContain("list");
    expect(getMarketplaceViewModeButtonLabel("list-only").toLowerCase()).toContain("map");
    expect(getMarketplaceViewModeButtonLabel("map-only").toLowerCase()).toContain("list");
    expect(getMarketplaceViewModeButtonLabel("combined-list-top").toLowerCase()).toContain("map");
  });
});
