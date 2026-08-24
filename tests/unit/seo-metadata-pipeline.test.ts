/**
 * @file tests/unit/seo-metadata-pipeline.test.ts
 * @description Layer 3 & QA: Behavioral Unit Test Suite for SPEC-5 (SEO Metadata Pipeline & Schema.org JSON-LD).
 * @spec BBC-6-SPEC-5
 */

import { describe, it, expect } from "vitest";
import {
  buildPageMetadata,
  generatePlatformJsonLd,
} from "@/lib/pipelines/seo-metadata-pipeline";

describe("SPEC-5: SEO Metadata & JSON-LD Pipeline Behavioral Suite (@spec BBC-6-SPEC-5)", () => {
  describe("buildPageMetadata", () => {
    it("should generate complete OpenGraph and Twitter card metadata with canonical URL", () => {
      // Arrange
      const config = {
        title: "Portafolio de Inversión",
        description: "Monitorea tus inversiones fraccionadas y distribuciones mensuales.",
        pathname: "/dashboard",
      };

      // Act
      const metadata = buildPageMetadata(config);

      // Assert
      expect(metadata.title).toBe("Portafolio de Inversión | BlueBrick");
      expect(metadata.description).toBe(config.description);
      expect(metadata.alternates?.canonical).toContain("/dashboard");
      const og = metadata.openGraph as { title?: string; type?: string } | null;
      expect(og?.title).toBe("Portafolio de Inversión | BlueBrick");
      expect(og?.type).toBe("website");
      const twitter = metadata.twitter as { card?: string } | null;
      expect(twitter?.card).toBe("summary_large_image");
    });
  });

  describe("generatePlatformJsonLd", () => {
    it("should produce a valid Schema.org FinancialService payload", () => {
      // Act
      const jsonLd = generatePlatformJsonLd();

      // Assert
      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("FinancialService");
      expect(jsonLd.name).toBe("BlueBrick Platform");
      expect(jsonLd.url).toBeDefined();
      expect(jsonLd.logo).toContain("/brand-emblem.png");
    });
  });
});
