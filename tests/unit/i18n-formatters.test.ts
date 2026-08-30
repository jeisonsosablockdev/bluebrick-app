/**
 * @file tests/unit/i18n-formatters.test.ts
 * @description Layer 3 & QA: Comprehensive Behavioral Unit Test Suite for Locale Formatters and String Interpolation.
 * @spec BBC-009-FORMATTERS
 */

import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  resolveNestedToken,
  interpolate,
} from "@/features/i18n/domain/formatters/locale-formatters";

describe("BBC-009: Locale Formatters & String Interpolation (@spec BBC-009-FORMATTERS)", () => {
  describe("resolveNestedToken", () => {
    const sampleTree = {
      landing: {
        headline: "Welcome",
        nested: {
          deep: "Found value",
        },
      },
    };

    it("should resolve direct and deeply nested string properties", () => {
      expect(resolveNestedToken(sampleTree, "landing.headline")).toBe("Welcome");
      expect(resolveNestedToken(sampleTree, "landing.nested.deep")).toBe("Found value");
    });

    it("should return null for non-existent paths or non-string leaf nodes", () => {
      expect(resolveNestedToken(sampleTree, "landing.missing")).toBeNull();
      expect(resolveNestedToken(sampleTree, "landing.nested")).toBeNull();
      expect(resolveNestedToken(null, "landing.headline")).toBeNull();
    });
  });

  describe("formatCurrency (USD Denomination)", () => {
    it("should format standard USD currency without decimal cents by default", () => {
      // Step 1: Format amounts in USD
      expect(formatCurrency(163000)).toBe("$163,000");
      expect(formatCurrency(45000)).toBe("$45,000");
      expect(formatCurrency(0)).toBe("$0");
    });

    it("should support explicit currency code suffix when requested", () => {
      expect(formatCurrency(163000, { showCode: true })).toBe("$163,000 USD");
    });

    it("should format properly across Spanish, English, and Portuguese", () => {
      expect(formatCurrency(120000, { locale: "es" })).toBe("$120,000");
      expect(formatCurrency(120000, { locale: "en" })).toBe("$120,000");
      // Portuguese formatting for USD
      const ptFormatted = formatCurrency(120000, { locale: "pt" });
      expect(ptFormatted).toMatch(/120/);
    });

    it("should respect minimum and maximum fraction digits", () => {
      expect(formatCurrency(1200.5, { minimumFractionDigits: 2, maximumFractionDigits: 2 })).toBe("$1200.50".replace("1200", "1,200"));
    });
  });

  describe("formatPercent", () => {
    it("should format ROI percentages with one decimal precision by default", () => {
      expect(formatPercent(14.2)).toBe("14.2%");
      expect(formatPercent(11.85)).toBe("11.9%");
      expect(formatPercent(0)).toBe("0.0%");
    });

    it("should format across different locales", () => {
      const esPercent = formatPercent(14.2, { locale: "es" });
      const enPercent = formatPercent(14.2, { locale: "en" });
      expect(esPercent).toContain("14");
      expect(enPercent).toContain("14.2%");
    });
  });

  describe("formatNumber", () => {
    it("should format numbers with thousands separators", () => {
      expect(formatNumber(1500000, { locale: "en" })).toBe("1,500,000");
      expect(formatNumber(42, { locale: "en" })).toBe("42");
    });
  });

  describe("interpolate", () => {
    it("should replace single variable parameter in template string", () => {
      const template = "Hello {name}, welcome!";
      const result = interpolate(template, { name: "Sofía" });
      expect(result).toBe("Hello Sofía, welcome!");
    });

    it("should replace multiple variable parameters in template string", () => {
      const template = "{count} active projects for {name} with {roi}% return";
      const result = interpolate(template, { count: 5, name: "Sofía Martínez", roi: "14.2" });
      expect(result).toBe("5 active projects for Sofía Martínez with 14.2% return");
    });

    it("should retain unprovided placeholders untouched", () => {
      const template = "Welcome {name}, your tier is {tier}";
      const result = interpolate(template, { name: "Sofía" });
      expect(result).toBe("Welcome Sofía, your tier is {tier}");
    });

    it("should return identical template string when no params object is provided", () => {
      const template = "Static string without placeholders";
      expect(interpolate(template)).toBe("Static string without placeholders");
    });
  });
});
