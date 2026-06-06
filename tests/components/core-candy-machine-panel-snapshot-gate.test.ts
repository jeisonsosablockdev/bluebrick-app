// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CoreCandyMachinePanel,
  isDeploySignatureConfirmedForCreateAsset,
  waitForDeploySignatureStatuses
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

function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((resolver) => {
    resolve = resolver;
  });

  return { promise, resolve };
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

  it("polls deploy signature statuses with bounded retry helpers", async () => {
    const fetchStatuses = vi.fn()
      .mockRejectedValueOnce(new Error("temporary backend failure"))
      .mockResolvedValueOnce({
        "sig-1": {
          confirmed: true,
          failed: false,
          confirmationStatus: "confirmed"
        },
        "sig-2": {
          confirmed: false,
          failed: false,
          confirmationStatus: "processed"
        }
      })
      .mockResolvedValueOnce({
        "sig-1": {
          confirmed: true,
          failed: false,
          confirmationStatus: "confirmed"
        },
        "sig-2": {
          confirmed: false,
          failed: false,
          confirmationStatus: "finalized"
        }
      });

    const result = await waitForDeploySignatureStatuses(["sig-1", "sig-2"], {
      maxAttempts: 4,
      pollDelayMs: 0,
      sleep: async () => undefined,
      fetchStatuses
    });

    expect(result).toEqual({
      allConfirmed: true,
      hasFailedSignature: false,
      attempts: 3
    });
    expect(fetchStatuses).toHaveBeenCalledTimes(3);
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

  it("shows a post-deploy snapshot verification loading state while Create Asset remains blocked", async () => {
    const onSnapshotFinalized = vi.fn();
    const onDeployCompleted = vi.fn();
    const finalizeResponse = deferredResponse();

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
        return new Response(JSON.stringify({
          transactions: [{
            kind: "add-config-lines",
            serial: null,
            expectedAddress: "CandyMachine111111111111111111111111111111",
            signature: "sig-config-lines"
          }]
        }), { status: 200 });
      }

      if (url === "/api/admin/core-candy-machine/status") {
        return new Response(JSON.stringify({
          statuses: {
            "sig-config-lines": {
              confirmed: true,
              failed: false,
              confirmationStatus: "confirmed",
              source: "rpc"
            }
          }
        }), { status: 200 });
      }

      if (url === "/api/admin/core-candy-machine/snapshot/finalize") {
        return finalizeResponse.promise;
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

    expect(container.textContent).toContain("Deploy confirmed. Verifying the mint snapshot. Please wait; do not redeploy.");
    expect(container.textContent).toContain("Confirming deploy transactions");
    expect(container.textContent).toContain("Reading Candy Machine state");
    expect(container.textContent).toContain("Finalizing mint snapshot");
    expect(container.textContent).toContain("Preparing Create Asset gate");
    expect(deployButton).toHaveProperty("disabled", true);
    expect(onDeployCompleted).not.toHaveBeenCalled();

    await act(async () => {
      finalizeResponse.resolve(new Response(JSON.stringify({
        snapshotId: "snapshot-verified",
        mintJobId: "mint-job-1",
        verificationStatus: "verified",
        verificationMethod: "candy_machine_items_loaded",
        marketplaceHandoffStatus: "ready",
        expectedQuantity: 1,
        foundAssets: null,
        canCreateAsset: true,
        verificationError: null
      }), { status: 200 }));
      await flushAsync();
    });

    expect(onSnapshotFinalized).toHaveBeenCalledWith(expect.objectContaining({
      snapshotId: "snapshot-verified",
      canCreateAsset: true
    }));
    expect(onDeployCompleted).toHaveBeenCalledWith(expect.objectContaining({
      candyMachineAddress: "CandyMachine111111111111111111111111111111",
      collectionAddress: "Collection11111111111111111111111111111111",
      quantity: 1
    }));
    expect(container.textContent).toContain("Snapshot verified. Create Asset is ready.");

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
    expect(container.textContent).toContain("Snapshot re-check will run automatically in about 15 seconds.");

    act(() => {
      root.unmount();
    });
  });

  it("automatically re-checks a blocked snapshot without preparing or submitting another deploy", async () => {
    const onSnapshotFinalized = vi.fn();
    const onDeployCompleted = vi.fn();
    const fetchCalls: string[] = [];
    const finalizeBodies: unknown[] = [];
    let finalizeAttempts = 0;

    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      fetchCalls.push(url);

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
        finalizeAttempts += 1;
        finalizeBodies.push(JSON.parse(String(init?.body ?? "{}")));

        if (finalizeAttempts === 1) {
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
              code: "CONFIG_LINES_NOT_READY",
              message: "Candy Machine config lines are not visible yet.",
              details: {}
            }
          }), { status: 200 });
        }

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

    await act(async () => {
      deployButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flushAsync();
      await vi.advanceTimersByTimeAsync(2100);
      await flushAsync();
    });

    expect(onDeployCompleted).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Create Asset gate: blocked");
    expect(container.textContent).toContain("Candy Machine config lines are not visible yet.");
    expect(container.textContent).toContain("Snapshot re-check will run automatically in about 15 seconds.");
    expect(Array.from(container.querySelectorAll("button")).some((button) =>
      button.textContent?.includes("Re-check snapshot")
    )).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000);
      await flushAsync();
    });

    expect(finalizeAttempts).toBe(2);
    expect(fetchCalls.filter((url) => url === "/api/admin/core-candy-machine/deploy/prepare")).toHaveLength(1);
    expect(fetchCalls.filter((url) => url === "/api/admin/core-candy-machine/submit")).toHaveLength(1);
    expect(fetchCalls.filter((url) => url === "/api/admin/core-candy-machine/snapshot/finalize")).toHaveLength(2);
    expect(finalizeBodies[1]).toEqual(finalizeBodies[0]);
    expect(onSnapshotFinalized).toHaveBeenLastCalledWith(expect.objectContaining({
      snapshotId: "snapshot-verified",
      canCreateAsset: true
    }));
    expect(onDeployCompleted).toHaveBeenCalledWith(expect.objectContaining({
      candyMachineAddress: "CandyMachine111111111111111111111111111111",
      collectionAddress: "Collection11111111111111111111111111111111",
      quantity: 1
    }));
    expect(container.textContent).toContain("Create Asset gate: enabled");

    act(() => {
      root.unmount();
    });
  });

  it("retries snapshot finalization with confirmed deploy signatures without redeploying", async () => {
    const onSnapshotFinalized = vi.fn();
    const onDeployCompleted = vi.fn();
    let finalizeCalls = 0;
    let prepareCalls = 0;
    let submitCalls = 0;

    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url === "/api/admin/core-candy-machine/metadata") {
        return new Response(JSON.stringify({
          collectionUri: "https://cdn.example.test/collection.json",
          assetUri: "https://cdn.example.test/asset.json"
        }), { status: 200 });
      }

      if (url === "/api/admin/core-candy-machine/deploy/prepare") {
        prepareCalls += 1;
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
        submitCalls += 1;
        return new Response(JSON.stringify({
          transactions: [{
            kind: "add-config-lines",
            serial: null,
            expectedAddress: "CandyMachine111111111111111111111111111111",
            signature: "sig-config-lines"
          }]
        }), { status: 200 });
      }

      if (url === "/api/admin/core-candy-machine/status") {
        return new Response(JSON.stringify({
          statuses: {
            "sig-config-lines": {
              confirmed: true,
              failed: false,
              confirmationStatus: "confirmed",
              source: "rpc"
            }
          }
        }), { status: 200 });
      }

      if (url === "/api/admin/core-candy-machine/snapshot/finalize") {
        finalizeCalls += 1;

        if (finalizeCalls === 1) {
          return new Response(JSON.stringify({
            snapshotId: "snapshot-pending",
            mintJobId: "mint-job-1",
            verificationStatus: "failed",
            verificationMethod: "candy_machine_items_loaded",
            marketplaceHandoffStatus: "failed",
            expectedQuantity: 1,
            foundAssets: null,
            canCreateAsset: false,
            verificationError: {
              code: "DEPLOY_SIGNATURES_NOT_CONFIRMED",
              message: "Deploy signatures are not fully confirmed yet.",
              details: {}
            }
          }), { status: 200 });
        }

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

    await act(async () => {
      deployButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flushAsync();
      await vi.advanceTimersByTimeAsync(2100);
      await flushAsync();
    });

    expect(onSnapshotFinalized).toHaveBeenCalledWith(expect.objectContaining({
      snapshotId: "snapshot-pending",
      canCreateAsset: false
    }));
    expect(onDeployCompleted).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Deploy signatures are not fully confirmed yet.");

    const retryButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Retry snapshot")
    );

    expect(retryButton).toBeDefined();

    await act(async () => {
      retryButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flushAsync();
    });

    expect(prepareCalls).toBe(1);
    expect(submitCalls).toBe(1);
    expect(finalizeCalls).toBe(2);
    expect(onSnapshotFinalized).toHaveBeenLastCalledWith(expect.objectContaining({
      snapshotId: "snapshot-verified",
      canCreateAsset: true
    }));
    expect(onDeployCompleted).toHaveBeenCalledWith(expect.objectContaining({
      candyMachineAddress: "CandyMachine111111111111111111111111111111",
      collectionAddress: "Collection11111111111111111111111111111111",
      quantity: 1,
      signatures: [expect.objectContaining({
        kind: "add-config-lines",
        signature: "sig-config-lines"
      })]
    }));

    act(() => {
      root.unmount();
    });
  });

  it("preserves specific snapshot retry errors instead of replacing them with generic fallback", async () => {
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
        return new Response(JSON.stringify({
          transactions: [{
            kind: "add-config-lines",
            serial: null,
            expectedAddress: "CandyMachine111111111111111111111111111111",
            signature: "sig-config-lines"
          }]
        }), { status: 200 });
      }

      if (url === "/api/admin/core-candy-machine/status") {
        return new Response(JSON.stringify({
          statuses: {
            "sig-config-lines": {
              confirmed: true,
              failed: false,
              confirmationStatus: "confirmed",
              source: "rpc"
            }
          }
        }), { status: 200 });
      }

      if (url === "/api/admin/core-candy-machine/snapshot/finalize") {
        return new Response(JSON.stringify({
          error: "Expected 110 Candy Machine config lines but found 96 loaded on-chain."
        }), { status: 500 });
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

    expect(onSnapshotFinalized).not.toHaveBeenCalled();
    expect(onDeployCompleted).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Expected 110 Candy Machine config lines but found 96 loaded on-chain.");
    expect(container.textContent).not.toContain("Mint snapshot could not be verified.");

    act(() => {
      root.unmount();
    });
  });
});
