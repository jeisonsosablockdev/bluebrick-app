import type { MarketplaceMapPin } from "@/lib/marketplace-map-pins";

export type MarketplaceMapCameraViewState = {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
  padding: { top: number; bottom: number; left: number; right: number };
};

const DEFAULT_US_CAMERA_VIEW_STATE: MarketplaceMapCameraViewState = {
  latitude: 39.8283,
  longitude: -98.5795,
  zoom: 3.45,
  bearing: 0,
  pitch: 45,
  padding: { top: 0, bottom: 0, left: 0, right: 0 }
};

const SELECTED_PIN_ZOOM = 7.25;

function toAggregateZoom(latitudeSpan: number, longitudeSpan: number): number {
  const maxSpan = Math.max(latitudeSpan, longitudeSpan);

  if (maxSpan <= 1) {
    return 7;
  }

  if (maxSpan <= 5) {
    return 5.8;
  }

  if (maxSpan <= 15) {
    return 4.8;
  }

  if (maxSpan <= 35) {
    return 4.2;
  }

  return 3.45;
}

function createSelectedPinViewState(pin: MarketplaceMapPin): MarketplaceMapCameraViewState {
  return {
    ...DEFAULT_US_CAMERA_VIEW_STATE,
    latitude: pin.latitude,
    longitude: pin.longitude,
    zoom: SELECTED_PIN_ZOOM,
    pitch: 52
  };
}

function createAggregatePinViewState(pins: MarketplaceMapPin[]): MarketplaceMapCameraViewState {
  if (pins.length === 0) {
    return DEFAULT_US_CAMERA_VIEW_STATE;
  }

  if (pins.length === 1) {
    return createSelectedPinViewState(pins[0]);
  }

  const latitudes = pins.map((pin) => pin.latitude);
  const longitudes = pins.map((pin) => pin.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return {
    ...DEFAULT_US_CAMERA_VIEW_STATE,
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    zoom: toAggregateZoom(maxLatitude - minLatitude, maxLongitude - minLongitude)
  };
}

export function createMarketplaceMapCameraViewState(
  pins: MarketplaceMapPin[],
  selectedPinId?: string | null
): MarketplaceMapCameraViewState {
  const selectedPin = selectedPinId ? pins.find((pin) => pin.id === selectedPinId) : null;

  if (selectedPin) {
    return createSelectedPinViewState(selectedPin);
  }

  return createAggregatePinViewState(pins);
}
