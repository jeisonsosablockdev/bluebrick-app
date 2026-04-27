import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  assertAdminCollectionOwnership: vi.fn(),
  getAdminCollectionBlockchainPanel: vi.fn(),
  getAdminCollectionContentByEntryId: vi.fn(),
  getRequestRole: vi.fn(),
  isAdminCollectionOwnershipError: vi.fn(),
  updateAdminCollectionContent: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/admin/collection-ownership", () => ({
  assertAdminCollectionOwnership: routeMocks.assertAdminCollectionOwnership,
  isAdminCollectionOwnershipError: routeMocks.isAdminCollectionOwnershipError
}));

vi.mock("@/lib/admin/collection-blockchain-panel", () => ({
  getAdminCollectionBlockchainPanel: routeMocks.getAdminCollectionBlockchainPanel
}));

vi.mock("@/lib/admin/collection-content-repository", () => ({
  getAdminCollectionContentByEntryId: routeMocks.getAdminCollectionContentByEntryId,
  updateAdminCollectionContent: routeMocks.updateAdminCollectionContent
}));

import { GET, PATCH } from "@/app/api/admin/collections/[id]/route";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function createRequest(
  url = "https://example.com/api/admin/collections/entry-1",
  headers?: Record<string, string>
): NextRequest {
  return new NextRequest(url, { method: "GET", headers });
}

function createPatchRequest(body: unknown, url = "https://example.com/api/admin/collections/entry-1"): NextRequest {
  return new NextRequest(url, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json"
    }
  });
}

