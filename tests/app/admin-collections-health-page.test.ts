import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pageMocks = vi.hoisted(() => ({
  getServerLocale: vi.fn(),
  loadAdminCollectionsHealthPageState: vi.fn()
}));

vi.mock("@/lib/i18n-server", () => ({
  getServerLocale: pageMocks.getServerLocale
}));

vi.mock("@/lib/admin/collections-health-page-state", () => ({
  loadAdminCollectionsHealthPageState: pageMocks.loadAdminCollectionsHealthPageState
}));

import LoadingAdminCollectionsHealthPage from "@/app/admin/health/collections/loading";
import AdminCollectionsHealthPage from "@/app/admin/health/collections/page";

describe("app/admin/health/collections/page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pageMocks.getServerLocale.mockResolvedValue("en");
  });

  it("renders the loading handoff", () => {
    const html = renderToStaticMarkup(createElement(LoadingAdminCollectionsHealthPage));

    expect(html).toContain("Loading health queue");
    expect(html).toContain("Checking degraded collection rows");
    expect(html).toContain("aria-live=\"polite\"");
  });

  it("renders the empty state when no degraded rows are returned", async () => {
    pageMocks.loadAdminCollectionsHealthPageState.mockResolvedValueOnce({ kind: "empty" });

    const html = renderToStaticMarkup(await AdminCollectionsHealthPage());

    expect(html).toContain("No degraded collection rows");
    expect(html).toContain("Back to collections");
  });

  it("renders the error state when the health contract fails", async () => {
    pageMocks.loadAdminCollectionsHealthPageState.mockResolvedValueOnce({
      kind: "error",
      message: "Admin role is required."
    });

    const html = renderToStaticMarkup(await AdminCollectionsHealthPage());

    expect(html).toContain("Collections health unavailable");
    expect(html).toContain("Admin role is required.");
  });

  it("renders the success state with read-only health rows", async () => {
    pageMocks.loadAdminCollectionsHealthPageState.mockResolvedValueOnce({
      kind: "success",
      rows: [
        {
          entryId: "entry-review",
          title: "Manual review entry",
          collectionAddress: "CollectionReview",
          candyMachineAddress: "CandyReview",
          healthState: "manual_review_required",
          source: "bootstrap",
          failureReason: "Bootstrap mapping requires manual review: google maps place invalid.",
          lastCheckedAt: "2026-04-28T13:00:00.000Z",
          cta: {
            href: "/admin/collections/entry-review",
            label: "View collection context"
          }
        },
        {
          entryId: "entry-missing",
          title: "Missing snapshot entry",
          collectionAddress: "CollectionMissing",
          candyMachineAddress: "CandyMissing",
          healthState: "missing_snapshot",
          source: "consistency",
          failureReason: "No linked asset mint snapshot was found for the marketplace entry.",
          lastCheckedAt: "2026-04-28T11:00:00.000Z",
          cta: {
            href: "/admin/collections/entry-missing",
            label: "View collection context"
          }
        }
      ]
    });

    const html = renderToStaticMarkup(await AdminCollectionsHealthPage());

    expect(html).toContain("Collections health");
    expect(html).toContain("Review queue");
    expect(html).toContain("Review items");
    expect(html).toContain("Manual review entry");
    expect(html).toContain("Missing snapshot entry");
    expect(html).toContain("View collection context");
    expect(html).toContain("Manual review");
    expect(html).toContain("Missing snapshot");
    expect(html).not.toContain("Health queue contract");
    expect(html).not.toContain("This queue stays read-only");
  });
});
