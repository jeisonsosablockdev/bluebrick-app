import { withDbClient } from "@/features/shared/infrastructure/db/pool";
import type { BlockchainSyncStatus, PropertyDetail } from "@/lib/property-service";

export type MarketplacePropertyRealtimeSyncStatus = {
  syncStatus: BlockchainSyncStatus;
  lastOnchainUpdate: string | null;
};

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function toMarketplaceSyncIsoOrNull(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export async function persistMarketplacePropertySyncStatus(input: {
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

export function createUnavailableMarketplacePropertySyncStatus(property: PropertyDetail): MarketplacePropertyRealtimeSyncStatus {
  return {
    syncStatus: "unavailable",
    lastOnchainUpdate: toMarketplaceSyncIsoOrNull(property.blockchain.lastOnchainUpdate)
  };
}

export function createRpcErrorMarketplacePropertySyncStatus(property: PropertyDetail): MarketplacePropertyRealtimeSyncStatus {
  return {
    syncStatus: "rpc_error",
    lastOnchainUpdate: toMarketplaceSyncIsoOrNull(property.blockchain.lastOnchainUpdate)
  };
}
