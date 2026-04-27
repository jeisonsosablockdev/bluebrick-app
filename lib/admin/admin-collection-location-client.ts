import type { CollectionBootstrapGoogleMapsPlace } from "@/lib/admin/collection-bootstrap-mapper";
import type { AdminCollectionLocationAutocompleteSuggestion } from "@/lib/admin/google-maps-places-service";

type AdminCollectionLocationAutocompleteSuccessResponse = {
  ok: true;
  data: {
    suggestions: AdminCollectionLocationAutocompleteSuggestion[];
  };
};

type AdminCollectionLocationResolveSuccessResponse = {
  ok: true;
  data: {
    googleMapsPlace: CollectionBootstrapGoogleMapsPlace;
  };
};

type AdminCollectionLocationErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

export class AdminCollectionLocationClientError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AdminCollectionLocationClientError";
    this.code = code;
  }
}

export function createAdminCollectionLocationSessionToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `location-session-${Math.random().toString(36).slice(2)}`;
}

export async function fetchAdminCollectionLocationSuggestions(input: {
  entryId: string;
  query: string;
  sessionToken: string;
}): Promise<AdminCollectionLocationAutocompleteSuggestion[]> {
  const response = await fetch(
    `/api/admin/collections/${encodeURIComponent(input.entryId)}/location-maps/autocomplete?q=${encodeURIComponent(
      input.query
    )}&sessionToken=${encodeURIComponent(input.sessionToken)}`,
    {
      cache: "no-store"
    }
  );

  const payload = (await response.json()) as
    | AdminCollectionLocationAutocompleteSuccessResponse
    | AdminCollectionLocationErrorResponse;

  if (!response.ok || "error" in payload) {
    throw new AdminCollectionLocationClientError(
      "error" in payload ? payload.error.code : "ADMIN_COLLECTION_LOCATION_AUTOCOMPLETE_FAILED",
      "error" in payload ? payload.error.message : "Could not load Google Maps autocomplete suggestions."
    );
  }

  return payload.data.suggestions;
}

export async function resolveAdminCollectionLocationPlace(input: {
  entryId: string;
  placeId: string;
  sessionToken: string;
}): Promise<CollectionBootstrapGoogleMapsPlace> {
  const response = await fetch(
    `/api/admin/collections/${encodeURIComponent(input.entryId)}/location-maps/resolve?placeId=${encodeURIComponent(
      input.placeId
    )}&sessionToken=${encodeURIComponent(input.sessionToken)}`,
    {
      cache: "no-store"
    }
  );

  const payload = (await response.json()) as
    | AdminCollectionLocationResolveSuccessResponse
    | AdminCollectionLocationErrorResponse;

  if (!response.ok || "error" in payload) {
    throw new AdminCollectionLocationClientError(
      "error" in payload ? payload.error.code : "ADMIN_COLLECTION_LOCATION_RESOLVE_FAILED",
      "error" in payload ? payload.error.message : "Could not resolve the selected Google Maps place."
    );
  }

  return payload.data.googleMapsPlace;
}
