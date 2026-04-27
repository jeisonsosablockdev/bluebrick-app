import type { AdminCollectionContentRecord } from "@/lib/admin/collection-content-repository";

function normalizeSegments(segments: Array<string | null | undefined>): string[] {
  return segments
    .map((segment) => (typeof segment === "string" ? segment.trim() : ""))
    .filter((segment) => segment.length > 0);
}

export function buildAdminCollectionLocationLabel(content: Pick<
  AdminCollectionContentRecord,
  "locationLabel" | "detailedLocation" | "city" | "country"
>): string | null {
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
  "locationLabel" | "detailedLocation" | "city" | "country" | "googleMapsPlace"
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
    content.country
  ]);
  return fallback.length > 0 ? fallback.join(", ") : null;
}

export function buildAdminCollectionGoogleMapsUrl(content: Pick<
  AdminCollectionContentRecord,
  "locationLabel" | "detailedLocation" | "city" | "country" | "googleMapsPlace"
>): string | null {
  if (content.googleMapsPlace?.googleMapsUrl) {
    return content.googleMapsPlace.googleMapsUrl;
  }

  const query = buildAdminCollectionLocationQuery(content);
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

export function buildAdminCollectionGoogleMapsEmbedUrl(content: Pick<
  AdminCollectionContentRecord,
  "locationLabel" | "detailedLocation" | "city" | "country" | "googleMapsPlace"
>): string | null {
  if (content.googleMapsPlace) {
    return `https://www.google.com/maps?q=${encodeURIComponent(
      `${content.googleMapsPlace.lat},${content.googleMapsPlace.lng}`
    )}&z=15&output=embed`;
  }

  const query = buildAdminCollectionLocationQuery(content);
  return query ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed` : null;
}
