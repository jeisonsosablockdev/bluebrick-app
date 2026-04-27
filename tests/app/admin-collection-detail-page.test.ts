import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pageMocks = vi.hoisted(() => ({
  getServerLocale: vi.fn(),
  loadAdminCollectionDetailPageState: vi.fn()
}));

vi.mock("@/lib/i18n-server", () => ({
  getServerLocale: pageMocks.getServerLocale
}));

vi.mock("@/lib/admin/collection-detail-page-state", () => ({
  loadAdminCollectionDetailPageState: pageMocks.loadAdminCollectionDetailPageState
}));

import LoadingAdminCollectionDetailPage from "@/app/admin/collections/[id]/loading";
import AdminCollectionDetailPage from "@/app/admin/collections/[id]/page";

describe("app/admin/collections/[id]/page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pageMocks.getServerLocale.mockResolvedValue("en");
  });

  it("renders the loading handoff", () => {
    const html = renderToStaticMarkup(createElement(LoadingAdminCollectionDetailPage));

    expect(html).toContain("Loading collection detail");
    expect(html).toContain("Resolving ownership evidence and detail payload.");
    expect(html).toContain("aria-live=\"polite\"");
  });

  it("renders the error handoff when detail payload fails", async () => {
    pageMocks.loadAdminCollectionDetailPageState.mockResolvedValueOnce({
      kind: "error",
      message: "Collection was not found."
    });

    const html = renderToStaticMarkup(await AdminCollectionDetailPage({
      params: Promise.resolve({ id: "missing-entry" })
    }));

    expect(html).toContain("Collection detail");
    expect(html).toContain("Collection was not found.");
    expect(html).toContain("Back to collections");
  });

  it("renders the success handoff for a ready entry", async () => {
    pageMocks.loadAdminCollectionDetailPageState.mockResolvedValueOnce({
      kind: "success",
      ownership: {
        entryId: "entry-1",
        adminId: "Admin111",
        title: "Ocean View Residences",
        coverImageUrl: "https://cdn.example.com/ocean.jpg",
        collectionAddress: "Collection111",
        candyMachineAddress: "Candy111",
        snapshotId: "snapshot-1",
        snapshotDraftId: "draft-1",
        snapshotVerificationStatus: "verified",
        snapshotMarketplaceHandoffStatus: "completed",
        updatedAt: "2026-04-26T02:00:00.000Z"
      },
      blockchain: {
        baseAddresses: {
          collectionAddress: "Collection111",
          candyMachineAddress: "Candy111",
          assetMintAddress: "AssetMint111"
        },
        authorities: {
          thirdPartySigner: "ThirdParty111",
          freezeDelegate: "FreezeDelegate111",
          transferDelegate: "TransferDelegate111",
          appdataAuthority: "AppdataAuthority111"
        },
        guards: {
          startDateIso: "2026-04-27T00:00:00.000Z",
          tokenPaymentMint: "UsdcMint111",
          tokenPaymentDestination: "UsdcDestination111"
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
          updatedBy: "story-006-03-admin-update"
        }
      },
      content: {
        entryId: "entry-1",
        title: "Ocean View Residences",
        city: "Cartagena",
        country: "CO",
        locationLabel: "Bocagrande Waterfront",
        detailedLocation: "Avenida San Martin 7-14, Bocagrande",
        createdBy: "Admin111",
        coverImageUrl: "https://cdn.example.com/ocean.jpg",
        collectionAddress: "Collection111",
        candyMachineAddress: "Candy111",
        galleryImages: [
          {
            id: "gallery-1",
            url: "https://cdn.example.com/gallery-1.jpg",
            title: "Ocean lounge",
            alt: "Ocean lounge",
            displayOrder: 1,
            mimeType: "image/jpeg",
            fileName: "gallery-1.jpg",
            fileRefId: "file-gallery-1",
            source: "marketplace"
          }
        ],
        propertyImages: [
          {
            id: "property-1",
            url: "https://cdn.example.com/property-1.jpg",
            title: "Facade",
            alt: "Facade",
            displayOrder: 1,
            mimeType: "image/jpeg",
            fileName: "property-1.jpg",
            fileRefId: "file-property-1",
            source: "snapshot"
          }
        ],
        documents: [
          {
            id: "document-1",
            tag: "brochure",
            title: "Ocean brochure",
            label: "Investor brochure",
            description: "Commercial brochure",
            url: "https://cdn.example.com/brochure.pdf",
            displayOrder: 1,
            mimeType: "application/pdf",
            fileName: "brochure.pdf",
            fileRefId: "file-brochure-1",
            source: "upload"
          }
        ],
        fractionalInvestmentSummary: "Stable income.",
        propertyInformation: "Prime oceanfront location.",
        googleMapsPlace: {
          placeLabel: "Ocean View Residences",
          formattedAddress: "Avenida San Martin 7-14, Bocagrande, Cartagena, CO",
          lat: 10.3997,
          lng: -75.5553,
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Ocean%20View%20Residences",
          placeId: "place-ocean-view"
        },
        updatedBy: "Admin111",
        updatedAt: "2026-04-26T02:00:00.000Z"
      }
    });

    const html = renderToStaticMarkup(await AdminCollectionDetailPage({
      params: Promise.resolve({ id: "entry-1" })
    }));

    expect(html).toContain("Ocean View Residences");
    expect(html).toContain("Managed from Candy Machine");
    expect(html).toContain("Read-only cover");
    expect(html).toContain("Fractional investment summary");
    expect(html).toContain("Summary narrative");
    expect(html).toContain("Save summary");
    expect(html).toContain("Cancel");
    expect(html).toContain("Property information");
    expect(html).toContain("Property description");
    expect(html).toContain("Save property information");
    expect(html).toContain("Google Maps location");
    expect(html).toContain("Bocagrande Waterfront");
    expect(html).toContain("Avenida San Martin 7-14, Bocagrande, Cartagena, CO");
    expect(html).toContain("Open in Google Maps");
    expect(html).toContain("Project gallery");
    expect(html).toContain("Marketplace gallery");
    expect(html).toContain("Property imagery");
    expect(html).toContain("Add gallery image");
    expect(html).toContain("Replace gallery image");
    expect(html).toContain("Delete gallery image");
    expect(html).toContain("Documents");
    expect(html).toContain("Document list");
    expect(html).toContain("Save documents");
    expect(html).toContain("Add document");
    expect(html).toContain("Investor brochure");
    expect(html).toContain("Blockchain panel");
    expect(html).toContain("Read-only blockchain state");
    expect(html).toContain("On-chain evidence handoff");
    expect(html).toContain("AssetMint111");
    expect(html).toContain("Copy address");
    expect(html).toContain("View on Solscan");
    expect(html).toContain("Visible authorities");
    expect(html).toContain("ThirdParty111");
    expect(html).toContain("TransferDelegate111");
    expect(html).toContain("Guard fields");
    expect(html).toContain("UsdcMint111");
    expect(html).toContain("UsdcDestination111");
    expect(html).toContain("AppData economic fields");
    expect(html).toContain("2500 bps");
    expect(html).toContain("1300 bps");
    expect(html).toContain("linear");
    expect(html).toContain("story-006-03-admin-update");
    expect(html).toContain("Collection111");
    expect(html).toContain("Candy111");
    expect(html).toContain("verified / completed");
    expect(html).toContain("Summary editor mounted");
    expect(html).toContain("Property information editor mounted");
    expect(html).toContain("Gallery tabs shell mounted");
    expect(html).toContain("Documents editor mounted");
    expect(html).toContain("Blockchain addresses panel mounted");
    expect(html).toContain("Back to collections");
  });
});
