// @vitest-environment jsdom

import { createElement, type ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let latestMapProps: Record<string, unknown> | null = null;

vi.mock("react-map-gl/mapbox", () => ({
  default: (props: Record<string, unknown>) => {
    latestMapProps = props;
    return createElement("div", { "data-testid": "mapbox-map" }, props.children as never);
  },
  Marker: ({ children }: { children: ReactNode }) => createElement("div", { "data-testid": "marker" }, children)
}));

import { MarketplaceMapClient } from "@/components/marketplace/MarketplaceMapClient";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderClient(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      createElement(MarketplaceMapClient, {
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
        ]
      })
    );
  });

  return { container, root };
}

describe("components/marketplace/MarketplaceMapClient", () => {
  beforeEach(() => {
    latestMapProps = null;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders compact pin content with title and sold percent", () => {
    const { container, root } = renderClient();

    expect(container.textContent).toContain("Boston Harbor House");
    expect(container.textContent).toContain("25%");
    expect(container.querySelector('[aria-label*="Boston Harbor House"]')).toBeTruthy();

    act(() => {
      root.unmount();
    });
  });

  it("zooms the map toward a hovered pin", () => {
    const { container, root } = renderClient();

    expect(latestMapProps).toMatchObject({
      mapboxAccessToken: "pk.test-token"
    });

    const beforeZoom = Number((latestMapProps?.viewState as { zoom?: number } | undefined)?.zoom ?? 0);
    const button = container.querySelector("button");
    expect(button).toBeTruthy();

    act(() => {
      button?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });

    const afterZoom = Number((latestMapProps?.viewState as { zoom?: number } | undefined)?.zoom ?? 0);
    expect(afterZoom).toBeGreaterThanOrEqual(7.25);
    expect(afterZoom).toBeGreaterThanOrEqual(beforeZoom);

    act(() => {
      root.unmount();
    });
  });
});
