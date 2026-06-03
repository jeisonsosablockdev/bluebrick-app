// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CoreCandyMachinePanel,
  isDeploySignatureConfirmedForCreateAsset
} from "@/components/admin/core-candy-machine-panel";

import type { ReactNode } from "react";

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    connected: true,
    publicKey: {
      toBase58: () => "AdminWallet111111111111111111111111111111111"
    },
    signTransaction: vi.fn(),
    signAllTransactions: undefined
  })
}));

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderNode(node: ReactNode): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(node);
  });

  return { container, root };
}

async function flushAsync(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("CoreCandyMachinePanel snapshot deploy gate", () => {
  beforeEach(() => {
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
    vi.useFakeTimers();
  });

  it("requires a real confirmed or finalized status before Create Asset snapshot finalization", () => {
    expect(isDeploySignatureConfirmedForCreateAsset(null)).toBe(false);
    expect(isDeploySignatureConfirmedForCreateAsset({
      confirmed: false,
      failed: false,
      confirmationStatus: null,
      observedByWebhook: true,
      source: "webhook"
    })).toBe(false);
    expect(isDeploySignatureConfirmedForCreateAsset({
      confirmed: false,
      failed: false,
      confirmationStatus: "processed",
      source: "rpc"
    })).toBe(false);
    expect(isDeploySignatureConfirmedForCreateAsset({
      confirmed: true,
      failed: false,
      confirmationStatus: "confirmed",
      source: "rpc"
    })).toBe(true);
    expect(isDeploySignatureConfirmedForCreateAsset({
      confirmed: false,
      failed: false,
      confirmationStatus: "finalized",
      source: "rpc"
    })).toBe(true);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("finalizes a verified snapshot before marking deploy completed for Create Asset", async () => {
    const eventOrder: string[] = [];
    const onSnapshotFinalized = vi.fn(() => {
      eventOrder.push("snapshot-finalized");
    });
    const onDeployCompleted = vi.fn(() => {
      eventOrder.push("deploy-completed");
    });
    const fetchCalls: string[] = [];

    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      fetchCalls.push(url);
      eventOrder.push(url);

      if (url === "/api/admin/core-candy-machine/metadata") {
        return new Response(JSON.stringify({
          collectionUri: "https://cdn.example.test/collection.json",
          assetUri: "https://cdn.example.test/asset.json"
        }), { status: 200 });
      }

      if (url === "/api/admin/core-candy-machine/deploy/prepare") {
        return new Response(JSON.stringify({
          deployId: "deploy-1",
          candyMachineAddress: "CandyMachine111111111111111111111111111111",
          collectionAddress: "Collection11111111111111111111111111111111",
          quantity: 1,
          paymentMode: "USDC",
          priceUsdcAtomic: 1000000,
          priceLamports: null,
          startDate: "2026-06-01T00:00:00.000Z",
          transactions: []
        }), { status: 200 });
      }

      if (url === "/api/admin/core-candy-machine/submit") {
        return new Response(JSON.stringify({ transactions: [] }), { status: 200 });
      }

      if (url === "/api/admin/core-candy-machine/status") {
        return new Response(JSON.stringify({ statuses: {} }), { status: 200 });
      }

      if (url === "/api/admin/core-candy-machine/snapshot/finalize") {
        return new Response(JSON.stringify({
          snapshotId: "snapshot-verified",
          mintJobId: "mint-job-1",
          verificationStatus: "verified",
          verificationMethod: "candy_machine_items_loaded",
          marketplaceHandoffStatus: "ready",
          expectedQuantity: 1,
          foundAssets: null,
          canCreateAsset: true,
          verificationError: null
        }), { status: 200 });
      }

      return new Response(JSON.stringify({ error: "Unexpected request" }), { status: 500 });
    }));

    const { container, root } = renderNode(createElement(CoreCandyMachinePanel, {
      prefill: {
        collectionName: "Fix & Flip Lakeland",
        assetNamePrefix: "Lakeland",
        imageUrl: "https://blob.example.test/admin-assets/gallery/lakeland.png",
        quantity: 1,
        nftPriceUsd: 1
      },
      snapshotContext: {
        draftId: "draft-lakeland",
        formSnapshot: {
          assetName: "Fix & Flip Lakeland"
        }
      },
      onSnapshotFinalized,
      onDeployCompleted
    }));

    await act(async () => {
      await flushAsync();
    });

    const deployButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Deploy")
    );

    expect(deployButton).toBeDefined();

    await act(async () => {
      deployButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flushAsync();
      await vi.advanceTimersByTimeAsync(2100);
      await flushAsync();
    });

    expect(fetchCalls).toContain("/api/admin/core-candy-machine/snapshot/finalize");
    expect(onSnapshotFinalized).toHaveBeenCalledWith(expect.objectContaining({
      snapshotId: "snapshot-verified",
      canCreateAsset: true
    }));
    expect(onDeployCompleted).toHaveBeenCalledWith(expect.objectContaining({
      candyMachineAddress: "CandyMachine111111111111111111111111111111",
      collectionAddress: "Collection11111111111111111111111111111111",
      quantity: 1
    }));
    expect(eventOrder.indexOf("/api/admin/core-candy-machine/status"))
      .toBeLessThan(eventOrder.indexOf("/api/admin/core-candy-machine/snapshot/finalize"));
    expect(eventOrder.indexOf("/api/admin/core-candy-machine/snapshot/finalize"))
      .toBeLessThan(eventOrder.indexOf("snapshot-finalized"));
    expect(eventOrder.indexOf("snapshot-finalized"))
      .toBeLessThan(eventOrder.indexOf("deploy-completed"));

    act(() => {
      root.unmount();
    });
  });

  it("blocks Create Asset completion when snapshot verification is not ready", async () => {
    const onSnapshotFinalized = vi.fn();
    const onDeployCompleted = vi.fn();

    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url === "/api/admin/core-candy-machine/metadata") {
        return new Response(JSON.stringify({
          collectionUri: "https://cdn.example.test/collection.json",
          assetUri: "https://cdn.example.test/asset.json"
        }), { status: 200 });
      }

      if (url === "/api/admin/core-candy-machine/deploy/prepare") {
        return new Response(JSON.stringify({
          deployId: "deploy-1",
          candyMachineAddress: "CandyMachine111111111111111111111111111111",
          collectionAddress: "Collection11111111111111111111111111111111",
          quantity: 1,
          paymentMode: "USDC",
          priceUsdcAtomic: 1000000,
          priceLamports: null,
          startDate: "2026-06-01T00:00:00.000Z",
          transactions: []
        }), { status: 200 });
      }

      if (url === "/api/admin/core-candy-machine/submit") {
        return new Response(JSON.stringify({ transactions: [] }), { status: 200 });
      }

      if (url === "/api/admin/core-candy-machine/status") {
        return new Response(JSON.stringify({ statuses: {} }), { status: 200 });
      }

      if (url === "/api/admin/core-candy-machine/snapshot/finalize") {
        return new Response(JSON.stringify({
          snapshotId: "snapshot-degraded",
          mintJobId: "mint-job-1",
          verificationStatus: "degraded",
          verificationMethod: "candy_machine_items_loaded",
          marketplaceHandoffStatus: "failed",
          expectedQuantity: 1,
          foundAssets: null,
          canCreateAsset: false,
          verificationError: {
            code: "MINT_PROOF_PENDING",
            message: "Mint proof status is not completed.",
            details: {}
          }
        }), { status: 200 });
      }

      return new Response(JSON.stringify({ error: "Unexpected request" }), { status: 500 });
    }));

    const { container, root } = renderNode(createElement(CoreCandyMachinePanel, {
      prefill: {
        collectionName: "Fix & Flip Lakeland",
        assetNamePrefix: "Lakeland",
        imageUrl: "https://blob.example.test/admin-assets/gallery/lakeland.png",
        quantity: 1,
        nftPriceUsd: 1
      },
      snapshotContext: {
        draftId: "draft-lakeland",
        formSnapshot: {
          assetName: "Fix & Flip Lakeland"
        }
      },
      onSnapshotFinalized,
      onDeployCompleted
    }));

    await act(async () => {
      await flushAsync();
    });

    const deployButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Deploy")
    );

    await act(async () => {
      deployButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flushAsync();
      await vi.advanceTimersByTimeAsync(2100);
      await flushAsync();
    });

    expect(onSnapshotFinalized).toHaveBeenCalledWith(expect.objectContaining({
      snapshotId: "snapshot-degraded",
      canCreateAsset: false
    }));
    expect(onDeployCompleted).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Mint proof status is not completed.");

    act(() => {
      root.unmount();
    });
  });
});
