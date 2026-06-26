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
import type { MarketplaceMapPin } from "@/lib/marketplace-map-pins";

const BOSTON_PIN: MarketplaceMapPin = {
  id: "us-1",
  title: "Boston Harbor House",
  locationLabel: "Boston, MA, US",
  href: "/marketplace/us-1",
  latitude: 42.3601,
  longitude: -71.0589,
  soldPercent: 25
};

const AUSTIN_PIN: MarketplaceMapPin = {
  id: "tx-1",
  title: "Austin Yield House",
  locationLabel: "Austin, TX, US",
  href: "/marketplace/tx-1",
  latitude: 30.2672,
  longitude: -97.7431,
  soldPercent: 42
};

const BRANDON_PIN: MarketplaceMapPin = {
  id: "fl-1",
  title: "Brandon Residence",
  locationLabel: "Brandon, FL, US",
  href: "/marketplace/fl-1",
  latitude: 27.9378,
  longitude: -82.2859,
  soldPercent: 0
};

const BRADENTON_PIN: MarketplaceMapPin = {
  id: "south-fl-1",
  title: "Fix & Flip Bradenton",
  locationLabel: "Bradenton, Florida, US",
  href: "/marketplace/south-fl-1",
  latitude: 27.4989,
  longitude: -82.5748,
  soldPercent: 0
};

type RenderHandle = { container: HTMLDivElement; root: Root };

function renderClient(overrides: Partial<Parameters<typeof MarketplaceMapClient>[0]> = {}): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      createElement(MarketplaceMapClient, {
        mapboxAccessToken: "pk.test-token",
        mapStyleUrl: "mapbox://styles/brids/decimal-cinematic",
        pins: [BOSTON_PIN],
        ...overrides
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

    act(() => { root.unmount(); });
  });

  it("renders northern pins first so southern cards cover crossed leader lines", () => {
    const { container, root } = renderClient({ pins: [BRADENTON_PIN, BRANDON_PIN] });

    const markers = Array.from(container.querySelectorAll('[data-testid="marker"]'));
    expect(markers).toHaveLength(2);
    // Brandon (latitude 27.9378) is north of Bradenton (latitude 27.4989) → should be first
    expect(markers[0]?.textContent).toContain("Brandon Residence");
    expect(markers[1]?.textContent).toContain("Fix & Flip Bradenton");

    act(() => { root.unmount(); });
  });

  it("calls onPinHover when a pin marker is activated via hover", () => {
    const onPinHover = vi.fn();
    const { container, root } = renderClient({ onPinHover });

    const button = container.querySelector("button");
    expect(button).toBeTruthy();

    act(() => {
      button?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });

    // Hovering a pin must notify the parent via onPinHover.
    expect(onPinHover).toHaveBeenCalledOnce();
    expect(onPinHover).toHaveBeenCalledWith(expect.objectContaining({ id: "us-1" }));

    act(() => { root.unmount(); });
  });

  it("sets initialViewState to the selected pin on mount", () => {
    const { root } = renderClient({ pins: [BRANDON_PIN, AUSTIN_PIN], selectedPinId: "tx-1" });

    // Uncontrolled map: camera is driven by initialViewState, not by a viewState prop.
    expect(latestMapProps?.initialViewState).toMatchObject({
      latitude: 30.2672,
      longitude: -97.7431,
      pitch: 52
    });
    expect(Number((latestMapProps?.initialViewState as { zoom?: number } | undefined)?.zoom ?? 0)).toBeGreaterThanOrEqual(7.25);

    act(() => { root.unmount(); });
  });

  it("does not start automatic circular camera motion after the initial render window", () => {
    vi.useFakeTimers();
    const { root } = renderClient();
    // Snapshot the initialViewState at mount.
    const initialViewState = latestMapProps?.initialViewState as Record<string, unknown>;

    act(() => { vi.advanceTimersByTime(4499); });
    // initialViewState must not have changed — the map is uncontrolled, so
    // any deferred motion would be imperative (easeTo) not a prop update.
    expect(latestMapProps?.initialViewState).toMatchObject(initialViewState);

    act(() => { vi.advanceTimersByTime(1); });
    expect(latestMapProps?.initialViewState).toMatchObject(initialViewState);

    act(() => { root.unmount(); });
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
    const initialViewState = latestMapProps?.initialViewState;

    act(() => { vi.advanceTimersByTime(9000); });

    expect(latestMapProps?.initialViewState).toMatchObject(initialViewState as Record<string, unknown>);

    window.matchMedia = originalMatchMedia;
    act(() => { root.unmount(); });
  });
});
