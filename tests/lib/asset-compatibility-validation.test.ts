import { describe, expect, it } from "vitest";

import {
  ASSET_EXIT_STRATEGIES,
  parseAssetCompatibility,
  parseCollectionName,
  parseCollectionSymbol,
  parseExitStrategy
} from "@/lib/admin/asset-compatibility-validation";

describe("lib/admin/asset-compatibility-validation", () => {
  it("accepts collectionName up to 32 UTF-8 bytes", () => {
    const result = parseCollectionName("Torre Marina Prime #01");
    expect(result.ok).toBe(true);
  });

  it("rejects collectionName over 32 UTF-8 bytes", () => {
    // 9 * 4 = 36 bytes
    const overLimit = "🚀".repeat(9);
    const result = parseCollectionName(overLimit);

    expect(result.ok).toBe(false);
  });

  it("accepts collectionSymbol with max 10 chars uppercase alnum", () => {
    const result = parseCollectionSymbol("BLD001TORR");
    expect(result.ok).toBe(true);
  });

  it("rejects collectionSymbol with lowercase or invalid chars", () => {
    expect(parseCollectionSymbol("bld001").ok).toBe(false);
    expect(parseCollectionSymbol("BLD-001").ok).toBe(false);
    expect(parseCollectionSymbol("ABCDEFGHIJK").ok).toBe(false);
  });

  it("accepts known exit strategies", () => {
    const sample = ASSET_EXIT_STRATEGIES[0];
    const result = parseAssetCompatibility({
      collectionName: "Collection Alpha",
      collectionSymbol: "ALPHA001",
      exitStrategy: sample
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.exitStrategy).toBe(sample);
  });

  it("normalizes exitStrategy aliases to canonical values", () => {
    const sale = parseExitStrategy("Venta");
    expect(sale.ok).toBe(true);
    if (sale.ok) {
      expect(sale.value).toBe("sale");
    }

    const refinance = parseExitStrategy("Refinanciacion");
    expect(refinance.ok).toBe(true);
    if (refinance.ok) {
      expect(refinance.value).toBe("refinance");
    }

    const redemption = parseExitStrategy("token redemption");
    expect(redemption.ok).toBe(true);
    if (redemption.ok) {
      expect(redemption.value).toBe("token-redemption");
    }
  });

  it("requires non-empty exitStrategy", () => {
    const result = parseExitStrategy("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("exitStrategy is required.");
    }
  });

  it("rejects unknown exitStrategy", () => {
    const result = parseAssetCompatibility({
      collectionName: "Collection Alpha",
      collectionSymbol: "ALPHA001",
      exitStrategy: "flash-sale"
    });

    expect(result.ok).toBe(false);
  });
});
