"use client";

import Map from "react-map-gl/mapbox";

import { MarketplaceMapMarker } from "@/components/marketplace/MarketplaceMapMarker";
import { useMarketplaceMapViewState, type MarketplaceMapViewState } from "@/components/marketplace/useMarketplaceMapViewState";
import type { MarketplaceMapPin } from "@/lib/marketplace-map-pins";

type MarketplaceMapClientProps = {
  mapboxAccessToken: string;
  mapStyleUrl: string;
  pins: MarketplaceMapPin[];
  selectedPinId?: string | null;
  initialViewState?: Partial<MarketplaceMapViewState>;
  onPinHover?: (pin: MarketplaceMapPin) => void;
};

export function MarketplaceMapClient({
  mapboxAccessToken,
  mapStyleUrl,
  pins,
  selectedPinId,
  initialViewState,
  onPinHover
}: MarketplaceMapClientProps) {
  const mapViewState = useMarketplaceMapViewState({ pins, selectedPinId, initialViewState });
  const markerRenderPins = [...pins].sort((firstPin, secondPin) => secondPin.latitude - firstPin.latitude);

  function handlePinActivation(pin: MarketplaceMapPin): void {
    mapViewState.focusPin(pin);
    onPinHover?.(pin);
  }

  return (
    <div data-testid="marketplace-map-client" className="h-full min-h-[28rem] w-full">
      <Map
        reuseMaps
        mapStyle={mapStyleUrl}
        mapboxAccessToken={mapboxAccessToken}
        viewState={mapViewState.displayedViewState}
        onMove={(event) => mapViewState.applyMapMove(event.viewState)}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        {markerRenderPins.map((pin) => (
          <MarketplaceMapMarker key={pin.id} pin={pin} onActivate={handlePinActivation} />
        ))}
      </Map>
    </div>
  );
}
