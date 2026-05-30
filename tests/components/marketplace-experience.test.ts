// @vitest-environment jsdom

import { createElement, type ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/marketplace/MarketplaceGridClient", () => ({
  MarketplaceGridClient: ({ properties }: { properties: Array<{ title: string }> }) =>
    createElement(
      "div",
      { "data-testid": "marketplace-grid" },
      properties.map((property) => property.title).join(", ")
    )
}));

vi.mock("@/components/marketplace/MarketplaceMapClient", () => ({
  MarketplaceMapClient: ({ selectedPinId }: { selectedPinId?: string | null }) =>
    createElement("div", { "data-testid": "marketplace-map-client", "data-selected-pin-id": selectedPinId ?? "" }, "map")
}));

vi.mock("@/components/marketplace/MarketplaceMapShell", () => ({
  MarketplaceMapShell: ({
    fallback,
    mapboxAccessToken,
    onPinSelect,
    pins,
    selectedPinId,
    map
  }: {
    fallback: ReactNode;
    mapboxAccessToken: string | null;
    onPinSelect?: (pinId: string) => void;
    pins: Array<{ id: string; title: string }>;
    selectedPinId?: string | null;
    map: ReactNode;
  }) => {
    if (!mapboxAccessToken || pins.length === 0) {
      return createElement("div", { "data-testid": "marketplace-map-fallback" }, fallback);
    }

    return createElement(
      "div",
      { "data-testid": "marketplace-map-shell", "data-selected-pin-id": selectedPinId ?? "" },
      map,
      pins.map((pin) =>
        createElement(
          "button",
          {
            key: pin.id,
            type: "button",
            onClick: () => onPinSelect?.(pin.id)
          },
          pin.title
        )
      )
    );
  }
}));

vi.mock("@/components/marketplace/MarketplaceViewModeShell", () => ({
  MarketplaceViewModeShell: ({ render }: { render: (mode: string) => ReactNode }) =>
    createElement("div", { "data-testid": "marketplace-view-shell" }, render("combined-map-top"))
}));

import { MarketplaceExperience } from "@/components/marketplace/MarketplaceExperience";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderExperience(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      createElement(MarketplaceExperience, {
        mapboxAccessToken: "pk.test-token",
        mapboxStyleUrl: "mapbox://styles/brids/decimal-cinematic",
        properties: [
          {
            id: "us-1",
            title: "Boston Harbor House",
            image: "/test.jpg",
            listingStatus: "active",
            locationLabel: "Boston, MA, US",
            minimumCapitalRequiredUsd: 1000,
            annualRoiPct: 12.4,
            projectDurationMonths: 24
          } as never
        ],
        mapSources: [
          {
            id: "us-1",
            title: "Boston Harbor House",
            locationLabel: "Boston, MA, US",
            country: "US",
            geoLat: 42.3601,
            geoLng: -71.0589,
            supplyTotal: 2000,
            mintedOrSold: 500
          }
        ]
      })
    );
  });

  return { container, root };
}

describe("components/marketplace/MarketplaceExperience", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the map above the list in the default combined state", () => {
    const { container, root } = renderExperience();

    const shell = container.querySelector('[data-testid="marketplace-map-shell"]');
    const grid = container.querySelector('[data-testid="marketplace-grid"]');

    expect(shell).toBeTruthy();
    expect(grid).toBeTruthy();
    expect(container.textContent).toContain("Boston Harbor House");
    expect(container.innerHTML.indexOf("marketplace-map-shell")).toBeLessThan(container.innerHTML.indexOf("marketplace-grid"));

    act(() => {
      root.unmount();
    });
  });

  it("passes selected pin state from the pin list into the map client", () => {
    const { container, root } = renderExperience();

    const pinButton = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Boston Harbor House");
    expect(pinButton).toBeTruthy();

    act(() => {
      pinButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="marketplace-map-client"]')?.getAttribute("data-selected-pin-id")).toBe("us-1");

    act(() => {
      root.unmount();
    });
  });
});
