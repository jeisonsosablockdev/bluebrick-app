// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: { alt: string; className: string; src: string }) => createElement("img", props)
}));

vi.mock("@/components/marketplace/PurchaseCta", () => ({
  PurchaseCta: ({ propertyId }: { propertyId: string }) => createElement("div", { "data-testid": "purchase-cta" }, propertyId)
}));

vi.mock("@/features/marketplace/presentation/PurchaseCta", () => ({
  PurchaseCta: ({ propertyId }: { propertyId: string }) => createElement("div", { "data-testid": "purchase-cta" }, propertyId)
}));

import { PropertyDetailHeroSection } from "@/features/marketplace";
import type { PropertyDetail } from "@/lib/property-service";

const property = {
  id: "property-1",
  title: "Casa Azul",
  image: "/test.jpg",
  listingStatus: "funding",
  locationLabel: "Brandon, Florida, US",
  shortDescription: "Short description",
  investment: {
    nftPriceUsd: 100
  }
} as PropertyDetail;

describe("PropertyDetailHeroSection", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders hero title, status, location, CTA, and preserves image class override", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(createElement(PropertyDetailHeroSection, {
        property,
        locale: "es",
        imageClassName: "h-56 md:h-72",
        layoutId: "marketplace-property-property-1"
      }));
    });

    expect(container.textContent).toContain("Casa Azul");
    expect(container.textContent).toContain("Funding");
    expect(container.textContent).toContain("Brandon, Florida, US");
    expect(container.textContent).toContain("property-1");
    expect(container.querySelector("img")?.className).toContain("h-56 md:h-72");

    act(() => {
      root.unmount();
    });
  });
});
