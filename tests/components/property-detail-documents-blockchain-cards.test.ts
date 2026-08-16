// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({ useI18n: vi.fn() }));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

import { PropertyDetailDocumentsBlockchainCards } from "@/features/marketplace/presentation/PropertyDetailDocumentsBlockchainCards";

describe("PropertyDetailDocumentsBlockchainCards", () => {
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

  it("renders document links and blockchain metadata", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    act(() => {
      root.render(createElement(PropertyDetailDocumentsBlockchainCards, {
        documents: [{ id: "prospectus", label: "Prospectus", url: "https://example.com/prospectus.pdf" }],
        blockchain: {
          network: "Solana Devnet",
          collectionAddress: "collection-address",
          assetMintAddress: "mint-address",
          explorerUrl: "https://explorer.solana.com/address/mint",
          lastOnchainUpdate: "2026-05-30T15:00:00.000Z",
          syncStatus: "available"
        }
      }));
    });

    expect(container.textContent).toContain("Documents");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("https://example.com/prospectus.pdf");
    expect(container.textContent).toContain("Network: Solana Devnet");
    expect(container.textContent).toContain("Collection: collection-address");
    expect(container.textContent).toContain("Mint: mint-address");
    expect(container.textContent).toContain("Last on-chain update");
    expect(container.textContent).not.toContain("Blockchain data is not available yet");

    act(() => root.unmount());
  });

  it("renders unavailable blockchain state when sync status is unavailable", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    act(() => {
      root.render(createElement(PropertyDetailDocumentsBlockchainCards, {
        documents: [],
        blockchain: {
          network: "Solana Devnet",
          collectionAddress: "collection-address",
          assetMintAddress: "mint-address",
          explorerUrl: "https://explorer.solana.com/address/mint",
          lastOnchainUpdate: null,
          syncStatus: "unavailable"
        }
      }));
    });

    expect(container.textContent).toContain("Blockchain data is not available yet for this asset.");
    expect(container.textContent).toContain("Last on-chain update: Unavailable");

    act(() => root.unmount());
  });
});
