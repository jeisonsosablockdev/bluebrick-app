import type { AdminCollectionContentRecord } from "@/lib/admin/collection-content-repository";

function normalizeSegments(segments: Array<string | null | undefined>): string[] {
  return segments
    .map((segment) => (typeof segment === "string" ? segment.trim() : ""))
    .filter((segment) => segment.length > 0);
}

function resolveGoogleMapsEmbedApiKey(explicitApiKey?: string | null): string | null {
  if (typeof explicitApiKey === "string" && explicitApiKey.trim().length > 0) {
    return explicitApiKey.trim();
  }

  const embedApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY?.trim();
  if (embedApiKey) {
    return embedApiKey;
  }

  const publicApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (publicApiKey) {
    return publicApiKey;
  }

  const serverApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  return serverApiKey && serverApiKey.length > 0 ? serverApiKey : null;
}

export function buildAdminCollectionLocationLabel(content: Pick<
  AdminCollectionContentRecord,
  "locationLabel" | "detailedLocation" | "city" | "country" | "postalCode" | "googleMapsPlace"
>): string | null {
  const placeSegments = normalizeSegments([
    content.googleMapsPlace?.city,
    content.googleMapsPlace?.stateProvince,
    content.googleMapsPlace?.postalCode,
    content.googleMapsPlace?.country
  ]);
  if (placeSegments.length > 0) {
    return placeSegments.join(", ");
  }

  const primary = normalizeSegments([
    content.locationLabel,
    content.detailedLocation
  ]);
  if (primary.length > 0) {
    return primary.join(" · ");
  }

  const fallback = normalizeSegments([content.city, content.country]);
  return fallback.length > 0 ? fallback.join(", ") : null;
}

export function buildAdminCollectionLocationQuery(content: Pick<
  AdminCollectionContentRecord,
  "locationLabel" | "detailedLocation" | "city" | "country" | "postalCode" | "googleMapsPlace"
>): string | null {
  const fromPlace = normalizeSegments([
    content.googleMapsPlace?.formattedAddress,
    content.googleMapsPlace?.placeLabel
  ]);
  if (fromPlace.length > 0) {
    return fromPlace.join(", ");
  }

  const fallback = normalizeSegments([
    content.detailedLocation,
    content.locationLabel,
    content.city,
    content.postalCode,
    content.country
  ]);
  return fallback.length > 0 ? fallback.join(", ") : null;
}

export function buildAdminCollectionGoogleMapsUrl(content: Pick<
  AdminCollectionContentRecord,
  "locationLabel" | "detailedLocation" | "city" | "country" | "postalCode" | "googleMapsPlace"
>): string | null {
  if (content.googleMapsPlace?.googleMapsUrl) {
    return content.googleMapsPlace.googleMapsUrl;
  }

  const query = buildAdminCollectionLocationQuery(content);
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

export function buildAdminCollectionGoogleMapsEmbedUrl(content: Pick<
  AdminCollectionContentRecord,
  "locationLabel" | "detailedLocation" | "city" | "country" | "postalCode" | "googleMapsPlace"
>, options?: {
  apiKey?: string | null;
}): string | null {
  const apiKey = resolveGoogleMapsEmbedApiKey(options?.apiKey);
  if (!apiKey) {
    return null;
  }

  if (content.googleMapsPlace?.placeId) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(
      `place_id:${content.googleMapsPlace.placeId}`
    )}`;
  }

  if (content.googleMapsPlace) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(
      `${content.googleMapsPlace.lat},${content.googleMapsPlace.lng}`
    )}`;
  }

  const query = buildAdminCollectionLocationQuery(content);
  return query
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}`
    : null;
}
