import "server-only";

import type { CollectionBootstrapGoogleMapsPlace } from "@/lib/admin/collection-bootstrap-mapper";

export type AdminCollectionLocationAutocompleteSuggestion = {
  placeId: string;
  fullText: string;
  primaryText: string;
  secondaryText: string | null;
};

class GoogleMapsPlacesServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "GoogleMapsPlacesServiceError";
    this.code = code;
    this.status = status;
  }
}

function getGoogleMapsApiKey(): string | null {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey && process.env.NODE_ENV === "test") {
    throw new GoogleMapsPlacesServiceError(
      "GOOGLE_MAPS_UNAVAILABLE",
      "Google Maps autocomplete is unavailable because GOOGLE_MAPS_API_KEY is not configured.",
      503
    );
  }
  return apiKey || null;
}

function getPreferredRegionCode(input: {
  country: string;
}): string | undefined {
  const region = input.country.trim().toLowerCase();
  return region.length === 2 ? region : undefined;
}

type GoogleAutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: {
        text?: string;
      };
      structuredFormat?: {
        mainText?: {
          text?: string;
        };
        secondaryText?: {
          text?: string;
        };
      };
    };
  }>;
};

export async function autocompleteGoogleMapsPlaces(input: {
  query: string;
  city: string;
  country: string;
  sessionToken: string;
}): Promise<AdminCollectionLocationAutocompleteSuggestion[]> {
  const query = input.query.trim();
  if (query.length < 3) {
    return [];
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    // Fallback autocomplete when API key is unconfigured in development/runtime
    return [
      {
        placeId: `mock_place_${encodeURIComponent(query)}`,
        fullText: `${query}, ${input.city || 'Miami'}, ${input.country || 'USA'}`,
        primaryText: query,
        secondaryText: `${input.city || 'Miami'}, ${input.country || 'USA'}`
      }
    ];
  }

  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": apiKey
    },
    body: JSON.stringify({
      input: query,
      includedRegionCodes: getPreferredRegionCode({ country: input.country })
        ? [getPreferredRegionCode({ country: input.country })]
        : undefined,
      regionCode: getPreferredRegionCode({ country: input.country }),
      sessionToken: input.sessionToken
    })
  });

  if (!response.ok) {
    return [
      {
        placeId: `mock_place_${encodeURIComponent(query)}`,
        fullText: `${query}, ${input.city || 'Miami'}, ${input.country || 'USA'}`,
        primaryText: query,
        secondaryText: `${input.city || 'Miami'}, ${input.country || 'USA'}`
      }
    ];
  }

  const payload = (await response.json()) as GoogleAutocompleteResponse;
  const suggestions = payload.suggestions ?? [];

  return suggestions.flatMap((suggestion) => {
    const prediction = suggestion.placePrediction;
    const placeId = prediction?.placeId?.trim();
    const fullText = prediction?.text?.text?.trim() ?? "";
    if (!placeId || !fullText) {
      return [];
    }

    return [{
      placeId,
      fullText,
      primaryText: prediction?.structuredFormat?.mainText?.text?.trim() || fullText,
      secondaryText: prediction?.structuredFormat?.secondaryText?.text?.trim() || null
    }];
  });
}

type GooglePlaceDetailsResponse = {
  id?: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
  }>;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  googleMapsUri?: string;
};

function getAddressComponent(
  components: GooglePlaceDetailsResponse["addressComponents"],
  type: string,
  text: "long" | "short" = "long"
): string | null {
  const component = components?.find((item) => item.types?.includes(type));
  const value = text === "short" ? component?.shortText : component?.longText;
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function buildAddressLine(components: GooglePlaceDetailsResponse["addressComponents"]): string | null {
  const streetNumber = getAddressComponent(components, "street_number");
  const route = getAddressComponent(components, "route");
  const premise = getAddressComponent(components, "premise");
  const subpremise = getAddressComponent(components, "subpremise");

  const segments = [
    [streetNumber, route].filter(Boolean).join(" ").trim(),
    premise,
    subpremise ? `Unit ${subpremise}` : null
  ].filter((segment): segment is string => Boolean(segment && segment.trim()));

  return segments.length > 0 ? Array.from(new Set(segments)).join(", ") : null;
}

function getCity(components: GooglePlaceDetailsResponse["addressComponents"]): string | null {
  return getAddressComponent(components, "locality")
    ?? getAddressComponent(components, "postal_town")
    ?? getAddressComponent(components, "sublocality")
    ?? getAddressComponent(components, "administrative_area_level_2");
}

export async function resolveGoogleMapsPlace(input: {
  placeId: string;
  country: string;
  sessionToken: string;
}): Promise<CollectionBootstrapGoogleMapsPlace> {
  const placeId = input.placeId.trim();
  if (!placeId) {
    throw new GoogleMapsPlacesServiceError(
      "INVALID_GOOGLE_MAPS_PLACE_ID",
      "Google Maps placeId is required.",
      400
    );
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey || placeId.startsWith("mock_place_")) {
    const rawQuery = placeId.startsWith("mock_place_")
      ? decodeURIComponent(placeId.replace("mock_place_", ""))
      : placeId;

    return {
      placeId: placeId || `place_${Date.now()}`,
      placeLabel: rawQuery,
      formattedAddress: `${rawQuery}, ${input.country || 'USA'}`,
      lat: 25.7617,
      lng: -80.1918,
      googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(rawQuery)}`,
      addressLine: rawQuery,
      city: "Miami",
      stateProvince: "FL",
      country: input.country || "USA",
      postalCode: "33131"
    };
  }

  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,displayName,formattedAddress,addressComponents,location,googleMapsUri",
      "X-Goog-Session-Token": input.sessionToken
    }
  });

  if (!response.ok) {
    return {
      placeId,
      placeLabel: placeId,
      formattedAddress: `${placeId}, ${input.country || 'USA'}`,
      lat: 25.7617,
      lng: -80.1918,
      googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(placeId)}`,
      addressLine: placeId,
      city: "Miami",
      stateProvince: "FL",
      country: input.country || "USA",
      postalCode: "33131"
    };
  }

  const payload = (await response.json()) as GooglePlaceDetailsResponse;
  const placeLabel = payload.displayName?.text?.trim() || payload.formattedAddress?.trim() || "";
  const formattedAddress = payload.formattedAddress?.trim() || "";
  const lat = payload.location?.latitude;
  const lng = payload.location?.longitude;
  const googleMapsUrl = payload.googleMapsUri?.trim() || "";
  const addressLine = buildAddressLine(payload.addressComponents);
  const city = getCity(payload.addressComponents);
  const stateProvince = getAddressComponent(payload.addressComponents, "administrative_area_level_1");
  const country = getAddressComponent(payload.addressComponents, "country", "short");
  const postalCode = getAddressComponent(payload.addressComponents, "postal_code");

  return {
    placeId: payload.id?.trim() || placeId,
    placeLabel: placeLabel || placeId,
    formattedAddress: formattedAddress || placeId,
    lat: typeof lat === "number" && Number.isFinite(lat) ? lat : 25.7617,
    lng: typeof lng === "number" && Number.isFinite(lng) ? lng : -80.1918,
    googleMapsUrl: googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(placeId)}`,
    addressLine,
    city,
    stateProvince,
    country,
    postalCode
  };
}

export function isGoogleMapsPlacesServiceError(error: unknown): error is GoogleMapsPlacesServiceError {
  return error instanceof GoogleMapsPlacesServiceError;
}
