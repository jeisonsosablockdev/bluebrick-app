import { describe, expect, it } from "vitest";

import {
  formatMarketplaceDetailDate,
  formatMarketplaceDetailLocation,
  formatMarketplaceDetailMonths,
  formatMarketplaceDetailPercent,
  formatMarketplaceDetailUsd,
  shouldRenderMarketplaceDetailMetric
} from "@/features/marketplace/presentation/property-detail-formatters";

describe("marketplace detail formatters", () => {
  it("formats USD, percentages, months, and unavailable values by locale", () => {
    expect(formatMarketplaceDetailUsd(125000, "en")).toBe("$125,000");
    expect(formatMarketplaceDetailUsd(null, "es")).toBe("No disponible");
    expect(formatMarketplaceDetailPercent(12.345, "en")).toBe("12.3%");
    expect(formatMarketplaceDetailPercent(-1, "pt")).toBe("Indisponivel");
    expect(formatMarketplaceDetailMonths(18, "en")).toBe("18 months");
    expect(formatMarketplaceDetailMonths(18, "es")).toBe("18 meses");
  });

  it("formats valid dates and hides invalid dates behind the locale fallback", () => {
    expect(formatMarketplaceDetailDate("2026-05-30T15:00:00.000Z", "en")).toContain("2026");
    expect(formatMarketplaceDetailDate("not-a-date", "es")).toBe("No disponible");
  });

  it("removes trailing postal code from detailed locations and preserves metric visibility semantics", () => {
    expect(formatMarketplaceDetailLocation("117 Hickory Creek Blvd, Brandon, FL 33511", "33511")).toBe("117 Hickory Creek Blvd, Brandon, FL");
    expect(formatMarketplaceDetailLocation("Brandon, FL", null)).toBe("Brandon, FL");
    expect(shouldRenderMarketplaceDetailMetric(1)).toBe(true);
    expect(shouldRenderMarketplaceDetailMetric(0)).toBe(false);
    expect(shouldRenderMarketplaceDetailMetric(null)).toBe(false);
  });
});
