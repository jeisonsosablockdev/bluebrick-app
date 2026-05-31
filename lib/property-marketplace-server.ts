import "server-only";

import { Connection, PublicKey } from "@solana/web3.js";

import { withDbClient } from "@/lib/db/pool";
import {
  clonePropertyDetail,
  mapCreateInputToPropertyDetail
} from "@/lib/marketplace/property-row-mapper";
import { readPersistedMarketplaceEntries } from "@/lib/marketplace/property-read-repository";
import {
  insertMarketplacePropertyEntry,
  type CreateMarketplaceEntryPersistentInput
} from "@/lib/marketplace/property-write-repository";
import { recordOperabilityLog } from "@/lib/observability";
import { getSolanaRpcUrl } from "@/lib/solana";
import {
  listPropertyDetailsSnapshot,
  PropertyRpcError,
  type BlockchainSyncStatus,
  type ListingStatus,
  type PropertyDetail,
  type PropertyFilters,
  type PropertyListItem
} from "@/lib/property-service";
import type { MarketplaceMapPinSource } from "@/lib/marketplace-map-pins";

export type { CreateMarketplaceEntryPersistentInput } from "@/lib/marketplace/property-write-repository";

export type MarketplaceRecordsResult = {
  status: "ok" | "degraded";
  source: "persisted" | "snapshot" | "empty";
  records: PropertyDetail[];
  errorCode?: "PERSISTED_MARKETPLACE_READ_FAILED";
};

