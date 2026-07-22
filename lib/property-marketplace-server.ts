import "server-only";

import { Connection, PublicKey } from "@solana/web3.js";

import {
  clonePropertyDetail,
  mapCreateInputToPropertyDetail
} from "@/lib/marketplace/property-row-mapper";
import { readPersistedMarketplaceEntries } from "@/lib/marketplace/property-read-repository";
import {
  insertMarketplacePropertyEntry,
  type CreateMarketplaceEntryPersistentInput
} from "@/lib/marketplace/property-write-repository";
import {
  filterMarketplacePropertyDetails,
  listMarketplacePropertyCitiesFromRecords,
  mapMarketplaceMapEntries,
  mapMarketplacePropertyListItems
} from "@/lib/marketplace/property-selectors";
import {
  createRpcErrorMarketplacePropertySyncStatus,
  createUnavailableMarketplacePropertySyncStatus,
  persistMarketplacePropertySyncStatus,
  type MarketplacePropertyRealtimeSyncStatus
} from "@/lib/marketplace/property-sync-status";
import { recordOperabilityLog } from "@/lib/observability";
import { getSolanaRpcUrl } from "@/lib/infrastructure/solana";
import {
  listPropertyDetailsSnapshot,
  PropertyRpcError,
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

async function resolveMarketplacePropertyRealtimeSyncStatus(property: PropertyDetail): Promise<MarketplacePropertyRealtimeSyncStatus> {
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

    return createUnavailableMarketplacePropertySyncStatus(property);
  } catch {
    return createRpcErrorMarketplacePropertySyncStatus(property);
  }
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
  return mapMarketplacePropertyListItems(filterMarketplacePropertyDetails(records, filters));
}

export async function listMarketplaceMapEntries(filters: PropertyFilters): Promise<MarketplaceMapPinSource[]> {
  const records = await readMarketplaceRecordsForServer();
  return mapMarketplaceMapEntries(filterMarketplacePropertyDetails(records, filters));
}

export async function listMarketplacePropertyCities(): Promise<string[]> {
  const records = await readMarketplaceRecordsForServer();
  return listMarketplacePropertyCitiesFromRecords(records);
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

  const realtime = await resolveMarketplacePropertyRealtimeSyncStatus(property);
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
    await persistMarketplacePropertySyncStatus({
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
