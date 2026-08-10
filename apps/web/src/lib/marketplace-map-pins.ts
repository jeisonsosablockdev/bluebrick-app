export type MarketplaceMapPinSource = {
  id: string;
  title: string;
  locationLabel: string;
  country: string;
  geoLat?: number | null;
  geoLng?: number | null;
  supplyTotal: number;
  mintedOrSold: number;
};

export type MarketplaceMapPin = {
  id: string;
  title: string;
  locationLabel: string;
  href: string;
  latitude: number;
  longitude: number;
  soldPercent: number;
};

function isUsListing(source: MarketplaceMapPinSource): boolean {
  return source.country.trim().toUpperCase() === "US";
}

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" && !value.trim()) {
    return null;
  }

  const parsed = typeof value === "string" ? Number(value.trim()) : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function isValidLatitude(value: unknown): value is number {
  const latitude = toFiniteNumber(value);
  return latitude !== null && latitude >= -90 && latitude <= 90;
}

function isValidLongitude(value: unknown): value is number {
  const longitude = toFiniteNumber(value);
  return longitude !== null && longitude >= -180 && longitude <= 180;
}

function toSoldPercent(source: MarketplaceMapPinSource): number {
  const supplyTotal = toFiniteNumber(source.supplyTotal);
  const mintedOrSold = toFiniteNumber(source.mintedOrSold);

  if (supplyTotal === null || mintedOrSold === null || supplyTotal <= 0) {
    return 0;
  }

  const percent = (mintedOrSold / supplyTotal) * 100;
  return Math.round(percent * 100) / 100;
}

export function projectMarketplaceMapPins(listings: MarketplaceMapPinSource[]): MarketplaceMapPin[] {
  return listings
    .filter((listing) => isUsListing(listing))
    .filter((listing) => isValidLatitude(listing.geoLat) && isValidLongitude(listing.geoLng))
    .map((listing) => {
      const latitude = toFiniteNumber(listing.geoLat);
      const longitude = toFiniteNumber(listing.geoLng);

      return {
        id: listing.id,
        title: listing.title,
        locationLabel: listing.locationLabel,
        href: `/marketplace/${listing.id}`,
        latitude: latitude ?? 0,
        longitude: longitude ?? 0,
        soldPercent: toSoldPercent(listing)
      };
    });
}
