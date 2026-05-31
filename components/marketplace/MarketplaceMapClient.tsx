"use client";

import { useEffect, useState } from "react";
import Map, { Marker, type ViewState } from "react-map-gl/mapbox";

import { formatMarketplaceSoldPercent } from "@/lib/marketplace-format";
import { createMarketplaceMapCameraViewState } from "@/lib/marketplace-map-camera";
import { createMarketplaceMapOrbitViewState } from "@/lib/marketplace-map-camera-motion";
import type { MarketplaceMapPin } from "@/lib/marketplace-map-pins";

type MapViewState = ViewState & {
  width: number;
  height: number;
};

type MarketplaceMapClientProps = {
  mapboxAccessToken: string;
  mapStyleUrl: string;
  pins: MarketplaceMapPin[];
  selectedPinId?: string | null;
  initialViewState?: Partial<MapViewState>;
  onPinHover?: (pin: MarketplaceMapPin) => void;
};

type CameraScopedViewState = {
  cameraKey: string;
  viewState: MapViewState;
};

type CameraScopedOrbitStep = {
  cameraKey: string;
  step: number;
};

type MarketplaceMapMarkerProps = {
  pin: MarketplaceMapPin;
  onActivate: (pin: MarketplaceMapPin) => void;
};

type CreateMovedViewStateInput = {
  current: CameraScopedViewState | null;
  cameraKey: string;
  cameraViewState: MapViewState;
  nextViewState: Partial<MapViewState>;
};

const MAPBOX_DIMENSION_PLACEHOLDER = {
  width: 1,
  height: 1
};

const MARKETPLACE_MAP_ACCENT_COLOR = "#67E8F9";
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
  initialViewState?: Partial<MapViewState>
): MapViewState {
  return {
    ...createMarketplaceMapCameraViewState(pins, selectedPinId),
    ...MAPBOX_DIMENSION_PLACEHOLDER,
    ...initialViewState
  };
}

function createHoveredViewState(pin: MarketplaceMapPin, current: MapViewState): MapViewState {
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
  fallbackViewState: MapViewState
): MapViewState {
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

function createDisplayedViewState(viewState: MapViewState, orbitStep: number): MapViewState {
  return orbitStep > 0 ? createMarketplaceMapOrbitViewState(viewState, orbitStep) : viewState;
}

function MarketplaceMapMarker({ pin, onActivate }: MarketplaceMapMarkerProps) {
  return (
    <Marker latitude={pin.latitude} longitude={pin.longitude} anchor="bottom">
      <div className="flex flex-col items-center">
        <button
          type="button"
          className="group flex min-h-11 min-w-16 items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/15 px-3 py-2 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.18)] transition hover:scale-105 hover:bg-cyan-300/25"
          aria-label={`${pin.title}, ${pin.locationLabel}, ${formatMarketplaceSoldPercent(pin.soldPercent)} sold`}
          onMouseEnter={() => onActivate(pin)}
          onFocus={() => onActivate(pin)}
        >
          <span className="max-w-[7.5rem] truncate text-[11px] font-semibold leading-none">{pin.title}</span>
          <span className="rounded-full bg-slate-950/85 px-2 py-1 text-[11px] font-semibold shadow-inner shadow-black/25">
            {formatMarketplaceSoldPercent(pin.soldPercent)}
          </span>
        </button>
        <span
          data-testid="marketplace-map-pin-leader"
          aria-hidden="true"
          className="h-9 w-px opacity-80 shadow-[0_0_12px_rgba(103,232,249,0.42)]"
          style={{ backgroundColor: MARKETPLACE_MAP_ACCENT_COLOR }}
        />
        <span
          data-testid="marketplace-map-pin-anchor"
          aria-hidden="true"
          className="h-2.5 w-2.5 rounded-full border bg-slate-950 shadow-[0_0_14px_rgba(103,232,249,0.55)]"
          style={{ borderColor: MARKETPLACE_MAP_ACCENT_COLOR }}
        />
      </div>
    </Marker>
  );
}

export function MarketplaceMapClient({
  mapboxAccessToken,
  mapStyleUrl,
  pins,
  selectedPinId,
  initialViewState,
  onPinHover
}: MarketplaceMapClientProps) {
  const cameraKey = createCameraKey(pins, selectedPinId);
  const cameraViewState = createCameraViewState(pins, selectedPinId, initialViewState);
  const [movedViewState, setMovedViewState] = useState<CameraScopedViewState | null>(null);
  const orbitStep = useDeferredOrbitStep(cameraKey);
  const viewState = getCameraScopedViewState(movedViewState, cameraKey, cameraViewState);
  const displayedViewState = createDisplayedViewState(viewState, orbitStep);

  function handlePinActivation(pin: MarketplaceMapPin): void {
    setMovedViewState({ cameraKey, viewState: createHoveredViewState(pin, viewState) });
    onPinHover?.(pin);
  }

  return (
    <div data-testid="marketplace-map-client" className="h-full min-h-[28rem] w-full">
      <Map
        reuseMaps
        mapStyle={mapStyleUrl}
        mapboxAccessToken={mapboxAccessToken}
        viewState={displayedViewState}
        onMove={(event) =>
          setMovedViewState((current) =>
            createMovedViewState({
              current,
              cameraKey,
              cameraViewState,
              nextViewState: event.viewState
            })
          )
        }
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        {pins.map((pin) => (
          <MarketplaceMapMarker key={pin.id} pin={pin} onActivate={handlePinActivation} />
        ))}
      </Map>
    </div>
  );
}
