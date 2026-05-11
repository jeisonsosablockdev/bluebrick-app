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

function getGoogleMapsApiKey(): string {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    throw new GoogleMapsPlacesServiceError(
      "GOOGLE_MAPS_UNAVAILABLE",
      "Google Maps autocomplete is unavailable because GOOGLE_MAPS_API_KEY is not configured.",
      503
    );
  }

  return apiKey;
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
    throw new GoogleMapsPlacesServiceError(
      "GOOGLE_MAPS_AUTOCOMPLETE_FAILED",
      `Google Maps autocomplete failed with status ${response.status}.`,
      502
    );
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
  location?: {
    latitude?: number;
    longitude?: number;
  };
  googleMapsUri?: string;
};

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
  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,displayName,formattedAddress,location,googleMapsUri",
      "X-Goog-Session-Token": input.sessionToken
    }
  });

  if (!response.ok) {
    throw new GoogleMapsPlacesServiceError(
      "GOOGLE_MAPS_PLACE_DETAILS_FAILED",
      `Google Maps place details failed with status ${response.status}.`,
      502
    );
  }

  const payload = (await response.json()) as GooglePlaceDetailsResponse;
  const placeLabel = payload.displayName?.text?.trim() || payload.formattedAddress?.trim() || "";
  const formattedAddress = payload.formattedAddress?.trim() || "";
  const lat = payload.location?.latitude;
  const lng = payload.location?.longitude;
  const googleMapsUrl = payload.googleMapsUri?.trim() || "";

  if (
    !payload.id?.trim() ||
    !placeLabel ||
    !formattedAddress ||
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    !googleMapsUrl
  ) {
    throw new GoogleMapsPlacesServiceError(
      "GOOGLE_MAPS_PLACE_DETAILS_INVALID",
      "Google Maps place details did not return the reduced payload fields required by the editor.",
      502
    );
  }

  return {
    placeId: payload.id.trim(),
    placeLabel,
    formattedAddress,
    lat,
    lng,
    googleMapsUrl
  };
}

export function isGoogleMapsPlacesServiceError(error: unknown): error is GoogleMapsPlacesServiceError {
  return error instanceof GoogleMapsPlacesServiceError;
}
