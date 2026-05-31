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

function createHoveredViewState(pin: MarketplaceMapPin, current: MapViewState): MapViewState {
  return {
    ...current,
    latitude: pin.latitude,
    longitude: pin.longitude,
    zoom: Math.max(current.zoom, 7.25),
    pitch: 52
  };
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
  const cameraViewState: MapViewState = {
    ...createMarketplaceMapCameraViewState(pins, selectedPinId),
    ...MAPBOX_DIMENSION_PLACEHOLDER,
    ...initialViewState
  };
  const [movedViewState, setMovedViewState] = useState<{ cameraKey: string; viewState: MapViewState } | null>(null);
  const [orbitStepByCameraKey, setOrbitStepByCameraKey] = useState<{ cameraKey: string; step: number } | null>(null);
  const orbitStep = orbitStepByCameraKey?.cameraKey === cameraKey ? orbitStepByCameraKey.step : 0;
  const viewState = movedViewState?.cameraKey === cameraKey ? movedViewState.viewState : cameraViewState;
  const displayedViewState = orbitStep > 0 ? createMarketplaceMapOrbitViewState(viewState, orbitStep) : viewState;

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

  return (
    <div data-testid="marketplace-map-client" className="h-full min-h-[28rem] w-full">
      <Map
        reuseMaps
        mapStyle={mapStyleUrl}
        mapboxAccessToken={mapboxAccessToken}
        viewState={displayedViewState}
        onMove={(event) =>
          setMovedViewState((current) => ({
            cameraKey,
            viewState: {
              ...(current?.cameraKey === cameraKey ? current.viewState : cameraViewState),
              ...event.viewState,
              width: current?.cameraKey === cameraKey ? current.viewState.width : cameraViewState.width,
              height: current?.cameraKey === cameraKey ? current.viewState.height : cameraViewState.height
            }
          }))
        }
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        {pins.map((pin) => (
          <Marker key={pin.id} latitude={pin.latitude} longitude={pin.longitude} anchor="bottom">
            <div className="flex flex-col items-center">
              <button
                type="button"
                className="group flex min-h-11 min-w-16 items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/15 px-3 py-2 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.18)] transition hover:scale-105 hover:bg-cyan-300/25"
                aria-label={`${pin.title}, ${pin.locationLabel}, ${pin.soldPercent}% sold`}
                onMouseEnter={() => {
                  setMovedViewState({ cameraKey, viewState: createHoveredViewState(pin, viewState) });
                  onPinHover?.(pin);
                }}
                onFocus={() => {
                  setMovedViewState({ cameraKey, viewState: createHoveredViewState(pin, viewState) });
                  onPinHover?.(pin);
                }}
              >
                <span className="max-w-[7.5rem] truncate text-[11px] font-semibold leading-none">
                  {pin.title}
                </span>
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
        ))}
      </Map>
    </div>
  );
}
