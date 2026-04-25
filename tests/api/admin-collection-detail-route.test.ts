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

import { GET } from "@/app/api/admin/collections/[id]/route";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function createRequest(url = "https://example.com/api/admin/collections/entry-1"): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

function createContext(id = "entry-1"): RouteContext {
  return {
    params: Promise.resolve({ id })
  };
}

describe("GET /api/admin/collections/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin111"
    });
    routeMocks.isAdminCollectionOwnershipError.mockReturnValue(false);
    routeMocks.assertAdminCollectionOwnership.mockResolvedValue({
      entryId: "entry-1",
      adminId: "Admin111",
      title: "Central Tower",
      coverImageUrl: "https://cdn.example.com/cover.jpg",
      collectionAddress: "Collection111",
      candyMachineAddress: "Candy111",
      snapshotId: "snapshot-1",
      snapshotDraftId: "draft-1",
      snapshotVerificationStatus: "verified",
      snapshotMarketplaceHandoffStatus: "completed",
      updatedAt: "2026-04-25T04:00:00.000Z"
    });
    routeMocks.getAdminCollectionContentByEntryId.mockResolvedValue({
      entryId: "entry-1",
      title: "Central Tower",
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
      updatedAt: "2026-04-25T04:00:00.000Z"
    });
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
    expect(routeMocks.assertAdminCollectionOwnership).not.toHaveBeenCalled();
    expect(routeMocks.getAdminCollectionContentByEntryId).not.toHaveBeenCalled();
  });

  it("returns detail payload after centralized ownership enforcement", async () => {
    const response = await GET(createRequest(), createContext(" entry-1 "));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.ownership.snapshotId).toBe("snapshot-1");
    expect(payload.data.content.fractionalInvestmentSummary).toBe("Stable yield.");
    expect(routeMocks.assertAdminCollectionOwnership).toHaveBeenCalledWith("Admin111", "entry-1");
    expect(routeMocks.getAdminCollectionContentByEntryId).toHaveBeenCalledWith("entry-1");
  });

  it("returns ownership helper errors without querying editable content", async () => {
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

  it("returns 404 if content disappears after ownership is proven", async () => {
    routeMocks.getAdminCollectionContentByEntryId.mockResolvedValueOnce(null);

    const response = await GET(createRequest(), createContext());
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("COLLECTION_CONTENT_NOT_FOUND");
  });

  it("returns 500 when editable content lookup fails unexpectedly", async () => {
    routeMocks.getAdminCollectionContentByEntryId.mockRejectedValueOnce(new Error("boom"));

    const response = await GET(createRequest(), createContext());
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error.code).toBe("ADMIN_COLLECTION_DETAIL_FAILED");
  });
});
