import { useEffect, useState } from "react";
import type { ViewState } from "react-map-gl/mapbox";

import { createMarketplaceMapCameraViewState } from "@/lib/marketplace-map-camera";
import { createMarketplaceMapOrbitViewState } from "@/lib/marketplace-map-camera-motion";
import type { MarketplaceMapPin } from "@/lib/marketplace-map-pins";

export type MarketplaceMapViewState = ViewState & {
  width: number;
  height: number;
};

export type MarketplaceMapViewStateController = {
  displayedViewState: MarketplaceMapViewState;
  focusPin: (pin: MarketplaceMapPin) => void;
  applyMapMove: (nextViewState: Partial<MarketplaceMapViewState>) => void;
};

type UseMarketplaceMapViewStateInput = {
  pins: MarketplaceMapPin[];
  selectedPinId?: string | null;
  initialViewState?: Partial<MarketplaceMapViewState>;
};

type CameraScopedViewState = {
  cameraKey: string;
  viewState: MarketplaceMapViewState;
};

type CameraScopedOrbitStep = {
  cameraKey: string;
  step: number;
};

type CreateMovedViewStateInput = {
  current: CameraScopedViewState | null;
  cameraKey: string;
  cameraViewState: MarketplaceMapViewState;
  nextViewState: Partial<MarketplaceMapViewState>;
};

const MAPBOX_DIMENSION_PLACEHOLDER = {
  width: 1,
  height: 1
};

const MARKETPLACE_MAP_CAMERA_MOTION_DELAY_MS = 4500;
const MARKETPLACE_MAP_CAMERA_MOTION_INTERVAL_MS = 4200;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function createCameraKey(pins: MarketplaceMapPin[], selectedPinId?: string | null): string {
  return `${selectedPinId ?? "aggregate"}:${pins.map((pin) => `${pin.id}:${pin.latitude}:${pin.longitude}`).join("|")}`;
}

function createCameraViewState(
  pins: MarketplaceMapPin[],
  selectedPinId?: string | null,
  initialViewState?: Partial<MarketplaceMapViewState>
): MarketplaceMapViewState {
  return {
    ...createMarketplaceMapCameraViewState(pins, selectedPinId),
    ...MAPBOX_DIMENSION_PLACEHOLDER,
    ...initialViewState
  };
}

function createFocusedPinViewState(pin: MarketplaceMapPin, current: MarketplaceMapViewState): MarketplaceMapViewState {
  return {
    ...current,
    latitude: pin.latitude,
    longitude: pin.longitude,
    zoom: Math.max(current.zoom, 7.25),
    pitch: 52
  };
}

function createMovedViewState({
  current,
  cameraKey,
  cameraViewState,
  nextViewState
}: CreateMovedViewStateInput): CameraScopedViewState {
  const previousViewState = current?.cameraKey === cameraKey ? current.viewState : cameraViewState;

  return {
    cameraKey,
    viewState: {
      ...previousViewState,
      ...nextViewState,
      width: previousViewState.width,
      height: previousViewState.height
    }
  };
}

function getCameraScopedViewState(
  current: CameraScopedViewState | null,
  cameraKey: string,
  fallbackViewState: MarketplaceMapViewState
): MarketplaceMapViewState {
  return current?.cameraKey === cameraKey ? current.viewState : fallbackViewState;
}

function getCameraScopedOrbitStep(current: CameraScopedOrbitStep | null, cameraKey: string): number {
  return current?.cameraKey === cameraKey ? current.step : 0;
}

function useDeferredOrbitStep(cameraKey: string): number {
  const [orbitStepByCameraKey, setOrbitStepByCameraKey] = useState<CameraScopedOrbitStep | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const delayId = setTimeout(() => {
      setOrbitStepByCameraKey({ cameraKey, step: 1 });
      intervalId = setInterval(() => {
        setOrbitStepByCameraKey((current) => ({
          cameraKey,
          step: current?.cameraKey === cameraKey ? current.step + 1 : 1
        }));
      }, MARKETPLACE_MAP_CAMERA_MOTION_INTERVAL_MS);
    }, MARKETPLACE_MAP_CAMERA_MOTION_DELAY_MS);

    return () => {
      clearTimeout(delayId);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [cameraKey]);

  return getCameraScopedOrbitStep(orbitStepByCameraKey, cameraKey);
}

function createDisplayedViewState(
  viewState: MarketplaceMapViewState,
  orbitStep: number
): MarketplaceMapViewState {
  return orbitStep > 0 ? createMarketplaceMapOrbitViewState(viewState, orbitStep) : viewState;
}

export function useMarketplaceMapViewState({
  pins,
  selectedPinId,
  initialViewState
}: UseMarketplaceMapViewStateInput): MarketplaceMapViewStateController {
  const cameraKey = createCameraKey(pins, selectedPinId);
  const cameraViewState = createCameraViewState(pins, selectedPinId, initialViewState);
  const [movedViewState, setMovedViewState] = useState<CameraScopedViewState | null>(null);
  const orbitStep = useDeferredOrbitStep(cameraKey);
  const viewState = getCameraScopedViewState(movedViewState, cameraKey, cameraViewState);

  return {
    displayedViewState: createDisplayedViewState(viewState, orbitStep),
    focusPin: (pin) => setMovedViewState({ cameraKey, viewState: createFocusedPinViewState(pin, viewState) }),
    applyMapMove: (nextViewState) =>
      setMovedViewState((current) =>
        createMovedViewState({
          current,
          cameraKey,
          cameraViewState,
          nextViewState
        })
      )
  };
}
