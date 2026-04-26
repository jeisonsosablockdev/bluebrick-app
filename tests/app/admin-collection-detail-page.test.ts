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
      content: {
        entryId: "entry-1",
        title: "Ocean View Residences",
        createdBy: "Admin111",
        coverImageUrl: "https://cdn.example.com/ocean.jpg",
        collectionAddress: "Collection111",
        candyMachineAddress: "Candy111",
        galleryImages: [],
        propertyImages: [],
        documents: [],
        fractionalInvestmentSummary: "Stable income.",
        propertyInformation: "Prime oceanfront location.",
        googleMapsPlace: null,
        updatedBy: "Admin111",
        updatedAt: "2026-04-26T02:00:00.000Z"
      }
    });

    const html = renderToStaticMarkup(await AdminCollectionDetailPage({
      params: Promise.resolve({ id: "entry-1" })
    }));

    expect(html).toContain("Ocean View Residences");
    expect(html).toContain("Detail route active");
    expect(html).toContain("Editor pending");
    expect(html).toContain("Collection111");
    expect(html).toContain("Candy111");
    expect(html).toContain("verified / completed");
    expect(html).toContain("Back to collections");
  });
});
