import "server-only";

import { Connection, PublicKey } from "@solana/web3.js";

import { withDbClient } from "@/lib/db/pool";
import { getSolanaRpcUrl } from "@/lib/solana";
import {
  createMarketplacePropertyEntry as createMarketplacePropertyEntryInMemory,
  listPropertyDetailsSnapshot,
  PropertyRpcError,
  type BlockchainSyncStatus,
  type CreateMarketplaceEntryInput,
  type ListingStatus,
  type PropertyDetail,
  type PropertyDocument,
  type PropertyFilters,
  type PropertyListItem
} from "@/lib/property-service";

export type CreateMarketplaceEntryPersistentInput = CreateMarketplaceEntryInput & {
  createdBy: string;
};

type PersistedMarketplaceRow = {
  id: string;
  title: string;
  city: string;
  country: string;
  location_label: string;
  listing_status: ListingStatus;
  image_url: string;
  short_description: string;
  detailed_location: string;
  highlights_json: unknown;
  investment_notes: string;
  supply_total: number;
  minted_or_sold: number;
  nft_price_usd: string | number;
  annual_roi_pct: string | number;
  availability_label: string;
  documents_json: unknown;
  collection_address: string;
  asset_mint_address: string;
  explorer_url: string;
  last_onchain_update: string | Date | null;
  sync_status: BlockchainSyncStatus;
};

type PersistedMarketplaceDocument = {
  id?: unknown;
  label?: unknown;
  url?: unknown;
};

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

function toJsonbValue(value: unknown): string {
  return JSON.stringify(value);
}

function toDocumentId(label: string, index: number): string {
  const normalized = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || `document-${index + 1}`;
}

function toSafeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseHighlightsJson(rawValue: unknown): string[] {
  if (!Array.isArray(rawValue)) {
    return [];
  }

  return rawValue
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function parseDocumentsJson(rawValue: unknown): PropertyDocument[] {
  if (!Array.isArray(rawValue)) {
    return [];
  }

  return rawValue
    .filter((item): item is PersistedMarketplaceDocument => Boolean(item) && typeof item === "object")
    .map((item, index) => {
      const label = typeof item.label === "string" ? item.label.trim() : "";
      const url = typeof item.url === "string" ? item.url.trim() : "";
      const fallbackId = toDocumentId(label || `document-${index + 1}`, index);
      const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : fallbackId;
      return { id, label, url };
    })
    .filter((item) => item.label.length > 0 && item.url.length > 0);
}

function mapPersistedRowToPropertyDetail(row: PersistedMarketplaceRow): PropertyDetail {
  return {
    id: row.id,
    title: row.title,
    city: row.city,
    country: row.country,
    locationLabel: row.location_label,
    listingStatus: row.listing_status,
    image: row.image_url,
    shortDescription: row.short_description,
    detailedLocation: row.detailed_location,
    highlights: parseHighlightsJson(row.highlights_json),
    investmentNotes: row.investment_notes,
    investment: {
      supplyTotal: Number(row.supply_total),
      mintedOrSold: Number(row.minted_or_sold),
      nftPriceUsd: toSafeNumber(row.nft_price_usd),
      annualRoiPct: toSafeNumber(row.annual_roi_pct),
      availabilityLabel: row.availability_label
    },
    documents: parseDocumentsJson(row.documents_json),
    blockchain: {
      network: "Solana Devnet",
      collectionAddress: row.collection_address,
      assetMintAddress: row.asset_mint_address,
      explorerUrl: row.explorer_url,
      lastOnchainUpdate:
        typeof row.last_onchain_update === "string"
          ? row.last_onchain_update
          : row.last_onchain_update instanceof Date
            ? row.last_onchain_update.toISOString()
            : null,
      syncStatus: row.sync_status
    }
  };
}

function clonePropertyDetail(detail: PropertyDetail): PropertyDetail {
  return {
    ...detail,
    highlights: [...detail.highlights],
    investment: { ...detail.investment },
    documents: detail.documents.map((document) => ({ ...document })),
    blockchain: { ...detail.blockchain }
  };
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
    annualRoiPct: property.investment.annualRoiPct
  }));
}

