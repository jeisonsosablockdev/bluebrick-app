// @vitest-environment jsdom

import { createElement, useEffect, useRef } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  useMarketplaceMapViewState,
  type MarketplaceMapViewStateController
} from "@/features/marketplace/presentation/useMarketplaceMapViewState";
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
let renderCount = 0;

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

describe("features/marketplace/presentation/useMarketplaceMapViewState", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    latestController = null;
    renderCount = 0;
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

  it("does not schedule another render when Mapbox reports the same view state", () => {
    function StableMoveProbe() {
      const controller = useMarketplaceMapViewState({ pins, selectedPinId: "tx-1" });
      const hasAppliedMove = useRef(false);

      useEffect(() => {
        renderCount += 1;
        latestController = controller;
        if (hasAppliedMove.current) {
          return;
        }

        hasAppliedMove.current = true;
        controller.applyMapMove(controller.displayedViewState);
      }, [controller]);

      return null;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(createElement(StableMoveProbe));
    });

    expect(renderCount).toBe(1);

    act(() => {
      root.unmount();
    });
  });

  it("does not schedule another render when Mapbox reports the same view state with different padding references", () => {
    function PaddingMoveProbe() {
      const controller = useMarketplaceMapViewState({ pins, selectedPinId: "tx-1" });
      const hasAppliedMove = useRef(false);

      useEffect(() => {
        renderCount += 1;
        latestController = controller;
        if (hasAppliedMove.current) {
          return;
        }

        hasAppliedMove.current = true;
        // Simulate Mapbox returning a new object reference for padding
        controller.applyMapMove({
          ...controller.displayedViewState,
          padding: { top: 0, bottom: 0, left: 0, right: 0 }
        });
      }, [controller]);

      return null;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(createElement(PaddingMoveProbe));
    });

    expect(renderCount).toBe(1);

    act(() => {
      root.unmount();
    });
  });
});
