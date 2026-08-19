"use client";

import { useMemo, useState } from "react";
import type { ViewState } from "react-map-gl/mapbox";

import { createMarketplaceMapCameraViewState } from "@/lib/marketplace-map-camera";
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

function arePaddingsEqual(
  left: MarketplaceMapViewState["padding"],
  right: MarketplaceMapViewState["padding"]
): boolean {
  if (left === right) return true;
  if (!left || !right) return left === right;
  return (
    (left.top ?? 0) === (right.top ?? 0)
    && (left.bottom ?? 0) === (right.bottom ?? 0)
    && (left.left ?? 0) === (right.left ?? 0)
    && (left.right ?? 0) === (right.right ?? 0)
  );
}

function areViewStatesEqual(left: MarketplaceMapViewState, right: MarketplaceMapViewState): boolean {
  return (
    left.latitude === right.latitude
    && left.longitude === right.longitude
    && left.zoom === right.zoom
    && left.pitch === right.pitch
    && left.bearing === right.bearing
    && arePaddingsEqual(left.padding, right.padding)
  );
}

function createMovedViewState({
  current,
  cameraKey,
  cameraViewState,
  nextViewState
}: CreateMovedViewStateInput): CameraScopedViewState | null {
  const previousViewState = current?.cameraKey === cameraKey ? current.viewState : cameraViewState;
  const movedViewState = {
    ...previousViewState,
    ...nextViewState,
    width: previousViewState.width,
    height: previousViewState.height
  };

  if (areViewStatesEqual(previousViewState, movedViewState)) {
    return current?.cameraKey === cameraKey ? current : null;
  }

  return {
    cameraKey,
    viewState: movedViewState
  };
}

function getCameraScopedViewState(
  current: CameraScopedViewState | null,
  cameraKey: string,
  fallbackViewState: MarketplaceMapViewState
): MarketplaceMapViewState {
  return current?.cameraKey === cameraKey ? current.viewState : fallbackViewState;
}

export function useMarketplaceMapViewState({
  pins,
  selectedPinId,
  initialViewState
}: UseMarketplaceMapViewStateInput): MarketplaceMapViewStateController {
  const cameraKey = createCameraKey(pins, selectedPinId);

  // Memoize so that cameraViewState has a stable reference between renders.
  // Without this, createMovedViewState receives a new object every render,
  // its areViewStatesEqual bail-out never fires (padding object ref differs),
  // and setMovedViewState is called on every render → React error #185.
  const cameraViewState = useMemo(
    () => createCameraViewState(pins, selectedPinId, initialViewState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cameraKey]
  );

  const [movedViewState, setMovedViewState] = useState<CameraScopedViewState | null>(null);
  const viewState = getCameraScopedViewState(movedViewState, cameraKey, cameraViewState);

  return {
    displayedViewState: viewState,
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
