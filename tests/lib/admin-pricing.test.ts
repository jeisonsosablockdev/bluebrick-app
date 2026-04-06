import { describe, expect, it } from "vitest";

import {
  convertSolToUsd,
  convertUsdToSol,
  formatPriceInput,
  parsePositiveDecimalInput,
  usdToUsdcAtomic
} from "@/lib/admin/pricing";

describe("lib/admin/pricing", () => {
  describe("parsePositiveDecimalInput", () => {
    it("parses valid decimals and comma decimal separators", () => {
      expect(parsePositiveDecimalInput("10.5")).toBe(10.5);
      expect(parsePositiveDecimalInput("10,5")).toBe(10.5);
      expect(parsePositiveDecimalInput("  2.25  ")).toBe(2.25);
    });

    it("returns null for invalid or non-positive values", () => {
      expect(parsePositiveDecimalInput("0")).toBeNull();
      expect(parsePositiveDecimalInput("-1")).toBeNull();
      expect(parsePositiveDecimalInput("abc")).toBeNull();
      expect(parsePositiveDecimalInput("")).toBeNull();
    });
  });

  describe("formatPriceInput", () => {
    it("removes trailing zeros while preserving precision", () => {
      expect(formatPriceInput(1)).toBe("1");
      expect(formatPriceInput(1.25)).toBe("1.25");
      expect(formatPriceInput(1.23456789)).toBe("1.23456789");
      expect(formatPriceInput(1.2, 2)).toBe("1.2");
    });
  });

  describe("USD/SOL conversions", () => {
    it("converts USD to SOL and SOL to USD consistently", () => {
      const solRate = 200;
      const usdAmount = 150;
      const solAmount = convertUsdToSol(usdAmount, solRate);

      expect(solAmount).toBe(0.75);
      expect(convertSolToUsd(solAmount, solRate)).toBe(usdAmount);
    });

    it("throws when rate or amount are invalid", () => {
      expect(() => convertUsdToSol(10, 0)).toThrow("solUsdRate must be greater than zero.");
      expect(() => convertSolToUsd(0, 100)).toThrow("solAmount must be greater than zero.");
    });
  });

  describe("usdToUsdcAtomic", () => {
    it("converts USD to atomic units with round policy", () => {
      expect(usdToUsdcAtomic(1)).toBe(1_000_000);
      expect(usdToUsdcAtomic(1.234567)).toBe(1_234_567);
      expect(usdToUsdcAtomic(1.2345678)).toBe(1_234_568);
    });

    it("throws for non-positive values", () => {
      expect(() => usdToUsdcAtomic(0)).toThrow("usdAmount must be greater than zero.");
    });
  });
});
