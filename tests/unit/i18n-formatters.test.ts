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
  formatTiming,
  formatPhaseName,
  formatPhaseDescription,
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

  describe("formatTiming (Return Dates & Project Timelines)", () => {
    it("should format Spanish month names into English and Portuguese correctly", () => {
      // English formatting
      expect(formatTiming("Noviembre 2026", { locale: "en" })).toBe("November 2026");
      expect(formatTiming("Marzo 2027", { locale: "en" })).toBe("March 2027");
      expect(formatTiming("Concluida — Junio 2026", { locale: "en" })).toBe("Completed — June 2026");
      expect(formatTiming("Enero 2027", { locale: "en" })).toBe("January 2027");
      expect(formatTiming("Agosto 2026", { locale: "en" })).toBe("August 2026");

      // Portuguese formatting
      expect(formatTiming("Noviembre 2026", { locale: "pt" })).toBe("Novembro 2026");
      expect(formatTiming("Marzo 2027", { locale: "pt" })).toBe("Março 2027");
      expect(formatTiming("Concluida — Junio 2026", { locale: "pt" })).toBe("Concluída — Junho 2026");
      expect(formatTiming("Enero 2027", { locale: "pt" })).toBe("Janeiro 2027");
      expect(formatTiming("Agosto 2026", { locale: "pt" })).toBe("Agosto 2026");

      // Spanish (unmodified)
      expect(formatTiming("Noviembre 2026", { locale: "es" })).toBe("Noviembre 2026");
    });

    it("should gracefully handle null, undefined, or empty values", () => {
      expect(formatTiming(null)).toBe("");
      expect(formatTiming(undefined)).toBe("");
      expect(formatTiming("")).toBe("");
    });
  });

  describe("formatPhaseName (Construction Phase Names)", () => {
    it("should format all 14 standard numbered construction phase names across locales", () => {
      // 1. Adquisición
      expect(formatPhaseName("1. Adquisición", { locale: "en" })).toBe("1. Acquisition");
      expect(formatPhaseName("1. Adquisición", { locale: "pt" })).toBe("1. Aquisição");

      // 2. Preliminares
      expect(formatPhaseName("2. Preliminares", { locale: "en" })).toBe("2. Preliminaries");
      expect(formatPhaseName("2. Preliminares", { locale: "pt" })).toBe("2. Preliminares");

      // 3. Permisos
      expect(formatPhaseName("3. Permisos", { locale: "en" })).toBe("3. Permits");
      expect(formatPhaseName("3. Permisos", { locale: "pt" })).toBe("3. Permissões");

      // 4. Inicio de obra
      expect(formatPhaseName("4. Inicio de obra", { locale: "en" })).toBe("4. Groundbreaking & Site Start");
      expect(formatPhaseName("4. Inicio de obra", { locale: "pt" })).toBe("4. Início de Obra");

      // 5. Demoliciones y/o cimentación
      expect(formatPhaseName("5. Demoliciones y/o cimentación", { locale: "en" })).toBe("5. Demolitions & Foundations");
      expect(formatPhaseName("5. Demoliciones y/o cimentación", { locale: "pt" })).toBe("5. Demolições e/ou Fundações");

      // 6. Construcción de estructuras y muros
      expect(formatPhaseName("6. Construcción de estructuras y muros", { locale: "en" })).toBe("6. Structure & Wall Construction");
      expect(formatPhaseName("6. Construcción de estructuras y muros", { locale: "pt" })).toBe("6. Construção de Estruturas e Paredes");

      // 7. Cubierta o techos
      expect(formatPhaseName("7. Cubierta o techos", { locale: "en" })).toBe("7. Roofing & Ceilings");
      expect(formatPhaseName("7. Cubierta o techos", { locale: "pt" })).toBe("7. Cobertura ou Telhados");

      // 8. Instalaciones
      expect(formatPhaseName("8. Instalaciones", { locale: "en" })).toBe("8. MEP Installations");
      expect(formatPhaseName("8. Instalaciones", { locale: "pt" })).toBe("8. Instalações");

      // 9. Acabados
      expect(formatPhaseName("9. Acabados", { locale: "en" })).toBe("9. Finishes");
      expect(formatPhaseName("9. Acabados", { locale: "pt" })).toBe("9. Acabamentos");
      expect(formatPhaseName("9. Acabados", { locale: "es" })).toBe("9. Acabados");

      // 10. Inspecciones
      expect(formatPhaseName("10. Inspecciones", { locale: "en" })).toBe("10. Inspections");
      expect(formatPhaseName("10. Inspecciones", { locale: "pt" })).toBe("10. Inspeções");

      // 11. Listada para renta o venta
      expect(formatPhaseName("11. Listada para renta o venta", { locale: "en" })).toBe("11. Listed for Rent or Sale");
      expect(formatPhaseName("11. Listada para renta o venta", { locale: "pt" })).toBe("11. Listada para Aluguel ou Venda");

      // 12. Vendida o rentada
      expect(formatPhaseName("12. Vendida o rentada", { locale: "en" })).toBe("12. Sold or Rented");
      expect(formatPhaseName("12. Vendida o rentada", { locale: "pt" })).toBe("12. Vendida ou Alugada");

      // 13. Liquidación
      expect(formatPhaseName("13. Liquidación", { locale: "en" })).toBe("13. Settlement & Liquidation");
      expect(formatPhaseName("13. Liquidación", { locale: "pt" })).toBe("13. Liquidação");

      // 14. Dispersión de pagos
      expect(formatPhaseName("14. Dispersión de pagos", { locale: "en" })).toBe("14. Payment Disbursement");
      expect(formatPhaseName("14. Dispersión de pagos", { locale: "pt" })).toBe("14. Dispersão de Pagamentos");
    });

    it("should format unnumbered and accent-variant phase names across locales", () => {
      expect(formatPhaseName("Acabados interiores y revestimientos", { locale: "en" })).toBe("Interior Finishes & Cladding");
      expect(formatPhaseName("Acabados interiores y revestimientos", { locale: "pt" })).toBe("Acabamentos Interiores e Revestimentos");
      expect(formatPhaseName("Estudios y licencias de construcción", { locale: "en" })).toBe("Studies & Building Permits");
      expect(formatPhaseName("Demolicion y limpieza", { locale: "en" })).toBe("Demolition & Site Clearing");
      expect(formatPhaseName("Cimentacion y estructura", { locale: "en" })).toBe("Foundation & Structure");
    });

    it("should gracefully preserve unknown phase names without error", () => {
      expect(formatPhaseName("Custom Unknown Phase", { locale: "en" })).toBe("Custom Unknown Phase");
    });
  });

  describe("formatPhaseDescription", () => {
    it("should format default phase descriptions across locales", () => {
      expect(
        formatPhaseDescription("Fase de obra completada según cronograma", { locale: "en" })
      ).toBe("Phase completed according to schedule");
      expect(
        formatPhaseDescription("Fase de obra completada según cronograma", { locale: "pt" })
      ).toBe("Fase de obra concluída de acordo com o cronograma");
    });
  });
});
