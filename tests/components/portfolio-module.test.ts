// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({
  useI18n: vi.fn()
}));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

vi.mock("next/image", () => ({
  default: (props: { alt?: string; src?: string; className?: string }) => createElement("img", props)
}));

import { PortfolioModule } from "@/features/investor-portfolio/presentation/portfolio-module";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderModule(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(PortfolioModule));
  });

  return { container, root };
}

function createPortfolioResponse(overrides: Record<string, unknown> = {}): Response {
  return {
    ok: true,
    json: async () => ({
      ok: true,
      data: {
        walletPublicKey: "Wallet111",
        accountStatus: "wallet_bound",
        positions: [
          {
            collectionAddress: "CollectionAAA",
            propertyId: "property-a",
            propertyTitle: "Fix & Flip Alpha",
            locationLabel: "Bogota, CO",
            imageUrl: null,
            nftIds: ["Asset111", "Asset222"],
            nftIdPreview: ["Asset111", "Asset222"],
            ownedQuantity: 2,
            supplyTotal: 100,
            projectOwnershipPct: 2,
            purchasePriceUsd: 500,
            purchasePriceSource: "marketplace_listing_usd",
            estimatedYieldPct: 12.5,
            yieldSource: "marketplace_projected_net_roi",
            statusCounts: {
              readyToStake: 1,
              readyToUnstake: 1,
              syncPending: 0,
              unsupported: 0
            },
            documents: [
              {
                id: "brochure",
                label: "Brochure",
                url: "https://example.com/brochure.pdf"
              }
            ]
          }
        ],
        summary: {
          positionCount: 1,
          totalOwnedQuantity: 2,
          knownProjectOwnershipPctSum: 2,
          knownPurchasePriceUsd: 500
        },
        dataQuality: {
          status: "ready",
          degradedSources: [],
          refreshedAt: "2026-06-06T00:00:00.000Z"
        },
        ...overrides
      }
    })
  } as Response;
}

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("features/investor-portfolio/presentation/portfolio-module", () => {
  beforeEach(() => {
    localeMocks.useI18n.mockReturnValue({
      locale: "en",
      setLocale: vi.fn(),
      t: (text: { en: string }) => text.en
    });
    vi.stubGlobal("fetch", vi.fn(async () => createPortfolioResponse()));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("loads real protected portfolio data and renders one card per collection", async () => {
    const { container, root } = renderModule();

    await flush();

    expect(fetch).toHaveBeenCalledWith("/api/protected/portfolio", {
      method: "GET",
      cache: "no-store"
    });
    expect(container.querySelectorAll("[data-testid='portfolio-position-card']")).toHaveLength(1);
    expect(container.textContent).toContain("Fix & Flip Alpha");
    expect(container.textContent).toContain("Asset111");
    expect(container.textContent).toContain("Asset222");
    expect(container.textContent).toContain("2 NFTs");
    expect(container.textContent).toContain("2.00%");
    expect(container.textContent).toContain("$500.00");
    expect(container.textContent).toContain("12.50%");
    expect(container.textContent).toContain("Marketplace listing");
    expect(container.textContent).not.toContain("Torre Magnolia Medellin");
    expect(container.textContent).not.toContain("Vista Mar Cartagena");
    expect(container.textContent).not.toContain("$8,500.00");

    act(() => {
      root.unmount();
    });
  });

  it("renders empty state from the server DTO without mock portfolio cards", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => createPortfolioResponse({
      positions: [],
      summary: {
        positionCount: 0,
        totalOwnedQuantity: 0,
        knownProjectOwnershipPctSum: 0,
        knownPurchasePriceUsd: 0
      },
      dataQuality: {
        status: "empty",
        degradedSources: [],
        refreshedAt: "2026-06-06T00:00:00.000Z"
      }
    })));

    const { container, root } = renderModule();

    await flush();

    expect(container.textContent).toContain("No BRIDS portfolio positions yet");
    expect(container.querySelectorAll("[data-testid='portfolio-position-card']")).toHaveLength(0);

    act(() => {
      root.unmount();
    });
  });

  it("renders wallet required state from protected portfolio DTO", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => createPortfolioResponse({
      walletPublicKey: null,
      accountStatus: "wallet_required",
      positions: [],
      dataQuality: {
        status: "wallet_required",
        degradedSources: [],
        refreshedAt: "2026-06-06T00:00:00.000Z"
      }
    })));

    const { container, root } = renderModule();

    await flush();

    expect(container.textContent).toContain("Wallet required");
    expect(container.textContent).not.toContain("Torre Magnolia Medellin");

    act(() => {
      root.unmount();
    });
  });

  it("keeps long NFT identifiers inside responsive portfolio cards", async () => {
    const { container, root } = renderModule();

    await flush();

    const card = container.querySelector("[data-testid='portfolio-position-card']");
    const nftIds = container.querySelectorAll("[data-testid='portfolio-nft-id']");

    expect(card?.className).toContain("min-w-0");
    expect(card?.className).toContain("overflow-hidden");
    expect(nftIds).toHaveLength(2);
    for (const nftId of nftIds) {
      expect(nftId.className).toContain("break-all");
    }

    act(() => {
      root.unmount();
    });
  });
});
