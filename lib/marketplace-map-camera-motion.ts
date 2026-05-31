export type MarketplaceMapOrbitViewState = {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
};

const ORBIT_LATITUDE_RADIUS = 0.006;
const ORBIT_LONGITUDE_RADIUS = 0.008;
const ORBIT_BEARING_RADIUS = 0.8;
const ORBIT_PITCH_LIFT = 0.35;

export function createMarketplaceMapOrbitViewState<TViewState extends MarketplaceMapOrbitViewState>(
  baseViewState: TViewState,
  orbitStep: number
): TViewState {
  const angle = orbitStep * 0.55;

  return {
    ...baseViewState,
    latitude: baseViewState.latitude + Math.sin(angle) * ORBIT_LATITUDE_RADIUS,
    longitude: baseViewState.longitude + Math.cos(angle) * ORBIT_LONGITUDE_RADIUS,
    bearing: baseViewState.bearing + Math.sin(angle) * ORBIT_BEARING_RADIUS,
    pitch: baseViewState.pitch + ORBIT_PITCH_LIFT
  };
}
