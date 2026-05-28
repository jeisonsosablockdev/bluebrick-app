// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({
  useI18n: vi.fn()
}));

const walletMocks = vi.hoisted(() => ({
  useWallet: vi.fn()
}));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: walletMocks.useWallet
}));

import { StakeModule } from "@/components/dashboard/stake-module";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function createJsonResponse(payload: unknown): Response {
  return {
    ok: true,
    json: async () => payload
  } as Response;
}

function renderModule(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(StakeModule));
  });

  return { container, root };
}

describe("components/dashboard/stake-module", () => {
  beforeEach(() => {
    localeMocks.useI18n.mockReturnValue({
      locale: "en",
      setLocale: vi.fn(),
      t: (text: { en: string }) => text.en
    });

    walletMocks.useWallet.mockReturnValue({
      connected: true,
      publicKey: {
        toBase58: () => "Wallet11111111111111111111111111111111111"
      },
      signTransaction: vi.fn(async (tx: unknown) => tx)
    });

    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("/api/protected/stake/assets")) {
        return createJsonResponse({
          ok: true,
          data: {
            walletPublicKey: "Wallet11111111111111111111111111111111111",
            items: [
              {
                assetAddress: "Asset111",
                propertyId: "property-1",
                propertyTitle: "Torre Magnolia Medellin",
                collectionAddress: "Collection111",
                candyMachineAddress: "Candy111",
                displayName: "Fraction #1",
                imageUrl: null,
                visibleState: "ready_to_stake",
                action: "Stake",
                isFrozen: false,
                syncPending: false
              },
              {
                assetAddress: "Asset222",
                propertyId: "property-2",
                propertyTitle: "Vista Mar Cartagena",
                collectionAddress: "Collection222",
                candyMachineAddress: "Candy222",
                displayName: "Fraction #2",
                imageUrl: null,
                visibleState: "ready_to_unstake",
                action: "Unstake",
                isFrozen: true,
                syncPending: false
              }
            ]
          }
        });
      }

      return createJsonResponse({ ok: true, data: {} });
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("renders only server-authoritative BRIDS assets with the correct actions", async () => {
    const { container, root } = renderModule();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Torre Magnolia Medellin");
    expect(container.textContent).toContain("Vista Mar Cartagena");
    expect(container.textContent).toContain("Stake");
    expect(container.textContent).toContain("Unstake");

    act(() => {
      root.unmount();
    });
  });
});

