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

import { PropertyDetailGoogleMapsCard } from "@/features/marketplace/presentation/PropertyDetailGoogleMapsCard";
import type { PropertyDetail } from "@/lib/property-service";

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

function createProperty(): PropertyDetail {
  return {
    id: "property-1",
    title: "Casa Azul",
    city: "Brandon",
    country: "US",
    postalCode: "33511",
    locationLabel: "Brandon, Florida, 33511, US",
    detailedLocation: "117 Hickory Creek Blvd, Brandon, FL",
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
    geoLat: 27.9379,
    geoLng: -82.2859,
    listingStatus: "funding",
    image: "/test.jpg",
    galleryImages: [],
    propertyImages: [],
    shortDescription: "Short description",
    highlights: [],
    investmentNotes: "Notes",
    investment: {
      supplyTotal: 1000,
      mintedOrSold: 200,
      nftPriceUsd: 100,
      annualRoiPct: 12.4,
      availabilityLabel: "Disponible"
    },
    project: {
      stage: "",
      developerName: "",
      exitStrategy: "",
      durationMonths: null
    },
    economics: {
      purchasePriceUsd: null,
      afterRepairValueUsd: null,
      rehabBudgetUsd: null,
      closingCostsUsd: null,
      holdingCostsUsd: null,
      sellingCostsUsd: null,
      totalProjectCostUsd: null,
      minimumCapitalRequiredUsd: null,
      structuringFeeUsd: null,
      grossProfitProjectedUsd: null,
      managementFeeUsd: null,
      brokerFeeUsd: null,
      netInvestorProfitUsd: null,
      projectedNetRoiPct: null
    },
    governance: { riskNotes: "" },
    documents: [],
    blockchain: {
      network: "Solana Devnet",
      collectionAddress: "collection",
      assetMintAddress: "mint",
      explorerUrl: "https://explorer.solana.com",
      lastOnchainUpdate: null,
      syncStatus: "available"
    }
  };
}

describe("PropertyDetailGoogleMapsCard", () => {
  beforeEach(() => {
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

  it("renders an embedded Google Maps preview when a public embed key is configured", () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY = "test-google-maps-embed-key";

    const { container, root } = renderNode(createElement(PropertyDetailGoogleMapsCard, { property: createProperty() }));
    const iframe = container.querySelector("iframe");

    expect(container.textContent).toContain("Ubicacion en Google Maps");
    expect(iframe?.getAttribute("src")).toContain("test-google-maps-embed-key");
    expect(iframe?.getAttribute("title")).toBe("Google Maps preview");

    act(() => {
      root.unmount();
    });
  });

  it("renders the fallback copy and outbound Google Maps link when embed preview is unavailable", () => {
    const { container, root } = renderNode(createElement(PropertyDetailGoogleMapsCard, { property: createProperty() }));
    const link = container.querySelector("a");

    expect(container.querySelector("iframe")).toBeNull();
    expect(container.textContent).toContain("El preview embebido no esta disponible");
    expect(link?.getAttribute("href")).toContain("google.com/maps");

    act(() => {
      root.unmount();
    });
  });
});
