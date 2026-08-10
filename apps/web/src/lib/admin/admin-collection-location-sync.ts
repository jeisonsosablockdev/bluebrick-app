import type { CollectionBootstrapGoogleMapsPlace } from "@/lib/admin/collection-bootstrap-mapper";

export type AdminCanonicalLocation = {
  city: string;
  country: string;
  stateProvince: string | null;
  postalCode: string | null;
  address: string;
  geoLat: number | null;
  geoLng: number | null;
};

function normalizeKey(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function uniqueSegments(segments: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const segment of segments) {
    const value = typeof segment === "string" ? segment.trim() : "";
    if (!value) {
      continue;
    }

    const key = normalizeKey(value);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(value);
  }

  return normalized;
}

function areCoordinatesEquivalent(
  location: AdminCanonicalLocation,
  place: CollectionBootstrapGoogleMapsPlace
): boolean {
  if (location.geoLat === null || location.geoLng === null) {
    return true;
  }

  return Math.abs(location.geoLat - place.lat) < 0.000001
    && Math.abs(location.geoLng - place.lng) < 0.000001;
}

function isAddressEquivalent(
  location: AdminCanonicalLocation,
  place: CollectionBootstrapGoogleMapsPlace
): boolean {
  const address = normalizeKey(location.address);
  const formattedAddress = normalizeKey(place.formattedAddress);
  const placeLabel = normalizeKey(place.placeLabel);

  if (!address) {
    return false;
  }

  return formattedAddress.includes(address)
    || address.includes(formattedAddress)
    || placeLabel.includes(address)
    || address.includes(placeLabel);
}

export function deriveAdminCanonicalLocationLabel(location: Pick<
  AdminCanonicalLocation,
  "city" | "country" | "stateProvince" | "postalCode"
>): string {
  const segments = uniqueSegments([location.city, location.stateProvince, location.postalCode, location.country]);
  return segments.join(", ");
}

export function reconcileAdminCollectionGoogleMapsPlace(input: {
  location: AdminCanonicalLocation;
  googleMapsPlace: CollectionBootstrapGoogleMapsPlace | null;
}): CollectionBootstrapGoogleMapsPlace | null {
  if (!input.googleMapsPlace) {
    return null;
  }

  if (!areCoordinatesEquivalent(input.location, input.googleMapsPlace)) {
    return null;
  }

  if (!isAddressEquivalent(input.location, input.googleMapsPlace)) {
    return null;
  }

  return input.googleMapsPlace;
}
