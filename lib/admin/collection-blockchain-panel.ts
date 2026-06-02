import "server-only";

import {
  deriveAssociatedTokenAddress,
  resolveUsdcMintAddress,
  resolveUsdcPaymentRecipient
} from "@/lib/candy-guard-payment-config";
import {
  validateAppDataEconomicV1,
  type AppDataEconomicV1
} from "@/lib/core-candy-machine-admin";
import { getPurchaseThirdPartySignerAddress } from "@/lib/purchase-third-party-signer";
import { withDbClient } from "@/lib/db/pool";

import type { AdminCollectionOwnership } from "@/lib/admin/collection-ownership";

type AssetMintSnapshotBlockchainRow = {
  blockchain_snapshot: unknown;
};

type AuthorityRegistryRow = {
  role: "transfer_delegate" | "appdata_authority";
  authority_pubkey: string;
};

export type AdminCollectionBlockchainPanel = {
  baseAddresses: {
    collectionAddress: string;
    candyMachineAddress: string;
    assetMintAddress: string | null;
  };
  authorities: {
    thirdPartySigner: string | null;
    freezeDelegate: string | null;
    transferDelegate: string | null;
    appdataAuthority: string | null;
  };
  guards: {
    startDateIso: string | null;
    tokenPaymentMint: string | null;
    tokenPaymentDestination: string | null;
  };
  appdata: {
    revenueShareBps: number | null;
    yieldBps: number | null;
    yieldMode: AppDataEconomicV1["yield_mode"] | null;
    lockedAt: number | null;
    eligibleFrom: number | null;
    earningStartTs: number | null;
    distributionEnabled: boolean | null;
    economicVersion: AppDataEconomicV1["economic_version"] | null;
    lastUpdatedAt: number | null;
    updatedBy: string | null;
  };
};

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function toOptionalTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function firstPresentAddress(values: unknown[]): string | null {
  for (const value of values) {
    const normalized = toOptionalTrimmedString(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function resolveAssetMintAddress(snapshot: unknown): string | null {
  const record = asRecord(snapshot);
  const assetRecord = asRecord(record.asset);
  const mintRecord = asRecord(record.mint);
  const firstMintedAsset = Array.isArray(record.mintedAssets) ? asRecord(record.mintedAssets[0]) : {};
  const firstAssetsItem = Array.isArray(record.assets) ? asRecord(record.assets[0]) : {};

  return firstPresentAddress([
    record.assetMintAddress,
    record.asset_mint_address,
    record.assetMint,
    record.mintAddress,
    record.assetAddress,
    assetRecord.mintAddress,
    assetRecord.address,
    mintRecord.address,
    mintRecord.mintAddress,
    firstMintedAsset.mintAddress,
    firstMintedAsset.address,
    firstAssetsItem.mintAddress,
    firstAssetsItem.address
  ]);
}

function buildFallbackPanel(ownership: AdminCollectionOwnership): AdminCollectionBlockchainPanel {
  return {
    baseAddresses: {
      collectionAddress: ownership.collectionAddress,
      candyMachineAddress: ownership.candyMachineAddress,
      assetMintAddress: null
    },
    authorities: {
      thirdPartySigner: null,
      freezeDelegate: null,
      transferDelegate: null,
      appdataAuthority: null
    },
    guards: {
      startDateIso: null,
      tokenPaymentMint: null,
      tokenPaymentDestination: null
    },
    appdata: buildEmptyAppdata()
  };
}

function buildEmptyAppdata(): AdminCollectionBlockchainPanel["appdata"] {
  return {
    revenueShareBps: null,
    yieldBps: null,
    yieldMode: null,
    lockedAt: null,
    eligibleFrom: null,
    earningStartTs: null,
    distributionEnabled: null,
    economicVersion: null,
    lastUpdatedAt: null,
    updatedBy: null
  };
}

function resolveFreezeDelegateAddress(): string | null {
  return toOptionalTrimmedString(process.env.SQUADS_FREEZE_AUTHORITY);
}

function resolveThirdPartySignerAddress(): string | null {
  try {
    return getPurchaseThirdPartySignerAddress();
  } catch {
    return null;
  }
}

function resolveAuthorityFallbacks(snapshot: unknown): Pick<
  AdminCollectionBlockchainPanel["authorities"],
  "thirdPartySigner" | "freezeDelegate"
> {
  const record = asRecord(snapshot);

  return {
    thirdPartySigner: firstPresentAddress([
      record.thirdPartySigner,
      record.third_party_signer,
      resolveThirdPartySignerAddress()
    ]),
    freezeDelegate: firstPresentAddress([
      record.freezeDelegate,
      record.freeze_delegate,
      resolveFreezeDelegateAddress()
    ])
  };
}

async function resolveGuardFallbacks(snapshot: unknown): Promise<AdminCollectionBlockchainPanel["guards"]> {
  const record = asRecord(snapshot);
  const tokenPayment = asRecord(record.tokenPayment);
  const mintAddress = firstPresentAddress([
    record.tokenPaymentMint,
    record.token_payment_mint,
    tokenPayment.mint,
    resolveUsdcMintAddress()
  ]);
  const fallbackDestination = mintAddress
    ? await deriveAssociatedTokenAddress(resolveUsdcPaymentRecipient(), mintAddress)
    : null;
  const destination = firstPresentAddress([
    record.tokenPaymentDestination,
    record.token_payment_destination,
    tokenPayment.destination,
    tokenPayment.destinationAta,
    fallbackDestination
  ]);

  return {
    startDateIso: firstPresentAddress([
      record.guardStartDateIso,
      record.startDateConfigured,
      record.startDateIso
    ]),
    tokenPaymentMint: mintAddress,
    tokenPaymentDestination: destination
  };
}

function resolveAppdataCandidates(snapshot: unknown): unknown[] {
  const record = asRecord(snapshot);
  const appData = asRecord(record.appData);
  const appdata = asRecord(record.appdata);
  const pluginData = asRecord(record.pluginData);
  const pluginSnapshot = asRecord(record.pluginSnapshot);
  const assetRecord = asRecord(record.asset);
  const assetAppData = asRecord(assetRecord.appData);
  const assetAppdata = asRecord(assetRecord.appdata);
  const adapters = [
    ...(Array.isArray(record.externalPluginAdapters) ? record.externalPluginAdapters : []),
    ...(Array.isArray(record.plugins) ? record.plugins : []),
    ...(Array.isArray(assetRecord.externalPluginAdapters) ? assetRecord.externalPluginAdapters : []),
    ...(Array.isArray(assetRecord.plugins) ? assetRecord.plugins : [])
  ];

  return [
    record.appDataEconomic,
    record.appdataEconomic,
    record.app_data_economic,
    record.appData,
    record.appdata,
    appData.economic,
    appData.payload,
    appdata.economic,
    appdata.payload,
    pluginData.appDataEconomic,
    pluginData.appdataEconomic,
    pluginSnapshot.appDataEconomic,
    pluginSnapshot.appdataEconomic,
    assetRecord.appDataEconomic,
    assetRecord.appdataEconomic,
    assetRecord.appData,
    assetRecord.appdata,
    assetAppData.economic,
    assetAppData.payload,
    assetAppdata.economic,
    assetAppdata.payload,
    ...adapters.flatMap((adapter) => {
      const adapterRecord = asRecord(adapter);
      const dataRecord = asRecord(adapterRecord.data);
      const valueRecord = asRecord(adapterRecord.value);
      const payloadRecord = asRecord(adapterRecord.payload);

      return [
        adapterRecord.appDataEconomic,
        adapterRecord.appdataEconomic,
        adapterRecord.appData,
        adapterRecord.appdata,
        dataRecord.appDataEconomic,
        dataRecord.appdataEconomic,
        dataRecord.appData,
        dataRecord.appdata,
        dataRecord.economic,
        valueRecord.appDataEconomic,
        valueRecord.appdataEconomic,
        valueRecord.appData,
        valueRecord.appdata,
        valueRecord.economic,
        payloadRecord.appDataEconomic,
        payloadRecord.appdataEconomic,
        payloadRecord.appData,
        payloadRecord.appdata,
        payloadRecord.economic
      ];
    })
  ];
}

function resolveAppdata(snapshot: unknown): AdminCollectionBlockchainPanel["appdata"] {
  for (const candidate of resolveAppdataCandidates(snapshot)) {
    try {
      const normalized = validateAppDataEconomicV1(candidate);
      return {
        revenueShareBps: normalized.revenue_share_bps,
        yieldBps: normalized.yield_bps,
        yieldMode: normalized.yield_mode,
        lockedAt: normalized.locked_at ?? null,
        eligibleFrom: normalized.eligible_from ?? null,
        earningStartTs: normalized.earning_start_ts ?? null,
        distributionEnabled: normalized.distribution_enabled,
        economicVersion: normalized.economic_version,
        lastUpdatedAt: normalized.last_updated_at,
        updatedBy: normalized.updated_by
      };
    } catch {
      continue;
    }
  }

  return buildEmptyAppdata();
}

export async function getAdminCollectionBlockchainPanel(
  ownership: AdminCollectionOwnership
): Promise<AdminCollectionBlockchainPanel> {
  const fallback = buildFallbackPanel(ownership);

  if (!isDatabaseConfigured()) {
    return fallback;
  }

  try {
    return await withDbClient(async (client) => {
      const result = await client.query<AssetMintSnapshotBlockchainRow>(
        `SELECT blockchain_snapshot
         FROM asset_mint_snapshots
         WHERE id = $1
         LIMIT 1`,
        [ownership.snapshotId]
      );

      const authorityResult = await client.query<AuthorityRegistryRow>(
        `SELECT role, authority_pubkey
         FROM authority_registry
         WHERE collection_address = $1
           AND role = ANY($2::text[])`,
        [ownership.collectionAddress, ["transfer_delegate", "appdata_authority"]]
      );

      const row = result.rows[0] ?? null;
      const authorityRows = authorityResult.rows;
      if (!row) {
        return {
          ...fallback,
          authorities: {
            ...fallback.authorities,
            thirdPartySigner: resolveThirdPartySignerAddress(),
            freezeDelegate: resolveFreezeDelegateAddress()
          },
          guards: await resolveGuardFallbacks({})
        };
      }

      const snapshotRecord = row.blockchain_snapshot;

      const authorityByRole = new Map(authorityRows.map((authority) => [authority.role, authority.authority_pubkey]));
      const authorityFallbacks = resolveAuthorityFallbacks(snapshotRecord);
      const guardFallbacks = await resolveGuardFallbacks(snapshotRecord);
      const appdata = resolveAppdata(snapshotRecord);

      return {
        baseAddresses: {
          collectionAddress: ownership.collectionAddress,
          candyMachineAddress: ownership.candyMachineAddress,
          assetMintAddress: resolveAssetMintAddress(snapshotRecord)
        },
        authorities: {
          thirdPartySigner: authorityFallbacks.thirdPartySigner,
          freezeDelegate: authorityFallbacks.freezeDelegate,
          transferDelegate: authorityByRole.get("transfer_delegate") ?? null,
          appdataAuthority: authorityByRole.get("appdata_authority") ?? null
        },
        guards: guardFallbacks,
        appdata
      };
    });
  } catch {
    return {
      ...fallback,
      authorities: {
        ...fallback.authorities,
        thirdPartySigner: resolveThirdPartySignerAddress(),
        freezeDelegate: resolveFreezeDelegateAddress()
      },
      guards: await resolveGuardFallbacks({}),
      appdata: buildEmptyAppdata()
    };
  }
}
