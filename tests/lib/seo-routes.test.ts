import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { buildPublicSitemap, buildRobotsPolicy, getDefaultPublicSitemapEntries, getSiteOrigin } from "@/lib/seo";

describe("seo route outputs", () => {
  it("builds robots policy per environment", () => {
    const nonProduction = buildRobotsPolicy({ isProduction: false });
    const production = buildRobotsPolicy({ isProduction: true });

    expect(nonProduction.rules).toEqual({ userAgent: "*", disallow: "/" });
    expect(production.rules).toEqual([
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/protected", "/api", "/checkout"]
      }
    ]);
    expect(production.sitemap).toBe(`${getSiteOrigin()}/sitemap.xml`);
  });

  it("returns deterministic robots output through app route", () => {
    const response = robots();

    expect(response.sitemap).toBe(`${getSiteOrigin()}/sitemap.xml`);
  });

  it("generates sitemap URLs only for indexable pages", () => {
    const customEntries = [
      { path: "/knowledge", section: "knowledge", status: "published" },
      { path: "/admin", section: "admin", status: "published" }
    ] as Parameters<typeof buildPublicSitemap>[0];

    const generated = buildPublicSitemap(customEntries);

    expect(generated).toHaveLength(1);
    expect(generated[0]?.url).toBe(`${getSiteOrigin()}/knowledge`);
  });

  it("exposes sitemap output from app route", () => {
    const response = sitemap();
    const defaultEntries = getDefaultPublicSitemapEntries();

    expect(response.length).toBeGreaterThan(0);
    expect(response.length).toBe(defaultEntries.length);
    expect(response.every((entry) => entry.url.startsWith(getSiteOrigin()))).toBe(true);
  });
});
