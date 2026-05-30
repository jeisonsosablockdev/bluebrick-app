import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MarketplaceMapShell } from "@/components/marketplace/MarketplaceMapShell";

function renderShell(element: ReactNode): string {
  return renderToStaticMarkup(createElement("div", null, element));
}

describe("components/marketplace/MarketplaceMapShell", () => {
  it("falls back to the list when the Mapbox token is missing", () => {
    const html = renderShell(
      createElement(MarketplaceMapShell, {
        mapboxAccessToken: null,
        pins: [],
        map: createElement("div", { "data-testid": "marketplace-map-client" }, "map"),
        fallback: createElement("div", { "data-testid": "marketplace-list" }, "list")
      })
    );

    expect(html).toContain("marketplace-list");
    expect(html).not.toContain("marketplace-map-shell");
  });

  it("renders the map shell when the token and pins are available", () => {
    const html = renderShell(
      createElement(MarketplaceMapShell, {
        mapboxAccessToken: "pk.test-token",
        pins: [
          {
            id: "us-1",
            title: "Boston Harbor House",
            locationLabel: "Boston, MA, US",
            href: "/marketplace/us-1",
            latitude: 42.3601,
            longitude: -71.0589,
            soldPercent: 25
          }
        ],
        map: createElement("div", { "data-testid": "marketplace-map-client" }, "map"),
        fallback: createElement("div", { "data-testid": "marketplace-list" }, "list")
      })
    );

    expect(html).toContain("marketplace-map-shell");
    expect(html).toContain("marketplace-map-client");
    expect(html).not.toContain("marketplace-list");
  });
});
