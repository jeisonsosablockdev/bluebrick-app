import "server-only";

import { Connection, PublicKey } from "@solana/web3.js";

import { deriveAdminCanonicalLocationLabel } from "@/lib/admin/admin-collection-location-sync";
import { normalizeCollectionBootstrapGoogleMapsPlaceJson } from "@/lib/admin/collection-bootstrap-mapper";
import { getMarketplaceEntryLocationColumnSupport } from "@/lib/admin/marketplace-entry-location-columns";
import { withDbClient } from "@/lib/db/pool";
import { getSolanaRpcUrl } from "@/lib/solana";
import {
  createEmptyPropertyEconomics,
  listPropertyDetailsSnapshot,
  PropertyRpcError,
  type BlockchainSyncStatus,
  type CreateMarketplaceEntryInput,
  type PropertyEconomics,
  type PropertyProject,
  type ListingStatus,
  type PropertyDetail,
  type PropertyDocument,
  type PropertyFilters,
  type PropertyGovernance,
  type PropertyListItem
} from "@/lib/property-service";
import type { MarketplaceMapPinSource } from "@/lib/marketplace-map-pins";

export type CreateMarketplaceEntryPersistentInput = CreateMarketplaceEntryInput & {
  createdBy: string;
};

type PersistedMarketplaceRow = {
  id: string;
  title: string;
  city: string;
  country: string;
  postal_code: string | null;
  location_label: string;
  geo_lat: number | string | null;
  geo_lng: number | string | null;
  google_maps_place_json: unknown;
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
  project_json: unknown;
  economics_json: unknown;
  governance_json: unknown;
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

type PersistedMarketplaceEconomics = Partial<Record<keyof PropertyEconomics, unknown>>;
type PersistedMarketplaceProject = Partial<Record<keyof PropertyProject, unknown>>;
type PersistedMarketplaceGovernance = Partial<Record<keyof PropertyGovernance, unknown>>;

export type MarketplaceRecordsResult = {
  status: "ok" | "degraded";
  source: "persisted" | "snapshot" | "empty";
  records: PropertyDetail[];
  errorCode?: "PERSISTED_MARKETPLACE_READ_FAILED";
};

type PersistedMarketplaceEntriesResult = {
  records: PropertyDetail[];
  degraded: boolean;
  errorCode?: "PERSISTED_MARKETPLACE_READ_FAILED";
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

function toOptionalFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" && !value.trim()) {
    return null;
  }

  const parsed = typeof value === "string" ? Number(value.trim()) : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

function parseProjectJson(rawValue: unknown): PropertyProject {
  if (!rawValue || typeof rawValue !== "object") {
    return {
      stage: "",
      developerName: "",
      exitStrategy: "",
      durationMonths: null
    };
  }

  const source = rawValue as PersistedMarketplaceProject;
  return {
    stage: typeof source.stage === "string" ? source.stage.trim() : "",
    developerName: typeof source.developerName === "string" ? source.developerName.trim() : "",
    exitStrategy: typeof source.exitStrategy === "string" ? source.exitStrategy.trim() : "",
    durationMonths: Number.isFinite(Number(source.durationMonths)) ? Number(source.durationMonths) : null
  };
}

function parseEconomicsJson(rawValue: unknown): PropertyEconomics {
  const fallback = createEmptyPropertyEconomics();
  if (!rawValue || typeof rawValue !== "object") {
    return fallback;
  }

  const source = rawValue as PersistedMarketplaceEconomics;
  return {
    purchasePriceUsd: Number.isFinite(Number(source.purchasePriceUsd)) ? Number(source.purchasePriceUsd) : null,
    afterRepairValueUsd: Number.isFinite(Number(source.afterRepairValueUsd)) ? Number(source.afterRepairValueUsd) : null,
    rehabBudgetUsd: Number.isFinite(Number(source.rehabBudgetUsd)) ? Number(source.rehabBudgetUsd) : null,
    closingCostsUsd: Number.isFinite(Number(source.closingCostsUsd)) ? Number(source.closingCostsUsd) : null,
    holdingCostsUsd: Number.isFinite(Number(source.holdingCostsUsd)) ? Number(source.holdingCostsUsd) : null,
    sellingCostsUsd: Number.isFinite(Number(source.sellingCostsUsd)) ? Number(source.sellingCostsUsd) : null,
    totalProjectCostUsd: Number.isFinite(Number(source.totalProjectCostUsd)) ? Number(source.totalProjectCostUsd) : null,
    minimumCapitalRequiredUsd: Number.isFinite(Number(source.minimumCapitalRequiredUsd)) ? Number(source.minimumCapitalRequiredUsd) : null,
    structuringFeeUsd: Number.isFinite(Number(source.structuringFeeUsd)) ? Number(source.structuringFeeUsd) : null,
    grossProfitProjectedUsd: Number.isFinite(Number(source.grossProfitProjectedUsd)) ? Number(source.grossProfitProjectedUsd) : null,
    managementFeeUsd: Number.isFinite(Number(source.managementFeeUsd)) ? Number(source.managementFeeUsd) : null,
    brokerFeeUsd: Number.isFinite(Number(source.brokerFeeUsd)) ? Number(source.brokerFeeUsd) : null,
    netInvestorProfitUsd: Number.isFinite(Number(source.netInvestorProfitUsd)) ? Number(source.netInvestorProfitUsd) : null,
    projectedNetRoiPct: Number.isFinite(Number(source.projectedNetRoiPct)) ? Number(source.projectedNetRoiPct) : null
  };
}

function parseGovernanceJson(rawValue: unknown, investmentNotes: string): PropertyGovernance {
  if (!rawValue || typeof rawValue !== "object") {
    return { riskNotes: investmentNotes };
  }

  const source = rawValue as PersistedMarketplaceGovernance;
  return {
    riskNotes: typeof source.riskNotes === "string" && source.riskNotes.trim()
      ? source.riskNotes.trim()
      : investmentNotes
  };
}

function mapPersistedRowToPropertyDetail(row: PersistedMarketplaceRow): PropertyDetail {
  return {
    id: row.id,
    title: row.title,
    city: row.city,
    country: row.country,
    postalCode: typeof row.postal_code === "string" && row.postal_code.trim() ? row.postal_code.trim() : null,
    locationLabel: row.location_label,
    geoLat: toOptionalFiniteNumber(row.geo_lat),
    geoLng: toOptionalFiniteNumber(row.geo_lng),
    googleMapsPlace: normalizeCollectionBootstrapGoogleMapsPlaceJson(row.google_maps_place_json),
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
    project: parseProjectJson(row.project_json),
    economics: parseEconomicsJson(row.economics_json),
    governance: parseGovernanceJson(row.governance_json, row.investment_notes),
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
    project: { ...detail.project },
    economics: { ...detail.economics },
    governance: { ...detail.governance },
    googleMapsPlace: detail.googleMapsPlace ? { ...detail.googleMapsPlace } : null,
    documents: detail.documents.map((document) => ({ ...document })),
    blockchain: { ...detail.blockchain }
  };
}

function mapCreateInputToPropertyDetail(input: CreateMarketplaceEntryInput): PropertyDetail {
  return {
    id: input.id,
    title: input.title,
    city: input.city,
    country: input.country,
    postalCode: input.postalCode ?? null,
    locationLabel: deriveAdminCanonicalLocationLabel({
      city: input.city,
      country: input.country,
      stateProvince: input.stateProvince ?? null,
      postalCode: input.postalCode ?? null
    }),
    geoLat: input.geoLat ?? null,
    geoLng: input.geoLng ?? null,
    googleMapsPlace: input.googleMapsPlace ?? null,
    listingStatus: input.listingStatus,
    image: input.image,
    shortDescription: input.shortDescription,
    detailedLocation: input.detailedLocation,
    highlights: [...input.highlights],
    investmentNotes: input.investmentNotes,
    investment: {
      supplyTotal: input.supplyTotal,
      mintedOrSold: input.mintedOrSold,
      nftPriceUsd: input.nftPriceUsd,
      annualRoiPct: input.annualRoiPct,
      availabilityLabel: input.availabilityLabel
    },
    project: { ...input.project },
    economics: { ...input.economics },
    governance: { ...input.governance },
    documents: input.documents.map((document, index) => ({
      id: toDocumentId(document.label, index),
      label: document.label,
      url: document.url
    })),
    blockchain: {
      network: "Solana Devnet",
      collectionAddress: input.collectionAddress,
      assetMintAddress: input.assetMintAddress,
      explorerUrl: input.explorerUrl,
      lastOnchainUpdate: input.lastOnchainUpdate,
      syncStatus: input.syncStatus
    }
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
    annualRoiPct: property.investment.annualRoiPct,
    minimumCapitalRequiredUsd: property.economics.minimumCapitalRequiredUsd,
    projectDurationMonths: property.project.durationMonths
  }));
}

