import { NextRequest, NextResponse } from "next/server";

import {
  autocompleteGoogleMapsPlaces,
  isGoogleMapsPlacesServiceError
} from "@/lib/admin/google-maps-places-service";
import { getRequestRole } from "@/lib/auth-session";

function errorResponse(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin" || !role.pubkey) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const country = request.nextUrl.searchParams.get("country")?.trim() ?? "";
  const city = request.nextUrl.searchParams.get("city")?.trim() ?? "";
  const sessionToken = request.nextUrl.searchParams.get("sessionToken")?.trim() ?? "";

  try {
    const suggestions = await autocompleteGoogleMapsPlaces({
      query,
      city,
      country,
      sessionToken
    });

    return NextResponse.json({
      ok: true,
      data: {
        suggestions
      }
    });
  } catch (error) {
    if (isGoogleMapsPlacesServiceError(error)) {
      return errorResponse(error.status, error.code, error.message);
    }

    const message = error instanceof Error ? error.message : "Could not load Google Maps autocomplete suggestions.";
    return errorResponse(500, "ADMIN_ASSET_LOCATION_AUTOCOMPLETE_FAILED", message);
  }
}
