import { describe, expect, it } from "vitest";

import {
  buildCanonicalUrl,
  createPageMetadata,
  getSiteOrigin,
  isIndexablePage,
  normalizeRoutePath,
  resolveSeoSectionFromPath
} from "@/lib/seo";

describe("lib/seo metadata infrastructure", () => {
  it("normalizes route paths and builds canonical URLs", () => {
    expect(normalizeRoutePath("knowledge/articles/test/")).toBe("/knowledge/articles/test");
    expect(normalizeRoutePath("/knowledge/articles/test?x=1")).toBe("/knowledge/articles/test");
    expect(buildCanonicalUrl("/knowledge/articles/test")).toBe(`${getSiteOrigin()}/knowledge/articles/test`);
  });

  it("resolves seo section by route prefix", () => {
    expect(resolveSeoSectionFromPath("/")).toBe("home");
    expect(resolveSeoSectionFromPath("/knowledge/articles/a")).toBe("knowledge");
    expect(resolveSeoSectionFromPath("/admin/settings")).toBe("admin");
    expect(resolveSeoSectionFromPath("/checkout/success")).toBe("checkout");
  });

  it("enforces index/noindex policy by status and restricted routes", () => {
    expect(isIndexablePage({ path: "/knowledge/articles/a", status: "published" })).toBe(true);
    expect(isIndexablePage({ path: "/knowledge/articles/a", status: "draft" })).toBe(false);
    expect(isIndexablePage({ path: "/knowledge/articles/a", status: "superseded" })).toBe(false);
    expect(isIndexablePage({ path: "/admin" })).toBe(false);
    expect(isIndexablePage({ path: "/checkout" })).toBe(false);
  });

  it("generates metadata with canonical URL and robots directives", () => {
    const metadata = createPageMetadata({
      title: "Tokenization Fundamentals",
      description: "Long-form knowledge article.",
      path: "/knowledge/articles/tokenization-fundamentals",
      section: "knowledge",
      status: "published"
    });

    expect(metadata.alternates?.canonical).toBe(`${getSiteOrigin()}/knowledge/articles/tokenization-fundamentals`);
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true
    });
    expect(metadata.openGraph?.url).toBe(`${getSiteOrigin()}/knowledge/articles/tokenization-fundamentals`);
  });

  it("forces noindex metadata when route is restricted", () => {
    const metadata = createPageMetadata({
      title: "Admin",
      description: "Restricted admin route.",
      path: "/admin",
      section: "admin"
    });

    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false
    });
  });
});