function createMalformedPatchRequest(rawBody = "{", url = "https://example.com/api/admin/collections/entry-1"): NextRequest {
  return new NextRequest(url, {
    method: "PATCH",
    body: rawBody,
    headers: {
      "content-type": "application/json"
    }
  });
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

function buildOwnershipRecord(input: Record<string, unknown> = {}) {
  return {
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
    updatedAt: "2026-04-25T04:00:00.000Z",
    ...input
  };
}

function buildBlockchainPanelRecord(input: Record<string, unknown> = {}) {
  return {
    baseAddresses: {
      collectionAddress: "Collection111",
      candyMachineAddress: "Candy111",
      assetMintAddress: "AssetMint111",
      ...((input.baseAddresses as Record<string, unknown> | undefined) ?? {})
    },
    authorities: {
      thirdPartySigner: "ThirdParty111",
      freezeDelegate: "FreezeDelegate111",
      transferDelegate: "TransferDelegate111",
      appdataAuthority: "AppdataAuthority111",
      ...((input.authorities as Record<string, unknown> | undefined) ?? {})
    },
    guards: {
      startDateIso: "2026-04-27T00:00:00.000Z",
      tokenPaymentMint: "UsdcMint111",
      tokenPaymentDestination: "UsdcDestination111",
      ...((input.guards as Record<string, unknown> | undefined) ?? {})
    },
    appdata: {
      revenueShareBps: 2500,
      yieldBps: 1300,
      yieldMode: "linear",
      lockedAt: 1775031177,
      eligibleFrom: 1775031177,
      earningStartTs: 1775031177,
      distributionEnabled: false,
      economicVersion: "v1",
      lastUpdatedAt: 1775031297,
      updatedBy: "story-006-03-admin-update",
      ...((input.appdata as Record<string, unknown> | undefined) ?? {})
    },
    ...input
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
    routeMocks.assertAdminCollectionOwnership.mockResolvedValue(buildOwnershipRecord());
    routeMocks.getAdminCollectionBlockchainPanel.mockResolvedValue(buildBlockchainPanelRecord());
    routeMocks.getAdminCollectionContentByEntryId.mockResolvedValue(buildContentRecord());
    routeMocks.updateAdminCollectionContent.mockResolvedValue(buildContentRecord({
      fractionalInvestmentSummary: "Updated yield."
    }));
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
    expect(payload.data.blockchain.baseAddresses.assetMintAddress).toBe("AssetMint111");
    expect(payload.data.blockchain.appdata.economicVersion).toBe("v1");
    expect(payload.data.blockchain.appdata.updatedBy).toBe("story-006-03-admin-update");
    expect(routeMocks.assertAdminCollectionOwnership).toHaveBeenCalledWith("Admin111", "entry-1");
    expect(routeMocks.getAdminCollectionBlockchainPanel).toHaveBeenCalledWith(buildOwnershipRecord());
    expect(routeMocks.getAdminCollectionContentByEntryId).toHaveBeenCalledWith("entry-1");
  });

  it("returns the E2E fixture detail payload when the fixture cookie is present", async () => {
    const response = await GET(
      createRequest("https://example.com/api/admin/collections/entry-bri-101-primary", {
        cookie: "brids_admin_collections_fixture=bri-101"
      }),
      createContext("entry-bri-101-primary")
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.ownership.entryId).toBe("entry-bri-101-primary");
    expect(payload.data.content.documents).toHaveLength(1);
    expect(payload.data.blockchain.baseAddresses.assetMintAddress).toBe("AssetMintOceanview111111111111111111111111");
    expect(payload.data.blockchain.authorities.transferDelegate).toBe("TransferDelegateOceanview1111111111111111111");
    expect(payload.data.blockchain.guards.tokenPaymentMint).toBe("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
    expect(payload.data.blockchain.appdata.yieldMode).toBe("linear");
    expect(payload.data.blockchain.appdata.updatedBy).toBe("story-006-03-admin-update");
    expect(routeMocks.assertAdminCollectionOwnership).not.toHaveBeenCalled();
    expect(routeMocks.getAdminCollectionContentByEntryId).not.toHaveBeenCalled();
    expect(routeMocks.getAdminCollectionBlockchainPanel).not.toHaveBeenCalled();
  });

  it("loads editable content by the canonical entry id returned from ownership", async () => {
    routeMocks.assertAdminCollectionOwnership.mockResolvedValueOnce(
      buildOwnershipRecord({
        entryId: "entry-canonical-7"
      })
    );

    const response = await GET(createRequest(), createContext("entry-alias"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(routeMocks.assertAdminCollectionOwnership).toHaveBeenCalledWith("Admin111", "entry-alias");
    expect(routeMocks.getAdminCollectionBlockchainPanel).toHaveBeenCalledWith(
      buildOwnershipRecord({
        entryId: "entry-canonical-7"
      })
    );
    expect(routeMocks.getAdminCollectionContentByEntryId).toHaveBeenCalledWith("entry-canonical-7");
  });

  it("returns helper validation errors for blank collection ids", async () => {
    const ownershipError = Object.assign(new Error("Collection id is required."), {
      code: "INVALID_COLLECTION_OWNERSHIP_INPUT",
      status: 400
    });
    routeMocks.assertAdminCollectionOwnership.mockRejectedValueOnce(ownershipError);
    routeMocks.isAdminCollectionOwnershipError.mockReturnValueOnce(true);

    const response = await GET(createRequest(), createContext("   "));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_COLLECTION_OWNERSHIP_INPUT");
    expect(routeMocks.getAdminCollectionContentByEntryId).not.toHaveBeenCalled();
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
    expect(routeMocks.getAdminCollectionBlockchainPanel).not.toHaveBeenCalled();
  });

  it("returns 404 if content disappears after ownership is proven", async () => {
    routeMocks.getAdminCollectionContentByEntryId.mockResolvedValueOnce(null);

    const response = await GET(createRequest(), createContext());
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("COLLECTION_CONTENT_NOT_FOUND");
    expect(routeMocks.getAdminCollectionBlockchainPanel).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when editable content lookup fails unexpectedly", async () => {
    routeMocks.getAdminCollectionContentByEntryId.mockRejectedValueOnce(new Error("boom"));

    const response = await GET(createRequest(), createContext());
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error.code).toBe("ADMIN_COLLECTION_DETAIL_FAILED");
  });
});

describe("PATCH /api/admin/collections/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin111"
    });
    routeMocks.isAdminCollectionOwnershipError.mockReturnValue(false);
    routeMocks.assertAdminCollectionOwnership.mockResolvedValue(buildOwnershipRecord());
    routeMocks.updateAdminCollectionContent.mockResolvedValue(buildContentRecord({
      fractionalInvestmentSummary: "Updated yield."
    }));
  });

  it("returns 403 when caller is not an authenticated admin with a pubkey", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "admin"
    });

    const response = await PATCH(
      createPatchRequest({
        section: "summary",
        data: {
          fractionalInvestmentSummary: "Updated yield."
        }
      }),
      createContext()
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(routeMocks.assertAdminCollectionOwnership).not.toHaveBeenCalled();
    expect(routeMocks.updateAdminCollectionContent).not.toHaveBeenCalled();
  });

  it("updates a valid section after centralized ownership enforcement", async () => {
    const response = await PATCH(
      createPatchRequest({
        section: "summary",
        data: {
          fractionalInvestmentSummary: " Updated yield. "
        }
      }),
      createContext(" entry-1 ")
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.section).toBe("summary");
    expect(payload.data.content.fractionalInvestmentSummary).toBe("Updated yield.");
    expect(routeMocks.assertAdminCollectionOwnership).toHaveBeenCalledWith("Admin111", "entry-1");
    expect(routeMocks.updateAdminCollectionContent).toHaveBeenCalledWith({
      entryId: "entry-1",
      updatedBy: "Admin111",
      fractionalInvestmentSummary: "Updated yield."
    });
  });

  it("updates editable content by the canonical entry id returned from ownership", async () => {
    routeMocks.assertAdminCollectionOwnership.mockResolvedValueOnce(
      buildOwnershipRecord({
        entryId: "entry-canonical-7"
      })
    );

    const response = await PATCH(
      createPatchRequest({
        section: "propertyInformation",
        data: {
          propertyInformation: "Updated property."
        }
      }),
      createContext("entry-alias")
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(routeMocks.assertAdminCollectionOwnership).toHaveBeenCalledWith("Admin111", "entry-alias");
    expect(routeMocks.updateAdminCollectionContent).toHaveBeenCalledWith({
      entryId: "entry-canonical-7",
      updatedBy: "Admin111",
      fractionalInvestmentSummary: undefined,
      propertyInformation: "Updated property.",
      galleryImages: undefined,
      propertyImages: undefined,
      documents: undefined,
      googleMapsPlace: undefined
    });
  });

  it("rejects immutable cover mutations before ownership lookup", async () => {
    const response = await PATCH(
      createPatchRequest({
        section: "summary",
        data: {
          fractionalInvestmentSummary: "Updated yield.",
          image_url: "https://cdn.example.com/new-cover.jpg"
        }
      }),
      createContext()
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("IMMUTABLE_COVER_FIELD");
    expect(routeMocks.assertAdminCollectionOwnership).not.toHaveBeenCalled();
    expect(routeMocks.updateAdminCollectionContent).not.toHaveBeenCalled();
  });

  it("rejects immutable cover mutations nested inside gallery payloads before ownership lookup", async () => {
    const response = await PATCH(
      createPatchRequest({
        section: "gallery",
        data: {
          galleryImages: [
            {
              id: "gallery-1",
              url: "https://cdn.example.com/gallery-1.jpg",
              title: "Gallery image",
              alt: "Gallery image",
              displayOrder: 1,
              mimeType: "image/jpeg",
              fileName: "gallery-1.jpg",
              fileRefId: "file-gallery-1",
              source: "upload",
              coverImageUrl: "https://cdn.example.com/new-cover.jpg"
            }
          ]
        }
      }),
      createContext()
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("IMMUTABLE_COVER_FIELD");
    expect(routeMocks.assertAdminCollectionOwnership).not.toHaveBeenCalled();
    expect(routeMocks.updateAdminCollectionContent).not.toHaveBeenCalled();
  });

  it("returns 400 when the PATCH body is not valid JSON", async () => {
    const response = await PATCH(createMalformedPatchRequest(), createContext());
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_COLLECTION_PAYLOAD");
    expect(routeMocks.assertAdminCollectionOwnership).not.toHaveBeenCalled();
    expect(routeMocks.updateAdminCollectionContent).not.toHaveBeenCalled();
  });

  it("returns ownership helper errors without updating content", async () => {
    const ownershipError = Object.assign(new Error("Collection does not belong to the authenticated admin."), {
      code: "COLLECTION_OWNERSHIP_MISMATCH",
      status: 403
    });
    routeMocks.assertAdminCollectionOwnership.mockRejectedValueOnce(ownershipError);
    routeMocks.isAdminCollectionOwnershipError.mockReturnValueOnce(true);

    const response = await PATCH(
      createPatchRequest({
        section: "propertyInformation",
        data: {
          propertyInformation: "Updated property."
        }
      }),
      createContext("entry-1")
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("COLLECTION_OWNERSHIP_MISMATCH");
    expect(routeMocks.updateAdminCollectionContent).not.toHaveBeenCalled();
  });

  it("returns helper validation errors for blank collection ids before any update", async () => {
    const ownershipError = Object.assign(new Error("Collection id is required."), {
      code: "INVALID_COLLECTION_OWNERSHIP_INPUT",
      status: 400
    });
    routeMocks.assertAdminCollectionOwnership.mockRejectedValueOnce(ownershipError);
    routeMocks.isAdminCollectionOwnershipError.mockReturnValueOnce(true);

    const response = await PATCH(
      createPatchRequest({
        section: "documents",
        data: {
          documents: []
        }
      }),
      createContext("   ")
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_COLLECTION_OWNERSHIP_INPUT");
    expect(routeMocks.updateAdminCollectionContent).not.toHaveBeenCalled();
  });

  it("returns 404 when the update returns no content after ownership succeeds", async () => {
    routeMocks.updateAdminCollectionContent.mockResolvedValueOnce(null);

    const response = await PATCH(
      createPatchRequest({
        section: "documents",
        data: {
          documents: []
        }
      }),
      createContext()
    );
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("COLLECTION_CONTENT_NOT_FOUND");
  });

  it("returns 500 when update fails unexpectedly", async () => {
    routeMocks.updateAdminCollectionContent.mockRejectedValueOnce(new Error("boom"));

    const response = await PATCH(
      createPatchRequest({
        section: "propertyInformation",
        data: {
          propertyInformation: "Updated property."
        }
      }),
      createContext()
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error.code).toBe("ADMIN_COLLECTION_PATCH_FAILED");
  });
});
