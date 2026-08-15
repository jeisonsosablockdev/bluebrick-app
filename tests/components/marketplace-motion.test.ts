// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({
  useI18n: vi.fn()
}));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => createElement("img", props)
}));

vi.mock("@/components/marketplace/PurchaseCta", () => ({
  PurchaseCta: () => createElement("div", null, "purchase-cta")
}));

vi.mock("@/features/marketplace/presentation/PurchaseCta", () => ({
  PurchaseCta: () => createElement("div", null, "purchase-cta")
}));

import { MarketplaceCard } from "@/features/marketplace";
import { PropertyDetailContent } from "@/features/marketplace";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderNode(node: ReactElement): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(node);
  });

  return { container, root };
}

describe("components/marketplace motion surfaces", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY = "test-google-maps-embed-key";
    localeMocks.useI18n.mockReturnValue({
      locale: "es",
      setLocale: vi.fn(),
      t: (text: { en: string; es: string; pt: string }) => text.es
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;
    vi.clearAllMocks();
  });

  it("renders the marketplace card with the detail action", () => {
    const { container, root } = renderNode(
      createElement(MarketplaceCard, {
        property: {
          id: "property-1",
          title: "Casa Azul",
          image: "/test.jpg",
          listingStatus: "active",
          locationLabel: "Medellin, Colombia",
          minimumCapitalRequiredUsd: 1000,
          annualRoiPct: 12.4,
          projectDurationMonths: 24
        } as never,
        onOpenDetail: vi.fn()
      })
    );

    expect(container.textContent).toContain("Ver detalle");
    expect(container.textContent).toContain("Casa Azul");

    act(() => {
      root.unmount();
    });
  });

  it("renders the property detail content with the purchase CTA", () => {
    const { container, root } = renderNode(
      createElement(PropertyDetailContent, {
        property: {
          id: "property-1",
          title: "Casa Azul",
          image: "/test.jpg",
          listingStatus: "active",
          postalCode: "33511",
          googleMapsPlace: {
            placeLabel: "Casa Azul",
            formattedAddress: "117 Hickory Creek Blvd, Brandon, FL 33511, USA",
            lat: 27.9379,
            lng: -82.2859,
            googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=117%20Hickory%20Creek%20Blvd",
            placeId: "place-casa-azul",
            city: "Brandon",
            stateProvince: "FL",
            country: "US",
            postalCode: "33511"
          },
          locationLabel: "Brandon, Florida, 33511, US",
          shortDescription: "Short description",
          investment: {
            supplyTotal: 1000,
            mintedOrSold: 200,
            nftPriceUsd: 100,
            annualRoiPct: 12.4,
            availabilityLabel: "Disponible"
          },
          economics: {
            projectedNetRoiPct: 12.4,
            purchasePriceUsd: 100000,
            afterRepairValueUsd: 120000,
            rehabBudgetUsd: 5000,
            closingCostsUsd: 2500,
            holdingCostsUsd: 3000,
            sellingCostsUsd: 4500,
            totalProjectCostUsd: 115000,
            minimumCapitalRequiredUsd: 1000,
            structuringFeeUsd: 1500,
            grossProfitProjectedUsd: 18000,
            managementFeeUsd: 2000,
            brokerFeeUsd: 1200,
            netInvestorProfitUsd: 14800
          },
          project: {
            stage: "Acquisition",
            developerName: "BRIDS",
            exitStrategy: "Sale",
            durationMonths: 24
          },
          governance: {
            riskNotes: "Risk notes"
          },
          documents: [],
          highlights: ["Highlight"],
          detailedLocation: "117 Hickory Creek Blvd, Brandon, FL",
          investmentNotes: "Notes",
          blockchain: {
            network: "devnet",
            collectionAddress: "collection",
            assetMintAddress: "mint",
            explorerUrl: "https://example.com",
            lastOnchainUpdate: "2026-05-28T00:00:00.000Z",
            syncStatus: "available"
          }
        } as never
      })
    );

    expect(container.textContent).toContain("Resumen de inversion fraccional");
    expect(container.textContent).toContain("purchase-cta");
    expect(container.textContent).toContain("Ubicacion en Google Maps");
    expect(container.textContent).toContain("Open in Google Maps");

    const iframe = container.querySelector("iframe[title='Google Maps preview']");
    expect(iframe?.getAttribute("src")).toContain("google.com/maps/embed/v1/place");
    expect(iframe?.getAttribute("src")).toContain("place_id%3Aplace-casa-azul");

    act(() => {
      root.unmount();
    });
  });

  it("keeps the outbound Google Maps fallback when the embed key is unavailable", () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;

    const { container, root } = renderNode(
      createElement(PropertyDetailContent, {
        property: {
          id: "property-1",
          title: "Casa Azul",
          image: "/test.jpg",
          listingStatus: "active",
          postalCode: "33511",
          googleMapsPlace: null,
          locationLabel: "Brandon, Florida, 33511, US",
          shortDescription: "Short description",
          investment: {
            supplyTotal: 1000,
            mintedOrSold: 200,
            nftPriceUsd: 100,
            annualRoiPct: 12.4,
            availabilityLabel: "Disponible"
          },
          economics: {
            projectedNetRoiPct: 12.4,
            purchasePriceUsd: 100000,
            afterRepairValueUsd: 120000,
            rehabBudgetUsd: 5000,
            closingCostsUsd: 2500,
            holdingCostsUsd: 3000,
            sellingCostsUsd: 4500,
            totalProjectCostUsd: 115000,
            minimumCapitalRequiredUsd: 1000,
            structuringFeeUsd: 1500,
            grossProfitProjectedUsd: 18000,
            managementFeeUsd: 2000,
            brokerFeeUsd: 1200,
            netInvestorProfitUsd: 14800
          },
          project: {
            stage: "Acquisition",
            developerName: "BRIDS",
            exitStrategy: "Sale",
            durationMonths: 24
          },
          governance: {
            riskNotes: "Risk notes"
          },
          documents: [],
          highlights: ["Highlight"],
          detailedLocation: "117 Hickory Creek Blvd, Brandon, FL",
          investmentNotes: "Notes",
          blockchain: {
            network: "devnet",
            collectionAddress: "collection",
            assetMintAddress: "mint",
            explorerUrl: "https://example.com",
            lastOnchainUpdate: "2026-05-28T00:00:00.000Z",
            syncStatus: "available"
          }
        } as never
      })
    );

    expect(container.textContent).toContain("Open in Google Maps");
    expect(container.querySelector("iframe[title='Google Maps preview']")).toBeNull();

    act(() => {
      root.unmount();
    });
  });
});
