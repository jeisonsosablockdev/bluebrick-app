import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pageMocks = vi.hoisted(() => ({
  getServerLocale: vi.fn(),
  loadAdminCollectionsPageState: vi.fn()
}));

vi.mock("@/lib/i18n-server", () => ({
  getServerLocale: pageMocks.getServerLocale
}));

vi.mock("@/lib/admin/collections-page-state", () => ({
  loadAdminCollectionsPageState: pageMocks.loadAdminCollectionsPageState
}));

import LoadingAdminCollectionsPage from "@/app/admin/collections/loading";
import AdminCollectionsPage from "@/app/admin/collections/page";

describe("app/admin/collections/page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pageMocks.getServerLocale.mockResolvedValue("en");
  });

  it("renders the loading handoff", () => {
    const html = renderToStaticMarkup(createElement(LoadingAdminCollectionsPage));

    expect(html).toContain("Loading collections workspace");
    expect(html).toContain("Checking ownership, snapshots, and editable sections.");
    expect(html).toContain("aria-live=\"polite\"");
  });

  it("renders the empty state when no collections are returned", async () => {
    pageMocks.loadAdminCollectionsPageState.mockResolvedValueOnce({ kind: "empty" });

    const html = renderToStaticMarkup(await AdminCollectionsPage());

    expect(html).toContain("No owned collections found");
    expect(html).toContain("Deploy or link a collection before this workspace can expose editable content.");
    expect(html).toContain("Start a collection");
  });

  it("renders the error state when the list contract fails", async () => {
    pageMocks.loadAdminCollectionsPageState.mockResolvedValueOnce({
      kind: "error",
      message: "Admin role is required."
    });

    const html = renderToStaticMarkup(await AdminCollectionsPage());

    expect(html).toContain("Collections workspace unavailable");
    expect(html).toContain("Admin role is required.");
    expect(html).toContain("Retry loading");
  });

  it("renders the success state with summary and rows", async () => {
    pageMocks.loadAdminCollectionsPageState.mockResolvedValueOnce({
      kind: "success",
      summary: {
        total: 2,
        linked: 1,
        reviewRequired: 1
      },
      collections: [
        {
          entryId: "entry-1",
          title: "Ocean View Residences",
          coverImageUrl: "https://cdn.example.com/ocean.jpg",
          collectionAddress: "Collection111",
          candyMachineAddress: "Candy111",
          updatedAt: "2026-04-23T07:00:00.000Z",
          validationState: "linked",
          editableSections: ["summary", "gallery"]
        },
        {
          entryId: "entry-2",
          title: "Harbor Point",
          coverImageUrl: "https://cdn.example.com/harbor.jpg",
          collectionAddress: "Collection222",
          candyMachineAddress: "Candy222",
          updatedAt: "2026-04-23T06:00:00.000Z",
          validationState: "inconsistent",
          editableSections: []
        }
      ]
    });

    const html = renderToStaticMarkup(await AdminCollectionsPage());

    expect(html).toContain("Contract handoff");
    expect(html).toContain("Ocean View Residences");
    expect(html).toContain("Harbor Point");
    expect(html).toContain("Editable sections: summary, gallery");
    expect(html).toContain("Not editable in this validation state.");
  });
});
