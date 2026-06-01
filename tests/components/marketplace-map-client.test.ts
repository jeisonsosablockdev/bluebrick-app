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
        mapStyleUrl: "mapbox://styles/brids/decimal-cinematic",
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

function renderClientWithPins(pins: Array<{
  id: string;
  title: string;
  locationLabel: string;
  href: string;
  latitude: number;
  longitude: number;
  soldPercent: number;
}>): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      createElement(MarketplaceMapClient, {
        mapboxAccessToken: "pk.test-token",
        mapStyleUrl: "mapbox://styles/brids/decimal-cinematic",
        pins
      })
    );
  });

  return { container, root };
}

describe("components/marketplace/MarketplaceMapClient", () => {
  beforeEach(() => {
    latestMapProps = null;
    vi.useRealTimers();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("renders compact pin content with title and sold percent", () => {
    const { container, root } = renderClient();

    expect(container.textContent).toContain("Boston Harbor House");
    expect(container.textContent).toContain("25%");
    expect(container.querySelector('[aria-label*="Boston Harbor House"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="marketplace-map-pin-leader"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="marketplace-map-pin-anchor"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="marketplace-map-pin-leader"]')?.getAttribute("style")).toContain("rgb(103, 232, 249)");

    act(() => {
      root.unmount();
    });
  });

  it("renders northern pins first so southern cards cover crossed leader lines", () => {
    const { container, root } = renderClientWithPins([
      {
        id: "south-fl-1",
        title: "Fix & Flip Bradenton",
        locationLabel: "Bradenton, Florida, US",
        href: "/marketplace/south-fl-1",
        latitude: 27.4989,
        longitude: -82.5748,
        soldPercent: 0
      },
      {
        id: "north-fl-1",
        title: "Fix & Flip Brandon",
        locationLabel: "Brandon, Florida, US",
        href: "/marketplace/north-fl-1",
        latitude: 27.9378,
        longitude: -82.2859,
        soldPercent: 0
      }
    ]);

    const markers = Array.from(container.querySelectorAll('[data-testid="marker"]'));
    expect(markers).toHaveLength(2);
    expect(markers[0]?.textContent).toContain("Fix & Flip Brandon");
    expect(markers[1]?.textContent).toContain("Fix & Flip Bradenton");

    act(() => {
      root.unmount();
    });
  });

  it("zooms the map toward a hovered pin", () => {
    const { container, root } = renderClient();

    expect(latestMapProps).toMatchObject({
      mapboxAccessToken: "pk.test-token",
      mapStyle: "mapbox://styles/brids/decimal-cinematic"
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

  it("focuses a selected marketplace pin when the selected pin id changes", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        createElement(MarketplaceMapClient, {
          mapboxAccessToken: "pk.test-token",
          mapStyleUrl: "mapbox://styles/brids/decimal-cinematic",
          selectedPinId: "tx-1",
          pins: [
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
            }
          ]
        })
      );
    });

    expect(latestMapProps?.viewState).toMatchObject({
      latitude: 30.2672,
      longitude: -97.7431,
      pitch: 52
    });
    expect(Number((latestMapProps?.viewState as { zoom?: number } | undefined)?.zoom ?? 0)).toBeGreaterThanOrEqual(7.25);

    act(() => {
      root.unmount();
    });
  });

  it("does not start automatic circular camera motion after the initial render window", () => {
    vi.useFakeTimers();
    const { root } = renderClient();
    const initialViewState = latestMapProps?.viewState as Record<string, unknown>;

    act(() => {
      vi.advanceTimersByTime(4499);
    });

    expect(latestMapProps?.viewState).toMatchObject(initialViewState);

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(latestMapProps?.viewState).toMatchObject(initialViewState);

    act(() => {
      root.unmount();
    });
  });

  it("does not start deferred camera motion when reduced motion is requested", () => {
    vi.useFakeTimers();
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));

    const { root } = renderClient();
    const initialViewState = latestMapProps?.viewState;

    act(() => {
      vi.advanceTimersByTime(9000);
    });

    expect(latestMapProps?.viewState).toMatchObject(initialViewState as Record<string, unknown>);

    window.matchMedia = originalMatchMedia;
    act(() => {
      root.unmount();
    });
  });
});
