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

vi.mock("@/features/marketplace/presentation/PurchaseCta", () => ({
  PurchaseCta: () => createElement("div", null, "purchase-cta")
}));

import { MarketplaceGridClient } from "@/features/marketplace/presentation/MarketplaceGridClient";
import type { PropertyDetail, PropertyListItem } from "@/lib/property-service";

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

const propertyListItem: PropertyListItem = {
  id: "lakeland-1",
  title: "Fix & Flip Lakeland",
  image: "/test.jpg",
  listingStatus: "active",
  locationLabel: "Lakeland, Florida, US",
  nftPriceUsd: 10.06,
  annualRoiPct: 18.5,
  minimumCapitalRequiredUsd: 110007,
  projectDurationMonths: 8
};

const propertyDetail: PropertyDetail = {
  id: propertyListItem.id,
  title: propertyListItem.title,
  city: "Lakeland",
  country: "US",
  postalCode: "33813",
  locationLabel: propertyListItem.locationLabel,
  geoLat: 28.0395,
  geoLng: -81.9498,
  googleMapsPlace: null,
  listingStatus: "active",
  image: propertyListItem.image,
  galleryImages: [],
  propertyImages: [],
  shortDescription: "Short description",
  detailedLocation: "6677 Engelake Dr, Lakeland, FL 33813",
  highlights: ["Highlight"],
  investmentNotes: "Notes",
  investment: {
    supplyTotal: 110,
    mintedOrSold: 0,
    nftPriceUsd: 10.06,
    annualRoiPct: 18.5,
    availabilityLabel: "Disponible"
  },
  economics: {
    projectedNetRoiPct: 18.5,
    purchasePriceUsd: 225000,
    afterRepairValueUsd: 425000,
    rehabBudgetUsd: 100000,
    closingCostsUsd: 0,
    holdingCostsUsd: 0,
    sellingCostsUsd: 0,
    totalProjectCostUsd: 325000,
    minimumCapitalRequiredUsd: 110007,
    structuringFeeUsd: 0,
    grossProfitProjectedUsd: 100000,
    managementFeeUsd: 0,
    brokerFeeUsd: 0,
    netInvestorProfitUsd: 85000
  },
  project: {
    stage: "Acquisition",
    developerName: "BRIDS",
    exitStrategy: "Sale",
    durationMonths: 8
  },
  governance: {
    riskNotes: "Risk notes"
  },
  documents: [],
  blockchain: {
    network: "Solana Devnet",
    collectionAddress: "collection",
    assetMintAddress: "mint",
    explorerUrl: "https://example.com",
    lastOnchainUpdate: "2026-05-28T00:00:00.000Z",
    syncStatus: "available"
  }
};

async function flushAsyncEffects(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("features/marketplace/presentation MarketplaceGridClient", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY = "test-google-maps-embed-key";
    localeMocks.useI18n.mockReturnValue({
      locale: "es",
      setLocale: vi.fn(),
      t: (text: { en: string; es: string; pt: string }) => text.es
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ data: propertyDetail }), { status: 200 }))
    );
  });

  afterEach(() => {
    document.body.innerHTML = "";
    document.body.removeAttribute("style");
    document.documentElement.removeAttribute("style");
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("contains the detail modal inside the veil and prevents background scroll", async () => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "visible";

    const { container, root } = renderNode(
      createElement(MarketplaceGridClient, {
        properties: [propertyListItem]
      })
    );

    const detailButton = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Ver detalle"));
    expect(detailButton).toBeTruthy();

    await act(async () => {
      detailButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flushAsyncEffects();

    const overlay = document.querySelector("[data-testid='marketplace-detail-modal-overlay']");
    const panel = document.querySelector("[data-testid='marketplace-detail-modal-panel']");

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(overlay?.parentElement).toBe(document.body);
    expect(overlay?.className).toContain("overflow-hidden");
    expect(panel?.className).toContain("max-h-[calc(100dvh-3rem)]");
    expect(panel?.className).toContain("overscroll-contain");
    expect(panel?.className).not.toContain("h-full");

    const closeButton = document.querySelector("button[aria-label='Cerrar modal']");
    await act(async () => {
      closeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.body.style.overflow).toBe("auto");
    expect(document.documentElement.style.overflow).toBe("visible");

    act(() => {
      root.unmount();
    });
  });
});
