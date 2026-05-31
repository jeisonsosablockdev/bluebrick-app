// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({ useI18n: vi.fn() }));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

import { PropertyDetailDealEconomicsCard } from "@/components/marketplace/PropertyDetailDealEconomicsCard";

function renderCard(economics: Record<string, number | null>) {
  const container = document.createElement("div");
  const root = createRoot(container);

  act(() => {
    root.render(createElement(PropertyDetailDealEconomicsCard, { economics: economics as never }));
  });

  return { container, root };
}

describe("PropertyDetailDealEconomicsCard", () => {
  beforeEach(() => {
    localeMocks.useI18n.mockReturnValue({
      locale: "en",
      t: (text: { en: string; es: string; pt: string }) => text.en
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders positive deal economics metrics", () => {
    const { container, root } = renderCard({
      purchasePriceUsd: 100000,
      afterRepairValueUsd: 150000,
      rehabBudgetUsd: 25000,
      closingCostsUsd: 4000,
      holdingCostsUsd: 3000,
      sellingCostsUsd: 6000,
      totalProjectCostUsd: 138000,
      minimumCapitalRequiredUsd: 50000
    });

    expect(container.textContent).toContain("Deal economics");
    expect(container.textContent).toContain("Purchase price: $100,000");
    expect(container.textContent).toContain("After Repair Value (ARV): $150,000");
    expect(container.textContent).toContain("Minimum capital required: $50,000");

    act(() => root.unmount());
  });

  it("hides null and non-positive deal economics metrics", () => {
    const { container, root } = renderCard({
      purchasePriceUsd: 0,
      afterRepairValueUsd: null,
      rehabBudgetUsd: -1,
      closingCostsUsd: null,
      holdingCostsUsd: 0,
      sellingCostsUsd: null,
      totalProjectCostUsd: null,
      minimumCapitalRequiredUsd: 25000
    });

    expect(container.textContent).not.toContain("Purchase price");
    expect(container.textContent).not.toContain("After Repair Value");
    expect(container.textContent).not.toContain("Rehab budget");
    expect(container.textContent).toContain("Minimum capital required: $25,000");

    act(() => root.unmount());
  });
});
