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

const transactionMocks = vi.hoisted(() => ({
  deserializeLegacyVersionedTransaction: vi.fn(),
  serializeLegacyVersionedTransaction: vi.fn()
}));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: walletMocks.useWallet
}));

vi.mock("@/lib/solana-kit/compat/web3-transactions", () => ({
  deserializeLegacyVersionedTransaction: transactionMocks.deserializeLegacyVersionedTransaction,
  serializeLegacyVersionedTransaction: transactionMocks.serializeLegacyVersionedTransaction
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

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });

  return { promise, resolve };
}

function clickButton(container: HTMLElement, label: string): void {
  const button = Array.from(container.querySelectorAll("button")).find((candidate) => candidate.textContent?.includes(label));

  if (!button) {
    throw new Error(`Button not found: ${label}`);
  }

  button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
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

    transactionMocks.deserializeLegacyVersionedTransaction.mockReturnValue({ kind: "unsigned" });
    transactionMocks.serializeLegacyVersionedTransaction.mockReturnValue(new Uint8Array([1, 2, 3]));

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
    vi.useRealTimers();
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

  it("shows a card-level spinner while profile sync is pending", async () => {
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
                visibleState: "sync_pending",
                action: null,
                isFrozen: true,
                syncPending: true
              }
            ]
          }
        });
      }

      return createJsonResponse({ ok: true, data: {} });
    }));

    const { container, root } = renderModule();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Sync pending");
    expect(container.textContent).toContain("Syncing profile...");
    expect(container.textContent).not.toContain("No action available");
    expect(container.querySelector(".animate-spin")).not.toBeNull();

    act(() => {
      root.unmount();
    });
  });

  it("polls pending stake sync and updates the card without manual reload", async () => {
    vi.useFakeTimers();
    let assetRequests = 0;

    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("/api/protected/stake/assets")) {
        assetRequests += 1;

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
                visibleState: assetRequests === 1 ? "sync_pending" : "ready_to_unstake",
                action: assetRequests === 1 ? null : "Unstake",
                isFrozen: true,
                syncPending: assetRequests === 1
              }
            ]
          }
        });
      }

      return createJsonResponse({ ok: true, data: {} });
    }));

    const { container, root } = renderModule();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Sync pending");
    expect(container.textContent).toContain("Syncing profile...");

    await act(async () => {
      vi.advanceTimersByTime(4_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(assetRequests).toBe(2);
    expect(container.textContent).toContain("Ready to unstake");
    expect(container.textContent).toContain("Unstake");
    expect(container.textContent).not.toContain("Syncing profile...");

    act(() => {
      root.unmount();
    });
  });

  it("shows a blurred processing overlay while the wallet stake signature is pending", async () => {
    const signature = deferred<unknown>();
    walletMocks.useWallet.mockReturnValue({
      connected: true,
      publicKey: {
        toBase58: () => "Wallet11111111111111111111111111111111111"
      },
      signTransaction: vi.fn(() => signature.promise)
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
              }
            ]
          }
        });
      }

      if (url.includes("/api/protected/stake/prepare")) {
        return createJsonResponse({
          ok: true,
          data: {
            attemptId: "attempt-1",
            idempotencyKey: "idempotency-1",
            transactionBase64: "AA=="
          }
        });
      }

      return createJsonResponse({ ok: true, data: { attemptId: "attempt-1", txSignature: "sig-1" } });
    }));

    const { container, root } = renderModule();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    act(() => {
      clickButton(container, "Stake");
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      clickButton(container, "Confirm Stake");
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Processing on-chain action");
    expect(container.textContent).toContain("Stake Fraction #1");
    expect(container.textContent).toContain("Wait for your wallet to show the confirmation window");
    expect(container.querySelector(".blur-\\[2px\\]")).not.toBeNull();

    await act(async () => {
      signature.resolve({ kind: "signed" });
      await Promise.resolve();
      await Promise.resolve();
    });

    act(() => {
      root.unmount();
    });
  });

  it("dismisses the processing overlay after submit while inventory reload is still pending", async () => {
    const reload = deferred<Response>();
    let assetRequests = 0;

    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("/api/protected/stake/assets")) {
        assetRequests += 1;

        if (assetRequests > 1) {
          return reload.promise;
        }

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
              }
            ]
          }
        });
      }

      if (url.includes("/api/protected/stake/prepare")) {
        return createJsonResponse({
          ok: true,
          data: {
            attemptId: "attempt-1",
            idempotencyKey: "idempotency-1",
            transactionBase64: "AA=="
          }
        });
      }

      return createJsonResponse({ ok: true, data: { attemptId: "attempt-1", txSignature: "sig-1" } });
    }));

    const { container, root } = renderModule();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    act(() => {
      clickButton(container, "Stake");
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      clickButton(container, "Confirm Stake");
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(assetRequests).toBe(2);
    expect(container.textContent).toContain("Action submitted");
    expect(container.textContent).toContain("Sync pending");
    expect(container.querySelector("[aria-busy='true']")).toBeNull();
    expect(container.querySelector(".blur-\\[2px\\]")).toBeNull();

    act(() => {
      root.unmount();
    });
  });
});
