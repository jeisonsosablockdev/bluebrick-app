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
        priceUsdcAtomic: 1_000_000,
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

  it("fails deploy prepare when SQUADS_FREEZE_AUTHORITY is not a valid public key", async () => {
    const previousSquadsAuthority = process.env.SQUADS_FREEZE_AUTHORITY;
    process.env.SQUADS_FREEZE_AUTHORITY = "invalid-freeze-delegate";
    let captured: unknown = null;

    try {
      await prepareCoreCandyMachineDeploy({
        payerPublicKey: "11111111111111111111111111111111",
        collectionName: "Collection",
        collectionUri: "ipfs://collection-cid",
        assetNamePrefix: "Asset",
        assetUri: "ipfs://asset-cid",
        quantity: 1,
        priceUsdcAtomic: 1_000_000,
        startDate: "2026-03-17T20:00:00.000Z"
      });
    } catch (error) {
      captured = error;
    } finally {
      if (previousSquadsAuthority === undefined) {
        delete process.env.SQUADS_FREEZE_AUTHORITY;
      } else {
        process.env.SQUADS_FREEZE_AUTHORITY = previousSquadsAuthority;
      }
    }

    expect(isCoreCandyMachineAdminInputError(captured)).toBe(true);
    expect((captured as Error).message).toBe("SQUADS_FREEZE_AUTHORITY must be a valid Solana public key.");
  });

  it("fails deploy prepare when SQUADS_FREEZE_AUTHORITY is missing", async () => {
    const previousSquadsAuthority = process.env.SQUADS_FREEZE_AUTHORITY;
    delete process.env.SQUADS_FREEZE_AUTHORITY;
    let captured: unknown = null;

    try {
      await prepareCoreCandyMachineDeploy({
        payerPublicKey: "11111111111111111111111111111111",
        collectionName: "Collection",
        collectionUri: "ipfs://collection-cid",
        assetNamePrefix: "Asset",
        assetUri: "ipfs://asset-cid",
        quantity: 1,
        priceUsdcAtomic: 1_000_000,
        startDate: "2026-03-17T20:00:00.000Z"
      });
    } catch (error) {
      captured = error;
    } finally {
      if (previousSquadsAuthority === undefined) {
        delete process.env.SQUADS_FREEZE_AUTHORITY;
      } else {
        process.env.SQUADS_FREEZE_AUTHORITY = previousSquadsAuthority;
      }
    }

    expect(isCoreCandyMachineAdminInputError(captured)).toBe(true);
    expect((captured as Error).message).toBe("SQUADS_FREEZE_AUTHORITY is required.");
  });

  it("fails mint prepare when enableOwnerFreezeDelegate is not a boolean", async () => {
    let captured: unknown = null;

    try {
      await prepareCoreCandyMachineMint({
        payerPublicKey: "11111111111111111111111111111111",
        candyMachineAddress: "11111111111111111111111111111111",
        collectionAddress: "11111111111111111111111111111111",
        quantity: 1,
        enableOwnerFreezeDelegate: "yes" as unknown as boolean
      });
    } catch (error) {
      captured = error;
    }

    expect(isCoreCandyMachineAdminInputError(captured)).toBe(true);
    expect((captured as Error).message).toBe("enableOwnerFreezeDelegate must be a boolean.");
  });

  it("auto-normalizes long source names instead of failing by length", async () => {
    const previousSquadsAuthority = process.env.SQUADS_FREEZE_AUTHORITY;
    process.env.SQUADS_FREEZE_AUTHORITY = "11111111111111111111111111111111";
    try {
      const prepared = await prepareCoreCandyMachineDeploy({
        payerPublicKey: "11111111111111111111111111111111",
        collectionName: "Proyecto premium en zona estrategica AAA con nombre extra largo y caracteres ###",
        collectionUri: "ipfs://collection-cid",
        assetNamePrefix: "Fraccion de inversion premium super extensa para dashboard",
        assetUri: "ipfs://asset-cid",
        quantity: 777,
        priceUsdcAtomic: 1_000_000,
        startDate: "2026-03-17T20:00:00.000Z"
      });

      expect(prepared.transactions.length).toBeGreaterThan(0);
      expect(prepared.freezePolicy.permanentFreezeDelegateAuthority).toBe("11111111111111111111111111111111");
      expect(prepared.freezePolicy.ownerFreezeDelegateEnabled).toBe(true);
    } finally {
      if (previousSquadsAuthority === undefined) {
        delete process.env.SQUADS_FREEZE_AUTHORITY;
      } else {
        process.env.SQUADS_FREEZE_AUTHORITY = previousSquadsAuthority;
      }
    }
  }, 30_000);

  it("fails deploy prepare when assetUri exceeds strict config-line byte limit", async () => {
    const previousSquadsAuthority = process.env.SQUADS_FREEZE_AUTHORITY;
    process.env.SQUADS_FREEZE_AUTHORITY = "11111111111111111111111111111111";
    const longUri = `https://example.com/${"a".repeat(260)}.json`;
    let captured: unknown = null;

    try {
      await prepareCoreCandyMachineDeploy({
        payerPublicKey: "11111111111111111111111111111111",
        collectionName: "Collection",
        collectionUri: "ipfs://collection-cid",
        assetNamePrefix: "Asset",
        assetUri: longUri,
        quantity: 1,
        priceUsdcAtomic: 1_000_000,
        startDate: "2026-03-17T20:00:00.000Z"
      });
    } catch (error) {
      captured = error;
    } finally {
      if (previousSquadsAuthority === undefined) {
        delete process.env.SQUADS_FREEZE_AUTHORITY;
      } else {
        process.env.SQUADS_FREEZE_AUTHORITY = previousSquadsAuthority;
      }
    }

    expect(isCoreCandyMachineAdminInputError(captured)).toBe(true);
    expect((captured as Error).message).toBe("assetUri exceeds max UTF-8 byte length (200).");
  });

  it("packs add-config-lines aggressively for constant asset metadata URIs", async () => {
    const previousSquadsAuthority = process.env.SQUADS_FREEZE_AUTHORITY;
    process.env.SQUADS_FREEZE_AUTHORITY = "11111111111111111111111111111111";
    try {
      const prepared = await prepareCoreCandyMachineDeploy({
        payerPublicKey: "11111111111111111111111111111111",
        collectionName: "Collection",
        collectionUri: "ipfs://bafycollectionmetadata",
        assetNamePrefix: "Fraction",
        assetUri: "ipfs://bafyassetmetadata",
        quantity: 825,
        priceUsdcAtomic: 1_000_000,
        startDate: "2026-03-17T20:00:00.000Z"
      });

      // Regression guard: previous non-optimized flow reached ~35 deploy tx for this range.
      expect(prepared.transactions.length).toBeLessThan(35);
    } finally {
      if (previousSquadsAuthority === undefined) {
        delete process.env.SQUADS_FREEZE_AUTHORITY;
      } else {
        process.env.SQUADS_FREEZE_AUTHORITY = previousSquadsAuthority;
      }
    }
  }, 30_000);
});
