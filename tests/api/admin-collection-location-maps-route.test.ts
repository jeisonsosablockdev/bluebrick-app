import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  assertAdminCollectionOwnership: vi.fn(),
  getAdminCollectionContentByEntryId: vi.fn(),
  getRequestRole: vi.fn(),
  isAdminCollectionOwnershipError: vi.fn()
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

import { GET } from "@/app/api/admin/collections/[id]/location-maps/route";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function createRequest(
  url = "https://example.com/api/admin/collections/entry-1/location-maps",
  headers?: Record<string, string>
): NextRequest {
  return new NextRequest(url, { method: "GET", headers });
}

function createContext(id = "entry-1"): RouteContext {
  return {
    params: Promise.resolve({ id })
  };
}

function buildContentRecord(input: Record<string, unknown> = {}) {
  return {
    entryId: "entry-1",
    title: "Central Tower",
    city: "Bogota",
    country: "CO",
    locationLabel: "Financial district",
    detailedLocation: "Calle 72 # 10-34, Bogota",
    createdBy: "Admin111",
    coverImageUrl: "https://cdn.example.com/cover.jpg",
    collectionAddress: "Collection111",
    candyMachineAddress: "Candy111",
    galleryImages: [],
    propertyImages: [],
    documents: [],
    fractionalInvestmentSummary: "Stable yield.",
    propertyInformation: "Prime property.",
    googleMapsPlace: null,
    updatedBy: "Admin111",
    updatedAt: "2026-04-25T04:00:00.000Z",
    ...input
  };
}

describe("GET /api/admin/collections/:id/location-maps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin111"
    });
    routeMocks.isAdminCollectionOwnershipError.mockReturnValue(false);
    routeMocks.assertAdminCollectionOwnership.mockResolvedValue({
      entryId: "entry-1"
    });
    routeMocks.getAdminCollectionContentByEntryId.mockResolvedValue(buildContentRecord());
  });

  it("returns 403 when caller is not an authenticated admin with a pubkey", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "admin"
    });

    const response = await GET(createRequest(), createContext());
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
  });

  it("returns the normalized location/maps section contract", async () => {
    const response = await GET(createRequest(), createContext(" entry-1 "));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.context.city).toBe("Bogota");
    expect(payload.data.context.currentLabel).toBe("Financial district · Calle 72 # 10-34, Bogota");
    expect(payload.data.outboundUrl).toContain("google.com/maps/search/");
    expect(routeMocks.assertAdminCollectionOwnership).toHaveBeenCalledWith("Admin111", "entry-1");
    expect(routeMocks.getAdminCollectionContentByEntryId).toHaveBeenCalledWith("entry-1");
  });

  it("returns the E2E fixture location contract when the fixture cookie is present", async () => {
    const response = await GET(
      createRequest("https://example.com/api/admin/collections/entry-bri-101-primary/location-maps", {
        cookie: "brids_admin_collections_fixture=bri-101"
      }),
      createContext("entry-bri-101-primary")
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.context.city).toBe("Cartagena");
    expect(payload.data.googleMapsPlace.placeId).toBe("place-oceanview");
    expect(routeMocks.assertAdminCollectionOwnership).not.toHaveBeenCalled();
  });

  it("returns ownership helper errors without loading content", async () => {
    const ownershipError = Object.assign(new Error("Collection was not found."), {
      code: "COLLECTION_NOT_FOUND",
      status: 404
    });
    routeMocks.assertAdminCollectionOwnership.mockRejectedValueOnce(ownershipError);
    routeMocks.isAdminCollectionOwnershipError.mockReturnValueOnce(true);

    const response = await GET(createRequest(), createContext("missing-entry"));
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("COLLECTION_NOT_FOUND");
    expect(routeMocks.getAdminCollectionContentByEntryId).not.toHaveBeenCalled();
  });
});
