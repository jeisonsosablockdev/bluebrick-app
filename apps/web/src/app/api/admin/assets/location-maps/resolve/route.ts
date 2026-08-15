import { NextRequest, NextResponse } from "next/server";

import {
  isGoogleMapsPlacesServiceError,
  resolveGoogleMapsPlace
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

  const placeId = request.nextUrl.searchParams.get("placeId")?.trim() ?? "";
  const country = request.nextUrl.searchParams.get("country")?.trim() ?? "";
  const sessionToken = request.nextUrl.searchParams.get("sessionToken")?.trim() ?? "";

  try {
    const googleMapsPlace = await resolveGoogleMapsPlace({
      placeId,
      country,
      sessionToken
    });

    return NextResponse.json({
      ok: true,
      data: {
        googleMapsPlace
      }
    });
  } catch (error) {
    if (isGoogleMapsPlacesServiceError(error)) {
      return errorResponse(error.status, error.code, error.message);
    }

    const message = error instanceof Error ? error.message : "Could not resolve Google Maps place details.";
    return errorResponse(500, "ADMIN_ASSET_LOCATION_RESOLVE_FAILED", message);
  }
}
