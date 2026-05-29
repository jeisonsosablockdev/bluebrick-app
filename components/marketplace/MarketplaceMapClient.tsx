"use client";

import { useState } from "react";
import Map, { Marker, type ViewState } from "react-map-gl/mapbox";

import type { MarketplaceMapPin } from "@/lib/marketplace-map-pins";

type MapViewState = ViewState & {
  width: number;
  height: number;
};

type MarketplaceMapClientProps = {
  mapboxAccessToken: string;
  pins: MarketplaceMapPin[];
  initialViewState?: Partial<MapViewState>;
  onPinHover?: (pin: MarketplaceMapPin) => void;
};

const DEFAULT_US_VIEW_STATE: MapViewState = {
  latitude: 39.8283,
  longitude: -98.5795,
  zoom: 3.45,
  bearing: 0,
  pitch: 45,
  width: 1,
  height: 1,
  padding: { top: 0, bottom: 0, left: 0, right: 0 }
};

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
  pins,
  initialViewState,
  onPinHover
}: MarketplaceMapClientProps) {
  const [viewState, setViewState] = useState<MapViewState>({
    ...DEFAULT_US_VIEW_STATE,
    ...initialViewState
  });

  return (
    <div data-testid="marketplace-map-client" className="h-full min-h-[28rem] w-full">
      <Map
        reuseMaps
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={mapboxAccessToken}
        viewState={viewState}
        onMove={(event) =>
          setViewState((current) => ({
            ...current,
            ...event.viewState,
            width: current.width,
            height: current.height
          }))
        }
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        {pins.map((pin) => (
          <Marker key={pin.id} latitude={pin.latitude} longitude={pin.longitude} anchor="bottom">
            <button
              type="button"
              className="group flex min-h-11 min-w-11 items-center justify-center rounded-full border border-cyan-200/30 bg-cyan-300/15 px-3 text-xs font-semibold text-white shadow-[0_0_0_1px_rgba(34,211,238,0.18)] transition hover:scale-105 hover:bg-cyan-300/25"
              aria-label={`${pin.title}, ${pin.locationLabel}, ${pin.soldPercent}% sold`}
              onMouseEnter={() => {
                setViewState((current) => createHoveredViewState(pin, current));
                onPinHover?.(pin);
              }}
              onFocus={() => {
                setViewState((current) => createHoveredViewState(pin, current));
                onPinHover?.(pin);
              }}
            >
              <span className="rounded-full bg-slate-950/85 px-2 py-1 shadow-inner shadow-black/25">
                {pin.soldPercent.toFixed(Number.isInteger(pin.soldPercent) ? 0 : 2).replace(/\.00$/, "")}%
              </span>
            </button>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
