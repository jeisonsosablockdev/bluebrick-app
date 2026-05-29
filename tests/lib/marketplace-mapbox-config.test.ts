import { afterEach, describe, expect, it } from "vitest";

import {
  getMarketplaceMapboxAccessToken,
  isMarketplaceMapboxConfigured
} from "@/lib/marketplace-mapbox-config";

const originalToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

afterEach(() => {
  if (originalToken === undefined) {
    delete process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  } else {
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = originalToken;
  }
});

describe("lib/marketplace-mapbox-config", () => {
  it("returns null when the public Mapbox token is missing", () => {
    delete process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    expect(getMarketplaceMapboxAccessToken()).toBeNull();
    expect(isMarketplaceMapboxConfigured()).toBe(false);
  });

  it("trims the configured public token before exposing it", () => {
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = "  pk.test-token  ";

    expect(getMarketplaceMapboxAccessToken()).toBe("pk.test-token");
    expect(isMarketplaceMapboxConfigured()).toBe(true);
  });
});