async function readPersistedMarketplaceEntries(): Promise<PersistedMarketplaceEntriesResult> {
  if (!isDatabaseConfigured()) {
    return { records: [], degraded: false };
  }

  try {
    const records = await withDbClient(async (client) => {
      const support = await getMarketplaceEntryLocationColumnSupport(client);
      const result = await client.query<PersistedMarketplaceRow>(
        `SELECT
           id,
           title,
           city,
           country,
           ${support.postalCode ? "postal_code" : "NULL::text AS postal_code"},
           location_label,
           ${support.geoLat ? "geo_lat" : "NULL::double precision AS geo_lat"},
           ${support.geoLng ? "geo_lng" : "NULL::double precision AS geo_lng"},
           ${support.googleMapsPlaceJson ? "google_maps_place_json" : "NULL::jsonb AS google_maps_place_json"},
           listing_status,
           image_url,
           short_description,
           detailed_location,
           highlights_json,
           investment_notes,
           project_json,
           economics_json,
           governance_json,
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

    return { records, degraded: false };
  } catch {
    return {
      records: [],
      degraded: true,
      errorCode: "PERSISTED_MARKETPLACE_READ_FAILED"
    };
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
    return {
      status: persisted.degraded ? "degraded" : "ok",
      source: "snapshot",
      records: snapshot,
      ...(persisted.errorCode ? { errorCode: persisted.errorCode } : {})
    };
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
      const support = await getMarketplaceEntryLocationColumnSupport(client);
      const columns = [
        "id",
        "title",
        "city",
        "country",
        ...(support.stateProvince ? ["state_province"] : []),
        ...(support.postalCode ? ["postal_code"] : []),
        "location_label",
        "listing_status",
        "image_url",
        "short_description",
        "detailed_location",
        ...(support.geoLat ? ["geo_lat"] : []),
        ...(support.geoLng ? ["geo_lng"] : []),
        ...(support.googleMapsPlaceJson ? ["google_maps_place_json"] : []),
        "highlights_json",
        "investment_notes",
        "project_json",
        "economics_json",
        "governance_json",
        "supply_total",
        "minted_or_sold",
        "nft_price_usd",
        "annual_roi_pct",
        "availability_label",
        "documents_json",
        "collection_address",
        "asset_mint_address",
        "explorer_url",
        "last_onchain_update",
        "sync_status",
        "created_by"
      ];
      const values = [
        input.id,
        input.title,
        input.city,
        input.country,
        ...(support.stateProvince ? [input.stateProvince ?? null] : []),
        ...(support.postalCode ? [input.postalCode ?? null] : []),
        deriveAdminCanonicalLocationLabel({
          city: input.city,
          country: input.country,
          stateProvince: input.stateProvince ?? null,
          postalCode: input.postalCode ?? null
        }),
        input.listingStatus,
        input.image,
        input.shortDescription,
        input.detailedLocation,
        ...(support.geoLat ? [input.geoLat ?? null] : []),
        ...(support.geoLng ? [input.geoLng ?? null] : []),
        ...(support.googleMapsPlaceJson ? [input.googleMapsPlace ? toJsonbValue(input.googleMapsPlace) : null] : []),
        toJsonbValue(input.highlights),
        input.investmentNotes,
        toJsonbValue(input.project),
        toJsonbValue(input.economics),
        toJsonbValue(input.governance),
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
      ];

      await client.query(
        `INSERT INTO marketplace_entries (
           ${columns.join(",\n           ")}
         )
         VALUES (
           ${values.map((_, index) => `$${index + 1}`).join(",\n           ")}
         )`,
        values
      );
    });
  } catch (error) {
    const maybePgError = error as { code?: string };
    if (maybePgError.code === "23505") {
      throw new Error("A marketplace entry with this id already exists.");
    }

    throw error;
  }

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
