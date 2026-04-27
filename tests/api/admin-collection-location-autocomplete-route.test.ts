import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  assertAdminCollectionOwnership: vi.fn(),
  autocompleteGoogleMapsPlaces: vi.fn(),
  getAdminCollectionContentByEntryId: vi.fn(),
  getRequestRole: vi.fn(),
  isAdminCollectionOwnershipError: vi.fn(),
  isGoogleMapsPlacesServiceError: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/admin/collection-ownership", () => ({
  assertAdminCollectionOwnership: routeMocks.assertAdminCollectionOwnership,
  isAdminCollectionOwnershipError: routeMocks.isAdminCollectionOwnershipError
}));

vi.mock("@/lib/admin/collection-content-repository", () => ({
  getAdminCollectionContentByEntryId: routeMocks.getAdminCollectionContentByEntryId
}));

vi.mock("@/lib/admin/google-maps-places-service", () => ({
  autocompleteGoogleMapsPlaces: routeMocks.autocompleteGoogleMapsPlaces,
  isGoogleMapsPlacesServiceError: routeMocks.isGoogleMapsPlacesServiceError
}));

import { GET } from "@/app/api/admin/collections/[id]/location-maps/autocomplete/route";

function createRequest(
  url = "https://example.com/api/admin/collections/entry-1/location-maps/autocomplete?q=ocean&sessionToken=session-1",
  headers?: Record<string, string>
): NextRequest {
  return new NextRequest(url, { method: "GET", headers });
}

function createContext(id = "entry-1") {
  return {
    params: Promise.resolve({ id })
  };
}

describe("GET /api/admin/collections/:id/location-maps/autocomplete", () => {
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
    routeMocks.getAdminCollectionContentByEntryId.mockResolvedValue({
      city: "Cartagena",
      country: "CO"
    });
    routeMocks.autocompleteGoogleMapsPlaces.mockResolvedValue([
      {
        placeId: "place-1",
        fullText: "Oceanview Fractional Tower, Cartagena, CO",
        primaryText: "Oceanview Fractional Tower",
        secondaryText: "Cartagena, CO"
      }
    ]);
  });

  it("returns suggestions through the protected route contract", async () => {
    const response = await GET(createRequest(), createContext(" entry-1 "));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.suggestions).toHaveLength(1);
    expect(routeMocks.assertAdminCollectionOwnership).toHaveBeenCalledWith("Admin111", "entry-1");
    expect(routeMocks.autocompleteGoogleMapsPlaces).toHaveBeenCalledWith({
      query: "ocean",
      city: "Cartagena",
      country: "CO",
      sessionToken: "session-1"
    });
  });

  it("returns fixture suggestions without touching ownership helpers", async () => {
    const response = await GET(
      createRequest("https://example.com/api/admin/collections/entry-bri-101-primary/location-maps/autocomplete?q=ocean&sessionToken=session-1", {
        cookie: "brids_admin_collections_fixture=bri-101"
      }),
      createContext("entry-bri-101-primary")
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.suggestions[0].placeId).toBe("fixture-oceanview-place-1");
    expect(routeMocks.assertAdminCollectionOwnership).not.toHaveBeenCalled();
  });
});
