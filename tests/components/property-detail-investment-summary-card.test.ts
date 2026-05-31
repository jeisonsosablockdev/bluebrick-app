// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({ useI18n: vi.fn() }));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

import { PropertyDetailInvestmentSummaryCard } from "@/components/marketplace/PropertyDetailInvestmentSummaryCard";

describe("PropertyDetailInvestmentSummaryCard", () => {
  beforeEach(() => {
    localeMocks.useI18n.mockReturnValue({
      locale: "es",
      t: (text: { en: string; es: string; pt: string }) => text.es
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders supply, sold count, price, ROI, and availability", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    act(() => {
      root.render(createElement(PropertyDetailInvestmentSummaryCard, {
        property: {
          investment: {
            supplyTotal: 2000,
            mintedOrSold: 500,
            nftPriceUsd: 125,
            annualRoiPct: 11.2,
            availabilityLabel: "Funding"
          },
          economics: { projectedNetRoiPct: 14.5 }
        } as never
      }));
    });

    expect(container.textContent).toContain("Resumen de inversion fraccional");
    expect(container.textContent).toContain("2,000");
    expect(container.textContent).toContain("500");
    expect(container.textContent).toContain("$125.00");
    expect(container.textContent).toContain("14,5%");
    expect(container.textContent).toContain("Funding");

    act(() => root.unmount());
  });
});
