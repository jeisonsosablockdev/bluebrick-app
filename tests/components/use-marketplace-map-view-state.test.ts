// @vitest-environment jsdom

import { createElement, useEffect } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  useMarketplaceMapViewState,
  type MarketplaceMapViewStateController
} from "@/components/marketplace/useMarketplaceMapViewState";
import type { MarketplaceMapPin } from "@/lib/marketplace-map-pins";

const pins: MarketplaceMapPin[] = [
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
];

let latestController: MarketplaceMapViewStateController | null = null;

function ViewStateProbe({
  selectedPinId,
  onController
}: {
  selectedPinId?: string;
  onController: (controller: MarketplaceMapViewStateController) => void;
}) {
  const controller = useMarketplaceMapViewState({ pins, selectedPinId });

  useEffect(() => {
    onController(controller);
  }, [controller, onController]);

  return null;
}

describe("components/marketplace/useMarketplaceMapViewState", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    latestController = null;
    vi.useRealTimers();
  });

  it("centers a selected pin and can focus another pin", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(createElement(ViewStateProbe, { selectedPinId: "tx-1", onController: (controller) => { latestController = controller; } }));
    });

    expect(latestController?.displayedViewState).toMatchObject({
      latitude: 30.2672,
      longitude: -97.7431,
      pitch: 52
    });

    act(() => {
      latestController?.focusPin(pins[0]);
    });

    expect(latestController?.displayedViewState).toMatchObject({
      latitude: 27.9378,
      longitude: -82.2859,
      pitch: 52
    });

    act(() => {
      root.unmount();
    });
  });
});
