import { deriveAdminCanonicalLocationLabel } from "@/lib/admin/admin-collection-location-sync";
import {
  normalizeCollectionBootstrapGoogleMapsPlaceJson,
  normalizeCollectionBootstrapImageItemsJson
} from "@/lib/admin/collection-bootstrap-mapper";
import {
  createEmptyPropertyEconomics,
  type BlockchainSyncStatus,
  type CreateMarketplaceEntryInput,
  type ListingStatus,
  type PropertyDetail,
  type PropertyDocument,
  type PropertyEconomics,
  type PropertyGovernance,
  type PropertyProject
} from "@/lib/property-service";

export type PersistedMarketplaceRow = {
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
  gallery_images_json?: unknown;
  property_images_json?: unknown;
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

export function toMarketplaceDocumentId(label: string, index: number): string {
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
      const fallbackId = toMarketplaceDocumentId(label || `document-${index + 1}`, index);
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

export function mapPersistedRowToPropertyDetail(row: PersistedMarketplaceRow): PropertyDetail {
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
    galleryImages: normalizeCollectionBootstrapImageItemsJson(row.gallery_images_json, "gallery"),
    propertyImages: normalizeCollectionBootstrapImageItemsJson(row.property_images_json, "property"),
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

export function clonePropertyDetail(detail: PropertyDetail): PropertyDetail {
  return {
    ...detail,
    highlights: [...detail.highlights],
    investment: { ...detail.investment },
    project: { ...detail.project },
    economics: { ...detail.economics },
    governance: { ...detail.governance },
    googleMapsPlace: detail.googleMapsPlace ? { ...detail.googleMapsPlace } : null,
    galleryImages: detail.galleryImages.map((item) => ({ ...item })),
    propertyImages: detail.propertyImages.map((item) => ({ ...item })),
    documents: detail.documents.map((document) => ({ ...document })),
    blockchain: { ...detail.blockchain }
  };
}

export function mapCreateInputToPropertyDetail(input: CreateMarketplaceEntryInput): PropertyDetail {
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
    galleryImages: input.galleryImages?.map((item) => ({ ...item })) ?? [],
    propertyImages: input.propertyImages?.map((item) => ({ ...item })) ?? [],
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
      id: toMarketplaceDocumentId(document.label, index),
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
