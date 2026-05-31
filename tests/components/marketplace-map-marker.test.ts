// @vitest-environment jsdom

import { createElement, type ReactNode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react-map-gl/mapbox", () => ({
  Marker: ({ children }: { children: ReactNode }) => createElement("div", { "data-testid": "marker" }, children)
}));

import { MarketplaceMapMarker } from "@/components/marketplace/MarketplaceMapMarker";

describe("components/marketplace/MarketplaceMapMarker", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders a compact property marker and activates on hover", () => {
    const onActivate = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        createElement(MarketplaceMapMarker, {
          pin: {
            id: "fl-1",
            title: "Fix & Flip Brandon 117",
            locationLabel: "Brandon, Florida, US",
            href: "/marketplace/fl-1",
            latitude: 27.9378,
            longitude: -82.2859,
            soldPercent: 12.5
          },
          onActivate
        })
      );
    });

    expect(container.textContent).toContain("Fix & Flip Brandon 117");
    expect(container.textContent).toContain("12.50%");
    expect(container.querySelector("button")?.getAttribute("aria-label")).toBe(
      "Fix & Flip Brandon 117, Brandon, Florida, US, 12.50% sold"
    );
    expect(container.querySelector("button")?.className).toContain("bg-slate-950/90");
    expect(container.querySelector("button")?.className).not.toContain("bg-cyan-300/15");
    expect(container.querySelector('[data-testid="marketplace-map-pin-leader"]')?.getAttribute("style")).toContain("rgb(103, 232, 249)");
    expect(container.querySelector('[data-testid="marketplace-map-pin-anchor"]')).toBeTruthy();

    act(() => {
      container.querySelector("button")?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });

    expect(onActivate).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
  });
});
