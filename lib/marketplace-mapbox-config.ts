const MAPBOX_TOKEN_ENV = "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN";

export function getMarketplaceMapboxAccessToken(): string | null {
  const token = process.env[MAPBOX_TOKEN_ENV]?.trim();

  return token ? token : null;
}

export function isMarketplaceMapboxConfigured(): boolean {
  return getMarketplaceMapboxAccessToken() !== null;
}