function recordPersistedMarketplaceReadFailure(fallbackSource: MarketplaceRecordsResult["source"]): void {
  recordOperabilityLog({
    level: "warn",
    event: "marketplace.persisted_read_failed",
    message: "Marketplace persisted read failed; using fallback source.",
    context: {
      source: "persisted",
      fallbackSource,
      errorCode: "PERSISTED_MARKETPLACE_READ_FAILED"
    }
  });
}

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function toIsoOrNull(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

async function persistPropertySyncStatus(input: {
  id: string;
  syncStatus: BlockchainSyncStatus;
  lastOnchainUpdate: string | null;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  try {
    await withDbClient(async (client) => {
      await client.query(
        `UPDATE marketplace_entries
         SET sync_status = $2,
             last_onchain_update = $3
         WHERE id = $1`,
        [input.id, input.syncStatus, input.lastOnchainUpdate]
      );
    });
  } catch {
    // Best effort persistence: view rendering must not fail because sync metadata update failed.
  }
}

async function resolveRealtimeSyncStatus(property: PropertyDetail): Promise<{
  syncStatus: BlockchainSyncStatus;
  lastOnchainUpdate: string | null;
}> {
  try {
    const collectionAddress = new PublicKey(property.blockchain.collectionAddress);
    const candyMachineAddress = new PublicKey(property.blockchain.assetMintAddress);
    const connection = new Connection(getSolanaRpcUrl(), "confirmed");
    const [collectionAccount, candyMachineAccount] = await connection.getMultipleAccountsInfo(
      [collectionAddress, candyMachineAddress],
      "confirmed"
    );

    if (collectionAccount && candyMachineAccount) {
      return {
        syncStatus: "available",
        lastOnchainUpdate: new Date().toISOString()
      };
    }

    return {
      syncStatus: "unavailable",
      lastOnchainUpdate: toIsoOrNull(property.blockchain.lastOnchainUpdate)
    };
  } catch {
    return {
      syncStatus: "rpc_error",
      lastOnchainUpdate: toIsoOrNull(property.blockchain.lastOnchainUpdate)
    };
  }
}

function filterPropertyDetails(records: PropertyDetail[], filters: PropertyFilters): PropertyDetail[] {
  const normalizedSearch = filters.search?.trim().toLowerCase();

  return records.filter((property) => {
    if (normalizedSearch) {
      const inTitle = property.title.toLowerCase().includes(normalizedSearch);
      const inLocation = property.locationLabel.toLowerCase().includes(normalizedSearch);

      if (!inTitle && !inLocation) {
        return false;
      }
    }

    if (filters.city && property.city !== filters.city) {
      return false;
    }

    if (filters.status && property.listingStatus !== filters.status) {
      return false;
    }

    if (typeof filters.minRoi === "number" && property.investment.annualRoiPct < filters.minRoi) {
      return false;
    }

    return true;
  });
}

function mapListItems(records: PropertyDetail[]): PropertyListItem[] {
  return records.map((property) => ({
    id: property.id,
    title: property.title,
    locationLabel: property.locationLabel,
    listingStatus: property.listingStatus,
    image: property.image,
    nftPriceUsd: property.investment.nftPriceUsd,
    annualRoiPct: property.investment.annualRoiPct,
    minimumCapitalRequiredUsd: property.economics.minimumCapitalRequiredUsd,
    projectDurationMonths: property.project.durationMonths
  }));
}

export async function readMarketplaceRecordsResultForServer(): Promise<MarketplaceRecordsResult> {
  const persisted = await readPersistedMarketplaceEntries();
  if (persisted.records.length > 0) {
    return {
      status: "ok",
      source: "persisted",
      records: persisted.records
    };
  }

  const snapshot = listPropertyDetailsSnapshot();
  if (snapshot.length > 0) {
    if (persisted.degraded) {
      recordPersistedMarketplaceReadFailure("snapshot");
    }

    return {
      status: persisted.degraded ? "degraded" : "ok",
      source: "snapshot",
      records: snapshot,
      ...(persisted.errorCode ? { errorCode: persisted.errorCode } : {})
    };
  }

  if (persisted.degraded) {
    recordPersistedMarketplaceReadFailure("empty");
  }

  return {
    status: persisted.degraded ? "degraded" : "ok",
    source: "empty",
    records: [],
    ...(persisted.errorCode ? { errorCode: persisted.errorCode } : {})
  };
}

async function readMarketplaceRecordsForServer(): Promise<PropertyDetail[]> {
  const result = await readMarketplaceRecordsResultForServer();
  return result.records;
}

export async function createMarketplacePropertyEntryPersistent(input: CreateMarketplaceEntryPersistentInput): Promise<PropertyDetail> {
  await insertMarketplacePropertyEntry(input);
  return mapCreateInputToPropertyDetail(input);
}

export async function listMarketplaceProperties(filters: PropertyFilters): Promise<PropertyListItem[]> {
  const records = await readMarketplaceRecordsForServer();
  return mapListItems(filterPropertyDetails(records, filters));
}

export async function listMarketplaceMapEntries(filters: PropertyFilters): Promise<MarketplaceMapPinSource[]> {
  const records = await readMarketplaceRecordsForServer();

  return filterPropertyDetails(records, filters)
    .filter((property) => property.country.trim().toUpperCase() === "US")
    .filter((property) => property.geoLat !== null && property.geoLat !== undefined && property.geoLng !== null && property.geoLng !== undefined)
    .map((property) => ({
      id: property.id,
      title: property.title,
      locationLabel: property.locationLabel,
      country: property.country,
      geoLat: property.geoLat ?? null,
      geoLng: property.geoLng ?? null,
      supplyTotal: property.investment.supplyTotal,
      mintedOrSold: property.investment.mintedOrSold
    }));
}

export async function listMarketplacePropertyCities(): Promise<string[]> {
  const records = await readMarketplaceRecordsForServer();
  return Array.from(new Set(records.map((property) => property.city))).sort((a, b) => a.localeCompare(b));
}

export async function getMarketplacePropertyDetail(id: string): Promise<PropertyDetail | null> {
  const records = await readMarketplaceRecordsForServer();
  const found = records.find((property) => property.id === id);
  return found ? clonePropertyDetail(found) : null;
}

export async function getMarketplacePropertyDetailOrThrowRpc(id: string): Promise<PropertyDetail | null> {
  const property = await getMarketplacePropertyDetail(id);

  if (!property) {
    return null;
  }

  const realtime = await resolveRealtimeSyncStatus(property);
  const updatedProperty: PropertyDetail = {
    ...property,
    blockchain: {
      ...property.blockchain,
      syncStatus: realtime.syncStatus,
      lastOnchainUpdate: realtime.lastOnchainUpdate
    }
  };

  if (
    realtime.syncStatus !== property.blockchain.syncStatus
    || realtime.lastOnchainUpdate !== property.blockchain.lastOnchainUpdate
  ) {
    await persistPropertySyncStatus({
      id: property.id,
      syncStatus: realtime.syncStatus,
      lastOnchainUpdate: realtime.lastOnchainUpdate
    });
  }

  if (updatedProperty.blockchain.syncStatus === "rpc_error") {
    throw new PropertyRpcError("No se pudo sincronizar la informacion blockchain. Intenta nuevamente.");
  }

  return updatedProperty;
}
