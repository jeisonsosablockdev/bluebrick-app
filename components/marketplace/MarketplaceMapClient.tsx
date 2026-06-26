"use client";

import { useEffect, useRef } from "react";
import Map, { type MapRef } from "react-map-gl/mapbox";

import { MarketplaceMapMarker } from "@/components/marketplace/MarketplaceMapMarker";
import { createMarketplaceMapCameraViewState } from "@/lib/marketplace-map-camera";
import type { MarketplaceMapPin } from "@/lib/marketplace-map-pins";

type MarketplaceMapClientProps = {
  mapboxAccessToken: string;
  mapStyleUrl: string;
  pins: MarketplaceMapPin[];
  selectedPinId?: string | null;
  onPinHover?: (pin: MarketplaceMapPin) => void;
};

export function MarketplaceMapClient({
  mapboxAccessToken,
  mapStyleUrl,
  pins,
  selectedPinId,
  onPinHover
}: MarketplaceMapClientProps) {
  const mapRef = useRef<MapRef>(null);

  // Initial camera position derived from pins / selected pin — only used once on mount.
  const initialCamera = createMarketplaceMapCameraViewState(pins, selectedPinId);

  // When selectedPinId changes, fly to the pin imperatively without touching
  // controlled React state, which would trigger an onMove → setState loop.
  useEffect(() => {
    if (!selectedPinId) return;
    const pin = pins.find((p) => p.id === selectedPinId);
    if (!pin) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    map.easeTo({
      center: [pin.longitude, pin.latitude],
      zoom: Math.max(map.getZoom(), 7.25),
      pitch: 52,
      duration: 600
    });
  }, [selectedPinId, pins]);

  const markerRenderPins = [...pins].sort((a, b) => b.latitude - a.latitude);

  function handlePinActivation(pin: MarketplaceMapPin): void {
    const map = mapRef.current?.getMap();
    if (map) {
      map.easeTo({
        center: [pin.longitude, pin.latitude],
        zoom: Math.max(map.getZoom(), 7.25),
        pitch: 52,
        duration: 400
      });
    }
    onPinHover?.(pin);
  }

  return (
    <div data-testid="marketplace-map-client" className="h-full min-h-[28rem] w-full">
      <Map
        ref={mapRef}
        reuseMaps
        mapStyle={mapStyleUrl}
        mapboxAccessToken={mapboxAccessToken}
        initialViewState={{
          latitude: initialCamera.latitude,
          longitude: initialCamera.longitude,
          zoom: initialCamera.zoom,
          bearing: initialCamera.bearing,
          pitch: initialCamera.pitch,
          padding: initialCamera.padding
        }}
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
