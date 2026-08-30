/**
 * @file tests/unit/seo-metadata-pipeline.test.ts
 * @description Layer 3 & QA: Behavioral Unit Test Suite for BBC-12 (SEO Metadata Pipeline & Schema.org JSON-LD).
 * @spec BBC-12-SPEC-1
 */

import { describe, it, expect } from "vitest";
import {
  buildPageMetadata,
  generatePlatformJsonLd,
} from "@/lib/pipelines/seo-metadata-pipeline";

describe("BBC-12: SEO Metadata & JSON-LD Pipeline Behavioral Suite (@spec BBC-12)", () => {
  describe("buildPageMetadata", () => {
    it("should generate complete OpenGraph and Twitter card metadata with canonical URL", () => {
      // Step 1: Prepare test page configuration
      const config = {
        title: "Portafolio de Inversión",
        description: "Monitorea tus inversiones fraccionadas y distribuciones mensuales.",
        pathname: "/dashboard",
      };

      // Step 2: Generate metadata
      const metadata = buildPageMetadata(config);

      // Step 3: Verify title formatting and canonical alternates
      expect(metadata.title).toBe("Portafolio de Inversión | BlueBrick");
      expect(metadata.description).toBe(config.description);
      expect(metadata.alternates?.canonical).toContain("/dashboard");

      // Step 4: Verify OpenGraph parameters
      const og = metadata.openGraph as {
        title?: string;
        type?: string;
        images?: Array<{ url: string; width: number; height: number; alt: string }>;
      } | null;
      expect(og?.title).toBe("Portafolio de Inversión | BlueBrick");
      expect(og?.type).toBe("website");
      expect(Array.isArray(og?.images)).toBe(true);
      expect(og?.images?.[0]?.width).toBe(1200);
      expect(og?.images?.[0]?.height).toBe(630);

      // Step 5: Verify Twitter parameters
      const twitter = metadata.twitter as {
        card?: string;
        title?: string;
        images?: string[];
      } | null;
      expect(twitter?.card).toBe("summary_large_image");
      expect(twitter?.title).toBe("Portafolio de Inversión | BlueBrick");
      expect(twitter?.images).toBeDefined();

      // Step 6: Verify robots rules
      expect(metadata.robots).toBeDefined();
    });
  });

  describe("generatePlatformJsonLd", () => {
    it("should produce a valid Schema.org FinancialService + RealEstate composite payload", () => {
      // Step 1: Execute Schema.org generator
      const jsonLd = generatePlatformJsonLd();

      // Step 2: Validate JSON-LD core schema context and type
      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(
        jsonLd["@type"] === "FinancialService" ||
        jsonLd["@type"] === "RealEstateAgent" ||
        (Array.isArray(jsonLd["@type"]) && jsonLd["@type"].includes("FinancialService"))
      ).toBe(true);

      // Step 3: Validate organization properties
      expect(jsonLd.name).toBe("BlueBrick Platform");
      expect(jsonLd.url).toBeDefined();
      expect(jsonLd.logo).toBeDefined();
      expect(jsonLd.description).toBeDefined();
      expect(Array.isArray(jsonLd.sameAs)).toBe(true);
    });
  });
});
