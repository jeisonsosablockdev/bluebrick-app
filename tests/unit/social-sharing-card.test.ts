/**
 * @file tests/unit/social-sharing-card.test.ts
 * @description Layer 1 & 3: Behavioral & Contract Unit Test Suite for BBC-19.
 * Validates OpenGraph card dimensions, dynamic domain resolution, WhatsApp preview contracts, and client-approved copy.
 * @spec BBC-19-SPEC-1
 */

import { describe, it, expect, vi } from "vitest";

vi.mock("@workos-inc/authkit-nextjs/components", () => ({
  AuthKitProvider: ({ children }: { children: unknown }) => children,
}));

vi.mock("@/components/seo/structured-data", () => ({
  StructuredData: () => null,
}));

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
  Space_Grotesk: () => ({ variable: "--font-space-grotesk" }),
  JetBrains_Mono: () => ({ variable: "--font-mono" }),
}));

import { metadata } from "@/app/layout";
import OpenGraphImage, { OpenGraphCard, alt, size, contentType } from "@/app/opengraph-image";
import { buildPageMetadata } from "@/lib/pipelines/seo-metadata-pipeline";

describe("BBC-19: Social Sharing OpenGraph Card & Preview Alignment (@spec BBC-19-SPEC-1)", () => {
  describe("Root Layout Metadata Contracts (@spec BBC-19-SPEC-1-LAYOUT)", () => {
    it("should resolve metadataBase to portal.bluebrick.capital by default", () => {
      // Step 1: Verify metadataBase origin resolves to official production portal domain
      expect(metadata.metadataBase).toBeDefined();
      const origin = metadata.metadataBase instanceof URL ? metadata.metadataBase.origin : String(metadata.metadataBase);
      expect(origin).toBe("https://portal.bluebrick.capital");
    });

    it("should contain client-approved OpenGraph title, description, and explicit 1200x630 image banner", () => {
      // Step 1: Validate openGraph configuration
      const og = metadata.openGraph as {
        title?: string;
        description?: string;
        url?: string;
        siteName?: string;
        images?: Array<{ url: string; width: number; height: number; type: string; alt: string }>;
      } | null;

      expect(og).toBeDefined();
      expect(og?.title).toBe("BlueBrick | Capital Inteligente · Activos Reales");
      expect(og?.description).toBe(
        "Oportunidades inmobiliarias seleccionadas para crear y hacer crecer tu patrimonio."
      );

      // Step 2: Validate explicit images array preventing WhatsApp fallback to square favicon
      expect(Array.isArray(og?.images)).toBe(true);
      expect(og?.images?.length).toBeGreaterThanOrEqual(1);

      const banner = og?.images?.[0];
      expect(banner?.url).toBe("/opengraph-image");
      expect(banner?.width).toBe(1200);
      expect(banner?.height).toBe(630);
      expect(banner?.type).toBe("image/png");
      expect(banner?.alt).toBe("BlueBrick | Capital Inteligente · Activos Reales");
    });

    it("should configure Twitter summary_large_image card with aligned copy and images", () => {
      // Step 1: Validate Twitter card metadata
      const twitter = metadata.twitter as {
        card?: string;
        title?: string;
        description?: string;
        images?: string[];
      } | null;

      expect(twitter).toBeDefined();
      expect(twitter?.card).toBe("summary_large_image");
      expect(twitter?.title).toBe("BlueBrick | Capital Inteligente · Activos Reales");
      expect(twitter?.description).toBe(
        "Oportunidades inmobiliarias seleccionadas para crear y hacer crecer tu patrimonio."
      );
      expect(twitter?.images).toContain("/opengraph-image");
    });
  });

  describe("Domain SEO Metadata Pipeline Contracts (@spec BBC-19-SPEC-1-PIPELINE)", () => {
    it("should default canonical URL and image URL to portal.bluebrick.capital when no env override exists", () => {
      // Step 1: Execute buildPageMetadata without explicit env override
      const pageMeta = buildPageMetadata({
        title: "Creación de Patrimonio",
        description: "Capital Inteligente. Activos Reales",
        pathname: "/dashboard",
      });

      // Step 2: Validate default canonical domain resolution
      expect(pageMeta.alternates?.canonical).toBe("https://portal.bluebrick.capital/dashboard");

      const og = pageMeta.openGraph as {
        images?: Array<{ url: string }>;
      } | null;
      expect(og?.images?.[0]?.url).toBe("https://portal.bluebrick.capital/opengraph-image");
    });
  });

  describe("Dynamic OpenGraph Image Generator Contracts (@spec BBC-19-SPEC-1-OG-IMAGE)", () => {
    it("should export 1200x630 dimensions, PNG content type, and client-approved alt text", () => {
      expect(size).toEqual({ width: 1200, height: 630 });
      expect(contentType).toBe("image/png");
      expect(alt).toBe("BlueBrick | Capital Inteligente · Activos Reales");
    });

    it("should render OpenGraphCard containing approved headline, badge, subtitle, and strategic pillars", () => {
      // Step 1: Execute OpenGraphCard element builder
      const element = OpenGraphCard();
      expect(element).toBeDefined();

      // Step 2: Serialize JSX tree to text to assert client-mandated copy elements
      const serialized = JSON.stringify(element);

      // Value proposition & headlines
      expect(serialized).toContain("CREACIÓN DE PATRIMONIO");
      expect(serialized).toContain("Capital Inteligente. Activos Reales");
      expect(serialized).toContain("Oportunidades inmobiliarias seleccionadas para crear y hacer crecer tu patrimonio.");

      // Strategic pillars
      expect(serialized).toContain("Real Estate");
      expect(serialized).toContain("Inversión Inmobiliaria");
      expect(serialized).toContain("Gestión Profesional");
      expect(serialized).toContain("Estrategia y Control");
      expect(serialized).toContain("Patrimonio");
      expect(serialized).toContain("Crecimiento Sostenible");

      // Canonical domain
      expect(serialized).toContain("portal.bluebrick.capital");

      // Step 3: Verify ImageResponse is callable
      const response = OpenGraphImage();
      expect(response).toBeDefined();
    });
  });
});