function mergePropertyRecords(primary: PropertyDetail[], secondary: PropertyDetail[]): PropertyDetail[] {
  const seen = new Set<string>();
  const merged: PropertyDetail[] = [];

  for (const property of [...primary, ...secondary]) {
    if (seen.has(property.id)) {
      continue;
    }

    seen.add(property.id);
    merged.push(clonePropertyDetail(property));
  }

  return merged;
}

async function readPersistedMarketplaceEntries(): Promise<PropertyDetail[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    return withDbClient(async (client) => {
      const result = await client.query<PersistedMarketplaceRow>(
        `SELECT
           id,
           title,
           city,
           country,
           location_label,
           listing_status,
           image_url,
           short_description,
           detailed_location,
           highlights_json,
           investment_notes,
           supply_total,
           minted_or_sold,
           nft_price_usd,
           annual_roi_pct,
           availability_label,
           documents_json,
           collection_address,
           asset_mint_address,
           explorer_url,
           last_onchain_update,
           sync_status
         FROM marketplace_entries
         ORDER BY created_at DESC`
      );

      return result.rows.map(mapPersistedRowToPropertyDetail);
    });
  } catch {
    return [];
  }
}

async function readMarketplaceRecordsForServer(): Promise<PropertyDetail[]> {
  const persisted = await readPersistedMarketplaceEntries();
  const inMemory = listPropertyDetailsSnapshot();
  return mergePropertyRecords(persisted, inMemory);
}

export async function createMarketplacePropertyEntryPersistent(input: CreateMarketplaceEntryPersistentInput): Promise<PropertyDetail> {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required to create marketplace entries.");
  }

  const documentsPayload = input.documents.map((document, index) => ({
    id: toDocumentId(document.label, index),
    label: document.label,
    url: document.url
  }));

  try {
    await withDbClient(async (client) => {
      await client.query(
        `INSERT INTO marketplace_entries (
           id,
           title,
           city,
           country,
           location_label,
           listing_status,
           image_url,
           short_description,
           detailed_location,
           highlights_json,
           investment_notes,
           supply_total,
           minted_or_sold,
           nft_price_usd,
           annual_roi_pct,
           availability_label,
           documents_json,
           collection_address,
           asset_mint_address,
           explorer_url,
           last_onchain_update,
           sync_status,
           created_by
         )
         VALUES (
           $1,
           $2,
           $3,
           $4,
           $5,
           $6,
           $7,
           $8,
           $9,
           $10,
           $11,
           $12,
           $13,
           $14,
           $15,
           $16,
           $17,
           $18,
           $19,
           $20,
           $21,
           $22,
           $23
         )`,
        [
          input.id,
          input.title,
          input.city,
          input.country,
          `${input.city}, ${input.country}`,
          input.listingStatus,
          input.image,
          input.shortDescription,
          input.detailedLocation,
          toJsonbValue(input.highlights),
          input.investmentNotes,
          input.supplyTotal,
          input.mintedOrSold,
          input.nftPriceUsd,
          input.annualRoiPct,
          input.availabilityLabel,
          toJsonbValue(documentsPayload),
          input.collectionAddress,
          input.assetMintAddress,
          input.explorerUrl,
          input.lastOnchainUpdate,
          input.syncStatus,
          input.createdBy
        ]
      );
    });
  } catch (error) {
    const maybePgError = error as { code?: string };
    if (maybePgError.code === "23505") {
      throw new Error("A marketplace entry with this id already exists.");
    }

    throw error;
  }

  return createMarketplacePropertyEntryInMemory(input);
}

export async function listMarketplaceProperties(filters: PropertyFilters): Promise<PropertyListItem[]> {
  const records = await readMarketplaceRecordsForServer();
  return mapListItems(filterPropertyDetails(records, filters));
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
