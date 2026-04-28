import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  assertAdminCollectionOwnership: vi.fn(),
  getRequestRole: vi.fn(),
  isAdminCollectionOwnershipError: vi.fn(),
  isGoogleMapsPlacesServiceError: vi.fn(),
  resolveGoogleMapsPlace: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/admin/collection-ownership", () => ({
  assertAdminCollectionOwnership: routeMocks.assertAdminCollectionOwnership,
  isAdminCollectionOwnershipError: routeMocks.isAdminCollectionOwnershipError
}));

vi.mock("@/lib/admin/google-maps-places-service", () => ({
  isGoogleMapsPlacesServiceError: routeMocks.isGoogleMapsPlacesServiceError,
  resolveGoogleMapsPlace: routeMocks.resolveGoogleMapsPlace
}));

import { GET } from "@/app/api/admin/collections/[id]/location-maps/resolve/route";

function createRequest(
  url = "https://example.com/api/admin/collections/entry-1/location-maps/resolve?placeId=place-1&sessionToken=session-1",
  headers?: Record<string, string>
): NextRequest {
  return new NextRequest(url, { method: "GET", headers });
}

function createContext(id = "entry-1") {
  return {
    params: Promise.resolve({ id })
  };
}

describe("GET /api/admin/collections/:id/location-maps/resolve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin111"
    });
    routeMocks.isAdminCollectionOwnershipError.mockReturnValue(false);
    routeMocks.isGoogleMapsPlacesServiceError.mockReturnValue(false);
    routeMocks.assertAdminCollectionOwnership.mockResolvedValue({ entryId: "entry-1" });
    routeMocks.resolveGoogleMapsPlace.mockResolvedValue({
      placeId: "place-1",
      placeLabel: "Oceanview Fractional Tower",
      formattedAddress: "Avenida San Martin 7-14, Bocagrande, Cartagena, CO",
      lat: 10.3997,
      lng: -75.5553,
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Oceanview%20Fractional%20Tower"
    });
  });

  it("returns the reduced place payload through the protected route contract", async () => {
    const response = await GET(createRequest(), createContext(" entry-1 "));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.googleMapsPlace.placeId).toBe("place-1");
    expect(routeMocks.assertAdminCollectionOwnership).toHaveBeenCalledWith("Admin111", "entry-1");
  });

  it("returns fixture place resolution without touching ownership helpers", async () => {
    const response = await GET(
      createRequest("https://example.com/api/admin/collections/entry-bri-101-primary/location-maps/resolve?placeId=fixture-oceanview-place-1&sessionToken=session-1", {
        cookie: "brids_admin_collections_fixture=bri-101"
      }),
      createContext("entry-bri-101-primary")
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.googleMapsPlace.placeId).toBe("fixture-oceanview-place-1");
    expect(routeMocks.assertAdminCollectionOwnership).not.toHaveBeenCalled();
  });
});
