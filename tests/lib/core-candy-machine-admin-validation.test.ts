import { describe, expect, it } from "vitest";

import {
  buildDefaultAppDataEconomicV1,
  isCoreCandyMachineAdminInputError,
  prepareCoreCandyMachineDeploy,
  prepareCoreCandyMachineMint,
  validateAppDataEconomicV1
} from "@/features/nft-minting/application/core-candy-machine-admin";

describe("features/nft-minting/application/core-candy-machine-admin validation", () => {
  it("validates AppData economic payload v1", () => {
    const payload = validateAppDataEconomicV1({
      revenue_share_bps: 2500,
      yield_bps: 1200,
      yield_mode: "cap",
      locked_at: 1711584000,
      eligible_from: 1714176000,
      earning_start_ts: 1714176000,
      distribution_enabled: true,
      economic_version: "v1",
      last_updated_at: 1714177000,
      updated_by: "admin_or_program"
    });

    expect(payload.economic_version).toBe("v1");
    expect(payload.yield_mode).toBe("cap");
  });

  it("rejects AppData economic payload when yield_mode is invalid", () => {
    let captured: unknown = null;

    try {
      validateAppDataEconomicV1({
        revenue_share_bps: 2500,
        yield_bps: 1200,
        yield_mode: "unknown",
        locked_at: 1711584000,
        eligible_from: 1714176000,
        earning_start_ts: 1714176000,
        distribution_enabled: true,
        economic_version: "v1",
        last_updated_at: 1714177000,
        updated_by: "admin_or_program"
      });
    } catch (error) {
      captured = error;
    }

    expect(isCoreCandyMachineAdminInputError(captured)).toBe(true);
    expect((captured as Error).message).toBe("appDataEconomic.yield_mode must be one of: cap, linear.");
  });

  it("rejects AppData economic payload when unknown keys are included", () => {
    let captured: unknown = null;

    try {
      validateAppDataEconomicV1({
        revenue_share_bps: 2500,
        yield_bps: 1200,
        yield_mode: "cap",
        distribution_enabled: true,
        economic_version: "v1",
        last_updated_at: 1714177000,
        updated_by: "admin_or_program",
        malicious_field: "unexpected"
      });
    } catch (error) {
      captured = error;
    }

    expect(isCoreCandyMachineAdminInputError(captured)).toBe(true);
    expect((captured as Error).message).toContain("appDataEconomic contains unsupported keys");
  });

  it("accepts AppData economic payload when optional lifecycle timestamps are omitted", () => {
    const payload = validateAppDataEconomicV1({
      revenue_share_bps: 2500,
      yield_bps: 1200,
      yield_mode: "cap",
      distribution_enabled: true,
      economic_version: "v1",
      last_updated_at: 1714177000,
      updated_by: "admin_or_program"
    });

    expect(payload.locked_at).toBeUndefined();
    expect(payload.eligible_from).toBeUndefined();
    expect(payload.earning_start_ts).toBeUndefined();
  });

  it("builds default AppData payload from env overrides", () => {
    const previousRevenueShare = process.env.APPDATA_ECON_REVENUE_SHARE_BPS;
    const previousYieldMode = process.env.APPDATA_ECON_YIELD_MODE;
    const previousDistributionEnabled = process.env.APPDATA_ECON_DISTRIBUTION_ENABLED;
    process.env.APPDATA_ECON_REVENUE_SHARE_BPS = "3000";
    process.env.APPDATA_ECON_YIELD_MODE = "linear";
    process.env.APPDATA_ECON_DISTRIBUTION_ENABLED = "false";

    try {
      const payload = buildDefaultAppDataEconomicV1("admin");
      expect(payload.revenue_share_bps).toBe(3000);
      expect(payload.yield_mode).toBe("linear");
      expect(payload.distribution_enabled).toBe(false);
      expect(payload.economic_version).toBe("v1");
    } finally {
      if (previousRevenueShare === undefined) {
        delete process.env.APPDATA_ECON_REVENUE_SHARE_BPS;
      } else {
        process.env.APPDATA_ECON_REVENUE_SHARE_BPS = previousRevenueShare;
      }

      if (previousYieldMode === undefined) {
        delete process.env.APPDATA_ECON_YIELD_MODE;
      } else {
        process.env.APPDATA_ECON_YIELD_MODE = previousYieldMode;
      }

      if (previousDistributionEnabled === undefined) {
        delete process.env.APPDATA_ECON_DISTRIBUTION_ENABLED;
      } else {
        process.env.APPDATA_ECON_DISTRIBUTION_ENABLED = previousDistributionEnabled;
      }
    }
  });

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

  it("fails deploy prepare when SQUADS_TRANSFER_AUTHORITY is not a valid public key", async () => {
    const previousSquadsFreezeAuthority = process.env.SQUADS_FREEZE_AUTHORITY;
    const previousSquadsTransferAuthority = process.env.SQUADS_TRANSFER_AUTHORITY;
    process.env.SQUADS_FREEZE_AUTHORITY = "11111111111111111111111111111111";
    process.env.SQUADS_TRANSFER_AUTHORITY = "invalid-transfer-delegate";
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
      if (previousSquadsFreezeAuthority === undefined) {
        delete process.env.SQUADS_FREEZE_AUTHORITY;
      } else {
        process.env.SQUADS_FREEZE_AUTHORITY = previousSquadsFreezeAuthority;
      }

      if (previousSquadsTransferAuthority === undefined) {
        delete process.env.SQUADS_TRANSFER_AUTHORITY;
      } else {
        process.env.SQUADS_TRANSFER_AUTHORITY = previousSquadsTransferAuthority;
      }
    }

    expect(isCoreCandyMachineAdminInputError(captured)).toBe(true);
    expect((captured as Error).message).toBe("SQUADS_TRANSFER_AUTHORITY must be a valid Solana public key.");
  });

  it("fails deploy prepare when SQUADS_TRANSFER_AUTHORITY is missing", async () => {
    const previousSquadsFreezeAuthority = process.env.SQUADS_FREEZE_AUTHORITY;
    const previousSquadsTransferAuthority = process.env.SQUADS_TRANSFER_AUTHORITY;
    process.env.SQUADS_FREEZE_AUTHORITY = "11111111111111111111111111111111";
    delete process.env.SQUADS_TRANSFER_AUTHORITY;
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
      if (previousSquadsFreezeAuthority === undefined) {
        delete process.env.SQUADS_FREEZE_AUTHORITY;
      } else {
        process.env.SQUADS_FREEZE_AUTHORITY = previousSquadsFreezeAuthority;
      }

      if (previousSquadsTransferAuthority === undefined) {
        delete process.env.SQUADS_TRANSFER_AUTHORITY;
      } else {
        process.env.SQUADS_TRANSFER_AUTHORITY = previousSquadsTransferAuthority;
      }
    }

    expect(isCoreCandyMachineAdminInputError(captured)).toBe(true);
    expect((captured as Error).message).toBe("SQUADS_TRANSFER_AUTHORITY is required.");
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
    const previousSquadsTransferAuthority = process.env.SQUADS_TRANSFER_AUTHORITY;
    process.env.SQUADS_FREEZE_AUTHORITY = "11111111111111111111111111111111";
    process.env.SQUADS_TRANSFER_AUTHORITY = "11111111111111111111111111111111";
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
      expect(prepared.freezePolicy.permanentTransferDelegateAuthority).toBe("11111111111111111111111111111111");
      expect(prepared.freezePolicy.ownerFreezeDelegateEnabled).toBe(true);
    } finally {
      if (previousSquadsAuthority === undefined) {
        delete process.env.SQUADS_FREEZE_AUTHORITY;
      } else {
        process.env.SQUADS_FREEZE_AUTHORITY = previousSquadsAuthority;
      }

      if (previousSquadsTransferAuthority === undefined) {
        delete process.env.SQUADS_TRANSFER_AUTHORITY;
      } else {
        process.env.SQUADS_TRANSFER_AUTHORITY = previousSquadsTransferAuthority;
      }
    }
  }, 30_000);

  it("fails deploy prepare when assetUri exceeds strict config-line byte limit", async () => {
    const previousSquadsAuthority = process.env.SQUADS_FREEZE_AUTHORITY;
    const previousSquadsTransferAuthority = process.env.SQUADS_TRANSFER_AUTHORITY;
    process.env.SQUADS_FREEZE_AUTHORITY = "11111111111111111111111111111111";
    process.env.SQUADS_TRANSFER_AUTHORITY = "11111111111111111111111111111111";
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

      if (previousSquadsTransferAuthority === undefined) {
        delete process.env.SQUADS_TRANSFER_AUTHORITY;
      } else {
        process.env.SQUADS_TRANSFER_AUTHORITY = previousSquadsTransferAuthority;
      }
    }

    expect(isCoreCandyMachineAdminInputError(captured)).toBe(true);
    expect((captured as Error).message).toBe("assetUri exceeds max UTF-8 byte length (200).");
  });

  it("packs add-config-lines aggressively for constant asset metadata URIs", async () => {
    const previousSquadsAuthority = process.env.SQUADS_FREEZE_AUTHORITY;
    const previousSquadsTransferAuthority = process.env.SQUADS_TRANSFER_AUTHORITY;
    process.env.SQUADS_FREEZE_AUTHORITY = "11111111111111111111111111111111";
    process.env.SQUADS_TRANSFER_AUTHORITY = "11111111111111111111111111111111";
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

      if (previousSquadsTransferAuthority === undefined) {
        delete process.env.SQUADS_TRANSFER_AUTHORITY;
      } else {
        process.env.SQUADS_TRANSFER_AUTHORITY = previousSquadsTransferAuthority;
      }
    }
  }, 30_000);
});
