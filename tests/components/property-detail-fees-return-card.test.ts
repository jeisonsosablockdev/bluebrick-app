// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({ useI18n: vi.fn() }));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

import { PropertyDetailFeesReturnCard } from "@/features/marketplace/presentation/PropertyDetailFeesReturnCard";

function renderCard(economics: Record<string, number | null>) {
  const container = document.createElement("div");
  const root = createRoot(container);

  act(() => {
    root.render(createElement(PropertyDetailFeesReturnCard, { economics: economics as never }));
  });

  return { container, root };
}

describe("PropertyDetailFeesReturnCard", () => {
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

  it("renders positive fee metrics and projected ROI", () => {
    const { container, root } = renderCard({
      structuringFeeUsd: 2500,
      grossProfitProjectedUsd: 32000,
      managementFeeUsd: 3000,
      brokerFeeUsd: 1500,
      netInvestorProfitUsd: 25500,
      projectedNetRoiPct: 18.75
    });

    expect(container.textContent).toContain("Fees and projected return");
    expect(container.textContent).toContain("Structuring fee: $2,500");
    expect(container.textContent).toContain("Net profit for investor: $25,500");
    expect(container.textContent).toContain("Projected ROI: 18.8%");

    act(() => root.unmount());
  });

  it("hides null and non-positive fee metrics while preserving zero ROI display", () => {
    const { container, root } = renderCard({
      structuringFeeUsd: 0,
      grossProfitProjectedUsd: null,
      managementFeeUsd: -1,
      brokerFeeUsd: null,
      netInvestorProfitUsd: null,
      projectedNetRoiPct: 0
    });

    expect(container.textContent).not.toContain("Structuring fee");
    expect(container.textContent).not.toContain("Management fee");
    expect(container.textContent).toContain("Projected ROI: 0.0%");

    act(() => root.unmount());
  });
});
