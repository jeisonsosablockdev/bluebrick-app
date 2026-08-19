const MAPBOX_TOKEN_ENV = "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN";
const MAPBOX_STYLE_ENV = "NEXT_PUBLIC_MAPBOX_STYLE_URL";
const MARKETPLACE_MAPBOX_DEFAULT_STYLE_URL = "mapbox://styles/mapbox/dark-v11";

export function getMarketplaceMapboxAccessToken(): string | null {
  const token = process.env[MAPBOX_TOKEN_ENV]?.trim();

  return token ? token : null;
}

export function isMarketplaceMapboxConfigured(): boolean {
  return getMarketplaceMapboxAccessToken() !== null;
}

export function getMarketplaceMapboxStyleUrl(): string {
  const styleUrl = process.env[MAPBOX_STYLE_ENV]?.trim();

  return styleUrl || MARKETPLACE_MAPBOX_DEFAULT_STYLE_URL;
}
