/**
 * @file tests/unit/seo-metadata-structural.test.ts
 * @description Layer 1 & 3: Structural Verification Tests for SPEC-5 (SEO / SEM & Structured Data).
 * @spec BBC-6-SPEC-5
 */

import { describe, it, expect } from "vitest";
import * as seoPipeline from "@/lib/pipelines/seo-metadata-pipeline";
import * as structuredDataComponent from "@/components/seo/structured-data";

describe("SPEC-5: SEO & Metadata Structural Suite (@spec BBC-6-SPEC-5)", () => {
  describe("Layer 3: SEO Metadata Pipeline Exports", () => {
    it("should export buildPageMetadata function", () => {
      expect(typeof seoPipeline.buildPageMetadata).toBe("function");
    });

    it("should export generatePlatformJsonLd function", () => {
      expect(typeof seoPipeline.generatePlatformJsonLd).toBe("function");
    });
  });

  describe("Layer 1: StructuredData Presentation Component", () => {
    it("should export StructuredData React Component", () => {
      expect(typeof structuredDataComponent.StructuredData).toBe("function");
    });
  });
});
