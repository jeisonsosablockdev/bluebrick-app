import { beforeEach, describe, expect, it, vi } from "vitest";

const searchMocks = vi.hoisted(() => ({
  buildRssFeed: vi.fn(),
  buildJsonFeed: vi.fn(),
  buildRecentFeed: vi.fn(),
  buildKnowledgeExport: vi.fn(),
  buildLocalSearchIndex: vi.fn()
}));

vi.mock("@/lib/search", () => ({
  buildRssFeed: searchMocks.buildRssFeed,
  buildJsonFeed: searchMocks.buildJsonFeed,
  buildRecentFeed: searchMocks.buildRecentFeed,
  buildKnowledgeExport: searchMocks.buildKnowledgeExport,
  buildLocalSearchIndex: searchMocks.buildLocalSearchIndex
}));

import { GET as getExportFeed } from "@/app/feeds/export/route";
import { GET as getJsonFeed } from "@/app/feeds/json/route";
import { GET as getRecentFeed } from "@/app/feeds/recent/route";
import { GET as getRssFeed } from "@/app/feeds/rss/route";
import { GET as getSearchIndex } from "@/app/feeds/search-index/route";

describe("feed endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    searchMocks.buildRssFeed.mockResolvedValue("<rss version=\"2.0\"></rss>");
    searchMocks.buildJsonFeed.mockResolvedValue({
      version: "https://jsonfeed.org/version/1.1",
      title: "BRIDS Knowledge Feed",
      home_page_url: "https://brids.com",
      feed_url: "https://brids.com/feeds/json",
      description: "Feed description",
      items: []
    });
    searchMocks.buildRecentFeed.mockResolvedValue({
      schemaVersion: "1.0.0",
      generatedAt: "2026-04-13T00:00:00.000Z",
      totalDocuments: 0,
      items: []
    });
    searchMocks.buildKnowledgeExport.mockResolvedValue({
      schemaVersion: "1.0.0",
      generatedAt: "2026-04-13T00:00:00.000Z",
      totalDocuments: 0,
      items: []
    });
    searchMocks.buildLocalSearchIndex.mockResolvedValue({
      schemaVersion: "1.0.0",
      generatedAt: "2026-04-13T00:00:00.000Z",
      totalDocuments: 0,
      entries: []
    });
  });

  it("returns RSS feed as XML", async () => {
    const response = await getRssFeed();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/rss+xml");
    expect(body).toContain("<rss");
  });

  it("returns JSON feed", async () => {
    const response = await getJsonFeed();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.version).toBe("https://jsonfeed.org/version/1.1");
  });

  it("returns recent documents feed", async () => {
    const response = await getRecentFeed();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.schemaVersion).toBe("1.0.0");
  });

  it("returns structured export payload", async () => {
    const response = await getExportFeed();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.schemaVersion).toBe("1.0.0");
  });

  it("returns local search index payload", async () => {
    const response = await getSearchIndex();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.totalDocuments).toBe(0);
  });
});
