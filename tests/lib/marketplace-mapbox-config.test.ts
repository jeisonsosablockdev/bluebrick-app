import { afterEach, describe, expect, it } from "vitest";

import {
  getMarketplaceMapboxAccessToken,
  getMarketplaceMapboxStyleUrl,
  isMarketplaceMapboxConfigured
} from "@/lib/marketplace-mapbox-config";

const originalToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const originalStyleUrl = process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL;

afterEach(() => {
  if (originalToken === undefined) {
    delete process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  } else {
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = originalToken;
  }

  if (originalStyleUrl === undefined) {
    delete process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL;
  } else {
    process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL = originalStyleUrl;
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

  it("falls back to the Mapbox dark style until the BRIDS cinematic style is published", () => {
    delete process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL;

    expect(getMarketplaceMapboxStyleUrl()).toBe("mapbox://styles/mapbox/dark-v11");
  });

  it("trims the configured BRIDS marketplace style URL", () => {
    process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL = "  mapbox://styles/brids/decimal-cinematic  ";

    expect(getMarketplaceMapboxStyleUrl()).toBe("mapbox://styles/brids/decimal-cinematic");
  });
});
