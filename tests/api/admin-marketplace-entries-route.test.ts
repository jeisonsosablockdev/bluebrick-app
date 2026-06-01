import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  createMarketplacePropertyEntryPersistent: vi.fn(),
  listUploadedFileRefsByDraftId: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/property-marketplace-server", () => ({
  createMarketplacePropertyEntryPersistent: routeMocks.createMarketplacePropertyEntryPersistent
}));

vi.mock("@/lib/asset-uploads/repository", () => ({
  listUploadedFileRefsByDraftId: routeMocks.listUploadedFileRefsByDraftId
}));

import { POST } from "@/app/api/admin/marketplace/entries/route";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/admin/marketplace/entries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/admin/marketplace/entries", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "AdminPubkey111111111111111111111111111111111111"
    });
    routeMocks.createMarketplacePropertyEntryPersistent.mockReturnValue({
      id: "asset-001",
      title: "Asset 001",
      listingStatus: "funding"
    });
    routeMocks.listUploadedFileRefsByDraftId.mockResolvedValue([]);
  });

  it("returns 403 when caller is not admin", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "user",
      pubkey: "UserPubkey111111111111111111111111111111111111"
    });

    const response = await POST(createRequest({}));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(routeMocks.createMarketplacePropertyEntryPersistent).not.toHaveBeenCalled();
  });

  it("returns 400 when payload is invalid", async () => {
    const response = await POST(
      createRequest({
        entryId: "asset-001"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_MARKETPLACE_ENTRY");
  });

  it("returns 400 when canonical location payload is not mappable", async () => {
    const response = await POST(
      createRequest({
        entryId: "asset-001",
        title: "Central Tower",
        city: "Bogota",
        country: "Latam",
        address: "Calle 10 #12-34",
        imageUrl: "https://cdn.example.com/cover.jpg",
        shortDescription: "Tokenized building",
        supplyTotal: 1200,
        nftPriceUsd: 150,
        annualRoiPct: 12.5,
        collectionAddress: "CoLLeCt1on111111111111111111111111111111111",
        candyMachineAddress: "CanDyMach1ne1111111111111111111111111111111"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_MARKETPLACE_ENTRY");
    expect(routeMocks.createMarketplacePropertyEntryPersistent).not.toHaveBeenCalled();
  });

  it("returns 200 when marketplace entry is created", async () => {
    routeMocks.createMarketplacePropertyEntryPersistent.mockReturnValueOnce({
      id: "asset-001",
      title: "Central Tower",
      listingStatus: "funding"
    });

    const response = await POST(
      createRequest({
        entryId: "asset-001",
        title: "Central Tower",
        city: "Bogota",
        country: "Colombia",
        stateProvince: "DC",
        postalCode: "110221",
        address: "Calle 10 #12-34",
        geoLat: "4.711",
        geoLng: "-74.072",
        googleMapsPlace: {
          placeLabel: "Central Tower",
          formattedAddress: "Calle 10 #12-34, Bogota, Colombia",
          lat: 4.711,
          lng: -74.072,
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Central%20Tower",
          placeId: "place-central-tower",
          city: "Bogota",
          stateProvince: "Bogotá D.C.",
          country: "CO",
          postalCode: "110221"
        },
        imageUrl: "https://cdn.example.com/cover.jpg",
        shortDescription: "Tokenized building",
        highlights: ["Project stage: construction"],
        investmentNotes: "Ready for marketplace listing",
        supplyTotal: 1200,
        nftPriceUsd: 150,
        annualRoiPct: 12.5,
        project: {
          stage: "rehab",
          developerName: "Blue Brick Capital LLC",
          exitStrategy: "sale",
          durationMonths: 10
        },
        economics: {
          purchasePriceUsd: 120000,
          afterRepairValueUsd: 210000,
          rehabBudgetUsd: 45000,
          closingCostsUsd: 5000,
          holdingCostsUsd: 3500,
          sellingCostsUsd: 8000,
          totalProjectCostUsd: 181500,
          minimumCapitalRequiredUsd: 90000,
          structuringFeeUsd: 3500,
          grossProfitProjectedUsd: 28500,
          managementFeeUsd: 2500,
          brokerFeeUsd: 4000,
          netInvestorProfitUsd: 22000,
          projectedNetRoiPct: 12.5
        },
        governance: {
          riskNotes: "Escrow account with milestone-based draws."
        },
        documents: [{ label: "Brochure", url: "https://cdn.example.com/brochure.pdf" }],
        draftId: "90f27f80-b86d-4156-b556-ab55f17c0575",
        uploadRefs: {
          galleryImages: ["file-gallery-1"],
          propertyImages: ["file-property-1"]
        },
        collectionAddress: "CoLLeCt1on111111111111111111111111111111111",
        candyMachineAddress: "CanDyMach1ne1111111111111111111111111111111",
        snapshotId: "snapshot-001"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.id).toBe("asset-001");
    expect(routeMocks.createMarketplacePropertyEntryPersistent).toHaveBeenCalledTimes(1);
    expect(routeMocks.createMarketplacePropertyEntryPersistent).toHaveBeenCalledWith(
      expect.objectContaining({
        city: "Bogota",
        country: "CO",
        stateProvince: "Bogotá D.C.",
        postalCode: "110221",
        detailedLocation: "Calle 10 #12-34",
        geoLat: 4.711,
        geoLng: -74.072,
        googleMapsPlace: expect.objectContaining({
          placeId: "place-central-tower",
          formattedAddress: "Calle 10 #12-34, Bogota, Colombia"
        }),
        project: expect.objectContaining({
          stage: "rehab",
          developerName: "Blue Brick Capital LLC",
          exitStrategy: "sale",
          durationMonths: 10
        }),
        economics: expect.objectContaining({
          minimumCapitalRequiredUsd: 90000,
          projectedNetRoiPct: 12.5,
          afterRepairValueUsd: 210000
        }),
        governance: {
          riskNotes: "Escrow account with milestone-based draws."
        }
      })
    );
  });

  it("resolves uploaded gallery and property images into marketplace media payload", async () => {
    routeMocks.listUploadedFileRefsByDraftId.mockResolvedValueOnce([
      {
        fileRefId: "file-gallery-1",
        uploadId: "upload-gallery-1",
        actorPubkey: "AdminPubkey111111111111111111111111111111111111",
        draftId: "90f27f80-b86d-4156-b556-ab55f17c0575",
        bucket: "vercel-blob",
        objectKey: "admin-assets/galleryImage/draft/gallery.jpg",
        cdnUrl: "https://cdn.example.com/gallery.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
        contentMd5Base64: "AAAAAAAAAAAAAAAAAAAAAA==",
        etag: "\"etag\"",
        uploadedAt: "2026-06-01T10:00:00.000Z",
        createdAt: "2026-06-01T10:00:00.000Z",
        category: "galleryImage"
      },
      {
        fileRefId: "file-property-1",
        uploadId: "upload-property-1",
        actorPubkey: "AdminPubkey111111111111111111111111111111111111",
        draftId: "90f27f80-b86d-4156-b556-ab55f17c0575",
        bucket: "vercel-blob",
        objectKey: "admin-assets/propertyImage/draft/property.jpg",
        cdnUrl: "https://cdn.example.com/property.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 2048,
        contentMd5Base64: "AAAAAAAAAAAAAAAAAAAAAA==",
        etag: "\"etag\"",
        uploadedAt: "2026-06-01T10:01:00.000Z",
        createdAt: "2026-06-01T10:01:00.000Z",
        category: "propertyImage"
      }
    ]);

    const response = await POST(
      createRequest({
        entryId: "asset-001",
        title: "Central Tower",
        city: "Bogota",
        country: "CO",
        address: "Calle 10 #12-34",
        imageUrl: "https://cdn.example.com/cover.jpg",
        shortDescription: "Tokenized building",
        supplyTotal: 1200,
        nftPriceUsd: 150,
        annualRoiPct: 12.5,
        documents: [],
        draftId: "90f27f80-b86d-4156-b556-ab55f17c0575",
        uploadRefs: {
          galleryImages: ["file-gallery-1"],
          propertyImages: ["file-property-1"]
        },
        collectionAddress: "CoLLeCt1on111111111111111111111111111111111",
        candyMachineAddress: "CanDyMach1ne1111111111111111111111111111111"
      })
    );

    expect(response.status).toBe(200);
    expect(routeMocks.listUploadedFileRefsByDraftId).toHaveBeenCalledWith("90f27f80-b86d-4156-b556-ab55f17c0575");
    expect(routeMocks.createMarketplacePropertyEntryPersistent).toHaveBeenCalledWith(
      expect.objectContaining({
        galleryImages: [
          expect.objectContaining({
            url: "https://cdn.example.com/gallery.jpg",
            fileRefId: "file-gallery-1",
            source: "upload"
          })
        ],
        propertyImages: [
          expect.objectContaining({
            url: "https://cdn.example.com/property.jpg",
            fileRefId: "file-property-1",
            source: "upload"
          })
        ]
      })
    );
  });

  it("returns 409 when entry already exists", async () => {
    routeMocks.createMarketplacePropertyEntryPersistent.mockImplementationOnce(() => {
      throw new Error("A marketplace entry with this id already exists.");
    });

    const response = await POST(
      createRequest({
        entryId: "asset-001",
        title: "Central Tower",
        city: "Bogota",
        country: "CO",
        address: "Calle 10 #12-34",
        imageUrl: "https://cdn.example.com/cover.jpg",
        shortDescription: "Tokenized building",
        supplyTotal: 1200,
        nftPriceUsd: 150,
        annualRoiPct: 12.5,
        collectionAddress: "CoLLeCt1on111111111111111111111111111111111",
        candyMachineAddress: "CanDyMach1ne1111111111111111111111111111111"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("MARKETPLACE_ENTRY_CONFLICT");
  });

  it("does not expose internal create errors in 500 responses", async () => {
    routeMocks.createMarketplacePropertyEntryPersistent.mockImplementationOnce(() => {
      throw new Error("database password leaked in stack trace");
    });

    const response = await POST(
      createRequest({
        entryId: "asset-001",
        title: "Central Tower",
        city: "Bogota",
        country: "CO",
        address: "Calle 10 #12-34",
        imageUrl: "https://cdn.example.com/cover.jpg",
        shortDescription: "Tokenized building",
        supplyTotal: 1200,
        nftPriceUsd: 150,
        annualRoiPct: 12.5,
        collectionAddress: "CoLLeCt1on111111111111111111111111111111111",
        candyMachineAddress: "CanDyMach1ne1111111111111111111111111111111"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error.code).toBe("MARKETPLACE_ENTRY_CREATE_FAILED");
    expect(payload.error.message).toBe("Could not create marketplace entry.");
    expect(JSON.stringify(payload)).not.toContain("database password");
  });
});
