import { NextRequest, NextResponse } from "next/server";

import { getAdminCollectionsE2eFixture } from "@/lib/admin/admin-collections-e2e-fixture";
import {
  assertAdminCollectionOwnership,
  isAdminCollectionOwnershipError
} from "@/lib/admin/collection-ownership";
import {
  isGoogleMapsPlacesServiceError,
  resolveGoogleMapsPlace
} from "@/lib/admin/google-maps-places-service";
import { getRequestRole } from "@/lib/auth-session";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

function errorResponse(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin" || !role.pubkey) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  const { id } = await params;
  const collectionId = id.trim();
  const placeId = request.nextUrl.searchParams.get("placeId")?.trim() ?? "";
  const sessionToken = request.nextUrl.searchParams.get("sessionToken")?.trim() ?? "";

  try {
    const fixture = getAdminCollectionsE2eFixture(request);
    if (fixture) {
      const detail = fixture.detailsByEntryId[collectionId] ?? null;
      if (!detail) {
        return errorResponse(404, "COLLECTION_NOT_FOUND", "Collection was not found.");
      }

      if (!placeId) {
        return errorResponse(400, "INVALID_GOOGLE_MAPS_PLACE_ID", "Google Maps placeId is required.");
      }

      return NextResponse.json({
        ok: true,
        data: {
          googleMapsPlace: {
            placeId: "fixture-oceanview-place-1",
            placeLabel: "Oceanview Fractional Tower",
            formattedAddress: "Avenida San Martin 7-14, Bocagrande, Cartagena, CO",
            lat: 10.3997,
            lng: -75.5553,
            googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Oceanview%20Fractional%20Tower",
            addressLine: "Avenida San Martin 7-14",
            city: "Cartagena",
            stateProvince: "Bolivar",
            country: "CO",
            postalCode: "130001"
          }
        }
      });
    }

    const ownership = await assertAdminCollectionOwnership(role.pubkey, collectionId);
    if (!ownership.entryId) {
      return errorResponse(404, "COLLECTION_NOT_FOUND", "Collection was not found.");
    }

    const googleMapsPlace = await resolveGoogleMapsPlace({
      placeId,
      country: "",
      sessionToken
    });

    return NextResponse.json({
      ok: true,
      data: {
        googleMapsPlace
      }
    });
  } catch (error) {
    if (isAdminCollectionOwnershipError(error) || isGoogleMapsPlacesServiceError(error)) {
      return errorResponse(error.status, error.code, error.message);
    }

    const message = error instanceof Error ? error.message : "Could not resolve Google Maps place details.";
    return errorResponse(500, "ADMIN_COLLECTION_LOCATION_RESOLVE_FAILED", message);
  }
}
