import { NextRequest, NextResponse } from "next/server";

import { getAdminCollectionsE2eFixture } from "@/lib/admin/admin-collections-e2e-fixture";
import {
  assertAdminCollectionOwnership,
  isAdminCollectionOwnershipError
} from "@/lib/admin/collection-ownership";
import { getAdminCollectionContentByEntryId } from "@/lib/admin/collection-content-repository";
import {
  autocompleteGoogleMapsPlaces,
  isGoogleMapsPlacesServiceError
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
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const sessionToken = request.nextUrl.searchParams.get("sessionToken")?.trim() ?? "";

  try {
    const fixture = getAdminCollectionsE2eFixture(request);
    if (fixture) {
      const detail = fixture.detailsByEntryId[collectionId] ?? null;
      if (!detail) {
        return errorResponse(404, "COLLECTION_NOT_FOUND", "Collection was not found.");
      }

      if (query.length < 3) {
        return NextResponse.json({ ok: true, data: { suggestions: [] } });
      }

      return NextResponse.json({
        ok: true,
        data: {
          suggestions: [
            {
              placeId: "fixture-oceanview-place-1",
              fullText: "Oceanview Fractional Tower, Avenida San Martin 7-14, Bocagrande, Cartagena, CO",
              primaryText: "Oceanview Fractional Tower",
              secondaryText: "Avenida San Martin 7-14, Bocagrande, Cartagena, CO"
            }
          ]
        }
      });
    }

    const ownership = await assertAdminCollectionOwnership(role.pubkey, collectionId);
    const content = await getAdminCollectionContentByEntryId(ownership.entryId);
    if (!content) {
      return errorResponse(404, "COLLECTION_CONTENT_NOT_FOUND", "Collection content was not found.");
    }

    const suggestions = await autocompleteGoogleMapsPlaces({
      query,
      city: content.city,
      country: content.country,
      sessionToken
    });

    return NextResponse.json({
      ok: true,
      data: {
        suggestions
      }
    });
  } catch (error) {
    if (isAdminCollectionOwnershipError(error) || isGoogleMapsPlacesServiceError(error)) {
      return errorResponse(error.status, error.code, error.message);
    }

    const message = error instanceof Error ? error.message : "Could not load Google Maps autocomplete suggestions.";
    return errorResponse(500, "ADMIN_COLLECTION_LOCATION_AUTOCOMPLETE_FAILED", message);
  }
}
