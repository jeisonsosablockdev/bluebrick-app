import { describe, expect, it } from "vitest";

import {
  isCoreCandyMachineAdminInputError,
  prepareCoreCandyMachineDeploy,
  prepareCoreCandyMachineMint
} from "@/lib/core-candy-machine-admin";

describe("lib/core-candy-machine-admin validation", () => {
  it("fails deploy prepare with a clear input error when payerPublicKey is invalid", async () => {
    let captured: unknown = null;

    try {
      await prepareCoreCandyMachineDeploy({
        payerPublicKey: "not-a-solana-public-key",
        collectionName: "Collection",
        collectionUri: "ipfs://collection-cid",
        assetNamePrefix: "Asset",
        assetUri: "ipfs://asset-cid",
        quantity: 1,
        startDate: "2026-03-17T20:00:00.000Z"
      });
    } catch (error) {
      captured = error;
    }

    expect(isCoreCandyMachineAdminInputError(captured)).toBe(true);
    expect((captured as Error).message).toBe("payerPublicKey must be a valid Solana public key.");
  });

  it("fails mint prepare with a clear input error when candyMachineAddress is invalid", async () => {
    let captured: unknown = null;

    try {
      await prepareCoreCandyMachineMint({
        payerPublicKey: "11111111111111111111111111111111",
        candyMachineAddress: "invalid-candy-machine-address",
        collectionAddress: "11111111111111111111111111111111",
        quantity: 1
      });
    } catch (error) {
      captured = error;
    }

    expect(isCoreCandyMachineAdminInputError(captured)).toBe(true);
    expect((captured as Error).message).toBe("candyMachineAddress must be a valid Solana public key.");
  });

  it("fails deploy prepare with a clear input error when collectionName exceeds 32 chars", async () => {
    let captured: unknown = null;

    try {
      await prepareCoreCandyMachineDeploy({
        payerPublicKey: "11111111111111111111111111111111",
        collectionName: "Proyecto premium en zona estrategica AAA",
        collectionUri: "ipfs://collection-cid",
        assetNamePrefix: "Asset",
        assetUri: "ipfs://asset-cid",
        quantity: 1,
        startDate: "2026-03-17T20:00:00.000Z"
      });
    } catch (error) {
      captured = error;
    }

    expect(isCoreCandyMachineAdminInputError(captured)).toBe(true);
    expect((captured as Error).message).toBe("collectionName exceeds max length (32).");
  });

  it("packs add-config-lines aggressively for constant asset metadata URIs", async () => {
    const prepared = await prepareCoreCandyMachineDeploy({
      payerPublicKey: "11111111111111111111111111111111",
      collectionName: "Collection",
      collectionUri: "ipfs://bafycollectionmetadata",
      assetNamePrefix: "Fraction",
      assetUri: "ipfs://bafyassetmetadata",
      quantity: 825,
      startDate: "2026-03-17T20:00:00.000Z"
    });

    // Regression guard: previous non-optimized flow reached ~35 deploy tx for this range.
    expect(prepared.transactions.length).toBeLessThan(35);
  }, 15_000);
});
