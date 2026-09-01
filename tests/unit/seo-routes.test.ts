/**
 * @file tests/unit/seo-routes.test.ts
 * @description Layer 1 & QA: Unit Test Suite for Next.js 16 App Router Metadata Route Handlers.
 * Tests robots.ts, sitemap.ts, manifest.ts, icon.tsx, and apple-icon.tsx contracts.
 * @spec BBC-12-SPEC-1
 */

import { describe, it, expect } from "vitest";
import robotsHandler from "@/app/robots";
import sitemapHandler from "@/app/sitemap";
import manifestHandler from "@/app/manifest";
import * as iconHandler from "@/app/icon";
import * as appleIconHandler from "@/app/apple-icon";
import * as ogImageHandler from "@/app/opengraph-image";

describe("BBC-12: SEO Metadata Route Handlers Suite (@spec BBC-12)", () => {
  describe("robots.ts", () => {
    it("should return compliant crawling rules with sitemap link and private path disallows", () => {
      // Step 1: Execute robots handler
      const robots = robotsHandler();

      // Step 2: Validate user-agent and allowed paths
      expect(robots).toBeDefined();
      const rules = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
      expect(rules).toBeDefined();
      expect(rules?.userAgent).toBe("*");
      expect(rules?.allow).toBe("/");

      // Step 3: Ensure sensitive / private endpoints are explicitly blocked
      const disallows = Array.isArray(rules?.disallow) ? rules?.disallow : [rules?.disallow];
      expect(disallows).toContain("/api/");
      expect(disallows).toContain("/callback");
      expect(disallows).toContain("/auth/");

      // Step 4: Ensure sitemap URL is configured
      expect(robots.sitemap).toBeDefined();
      expect(robots.sitemap).toContain("/sitemap.xml");
    });
  });

  describe("sitemap.ts", () => {
    it("should generate sitemap entries for public landing and demo investment dashboard", () => {
      // Step 1: Execute sitemap handler
      const sitemap = sitemapHandler();

      // Step 2: Validate entries array length and presence of public routes
      expect(Array.isArray(sitemap)).toBe(true);
      expect(sitemap.length).toBeGreaterThanOrEqual(2);

      const homeEntry = sitemap.find((entry) => entry.url.endsWith("/") || !entry.url.split("/").pop());
      expect(homeEntry).toBeDefined();
      expect(homeEntry?.priority).toBe(1.0);
      expect(homeEntry?.changeFrequency).toBe("weekly");
      expect(homeEntry?.lastModified).toBeInstanceOf(Date);

      const dashboardEntry = sitemap.find((entry) => entry.url.endsWith("/dashboard"));
      expect(dashboardEntry).toBeDefined();
      expect(dashboardEntry?.priority).toBe(0.8);
      expect(dashboardEntry?.changeFrequency).toBe("daily");
      expect(dashboardEntry?.lastModified).toBeInstanceOf(Date);
    });
  });

  describe("manifest.ts", () => {
    it("should return valid PWA Web App Manifest metadata and theme tokens", () => {
      // Step 1: Execute manifest generator
      const manifest = manifestHandler();

      // Step 2: Validate PWA branding fields
      expect(manifest.name).toBe("BlueBrick - Inversión Inmobiliaria Fraccionada");
      expect(manifest.short_name).toBe("BlueBrick");
      expect(manifest.start_url).toBe("/");
      expect(manifest.display).toBe("standalone");
      expect(manifest.theme_color).toBe("#0A1220");
      expect(manifest.background_color).toBe("#0A1220");

      // Step 3: Validate icons configuration
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons?.length).toBeGreaterThanOrEqual(2);

      const faviconIcon = manifest.icons?.find((icon) => icon.src === "/icon");
      expect(faviconIcon).toBeDefined();
      expect(faviconIcon?.sizes).toBe("32x32");

      const appleIcon = manifest.icons?.find((icon) => icon.src === "/apple-icon");
      expect(appleIcon).toBeDefined();
      expect(appleIcon?.sizes).toBe("180x180");
    });
  });

  describe("icon.tsx & apple-icon.tsx & opengraph-image.tsx structural contracts", () => {
    it("should export valid size and contentType constants", () => {
      expect(iconHandler.size).toEqual({ width: 32, height: 32 });
      expect(iconHandler.contentType).toBe("image/png");

      expect(appleIconHandler.size).toEqual({ width: 180, height: 180 });
      expect(appleIconHandler.contentType).toBe("image/png");

      expect(ogImageHandler.size).toEqual({ width: 1200, height: 630 });
      expect(ogImageHandler.contentType).toBe("image/png");
      expect(ogImageHandler.alt).toBeDefined();
    });

    it("should export callable image generators", () => {
      expect(typeof iconHandler.default).toBe("function");
      expect(typeof appleIconHandler.default).toBe("function");
      expect(typeof ogImageHandler.default).toBe("function");
    });
  });
});
