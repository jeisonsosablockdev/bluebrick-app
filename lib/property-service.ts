import type {
  CollectionBootstrapGoogleMapsPlace,
  CollectionBootstrapImageItem
} from "@/lib/admin/collection-bootstrap-mapper";

export type ListingStatus = "active" | "funding" | "sold-out";
export type BlockchainSyncStatus = "available" | "unavailable" | "rpc_error";

export type PropertyDocument = {
  id: string;
  label: string;
  url: string;
};

export type PropertyInvestment = {
  supplyTotal: number;
  mintedOrSold: number;
  nftPriceUsd: number;
  annualRoiPct: number;
  availabilityLabel: string;
};

export type PropertyProject = {
  stage: string;
  developerName: string;
  exitStrategy: string;
  durationMonths: number | null;
};

export type PropertyEconomics = {
  purchasePriceUsd: number | null;
  afterRepairValueUsd: number | null;
  rehabBudgetUsd: number | null;
  closingCostsUsd: number | null;
  holdingCostsUsd: number | null;
  sellingCostsUsd: number | null;
  totalProjectCostUsd: number | null;
  minimumCapitalRequiredUsd: number | null;
  structuringFeeUsd: number | null;
  grossProfitProjectedUsd: number | null;
  managementFeeUsd: number | null;
  brokerFeeUsd: number | null;
  netInvestorProfitUsd: number | null;
  projectedNetRoiPct: number | null;
};

export type PropertyGovernance = {
  riskNotes: string;
};

export type PropertyBlockchainInfo = {
  network: "Solana Devnet";
  collectionAddress: string;
  assetMintAddress: string;
  explorerUrl: string;
  lastOnchainUpdate: string | null;
  syncStatus: BlockchainSyncStatus;
};

export type PropertyDetail = {
  id: string;
  title: string;
  city: string;
  country: string;
  postalCode: string | null;
  locationLabel: string;
  geoLat?: number | null;
  geoLng?: number | null;
  googleMapsPlace?: CollectionBootstrapGoogleMapsPlace | null;
  listingStatus: ListingStatus;
  image: string;
  galleryImages: CollectionBootstrapImageItem[];
  propertyImages: CollectionBootstrapImageItem[];
  shortDescription: string;
  detailedLocation: string;
  highlights: string[];
  investmentNotes: string;
  investment: PropertyInvestment;
  project: PropertyProject;
  economics: PropertyEconomics;
  governance: PropertyGovernance;
  documents: PropertyDocument[];
  blockchain: PropertyBlockchainInfo;
};

export type PropertyListItem = Pick<
  PropertyDetail,
  "id" | "title" | "locationLabel" | "listingStatus" | "image"
> & {
  nftPriceUsd: number;
  annualRoiPct: number;
  minimumCapitalRequiredUsd: number | null;
  projectDurationMonths: number | null;
};

export type PropertyFilters = {
  search?: string;
  city?: string;
  status?: ListingStatus;
  minRoi?: number;
};

export type CreateMarketplaceEntryInput = {
  id: string;
  title: string;
  city: string;
  country: string;
  stateProvince?: string | null;
  postalCode?: string | null;
  listingStatus: ListingStatus;
  image: string;
  shortDescription: string;
  detailedLocation: string;
  geoLat?: number | null;
  geoLng?: number | null;
  googleMapsPlace?: CollectionBootstrapGoogleMapsPlace | null;
  galleryImages?: CollectionBootstrapImageItem[];
  propertyImages?: CollectionBootstrapImageItem[];
  highlights: string[];
  investmentNotes: string;
  supplyTotal: number;
  mintedOrSold: number;
  nftPriceUsd: number;
  annualRoiPct: number;
  availabilityLabel: string;
  project: PropertyProject;
  economics: PropertyEconomics;
  governance: PropertyGovernance;
  documents: Array<{
    label: string;
    url: string;
  }>;
  collectionAddress: string;
  assetMintAddress: string;
  explorerUrl: string;
  lastOnchainUpdate: string | null;
  syncStatus: BlockchainSyncStatus;
};

export function createEmptyPropertyEconomics(): PropertyEconomics {
  return {
    purchasePriceUsd: null,
    afterRepairValueUsd: null,
    rehabBudgetUsd: null,
    closingCostsUsd: null,
    holdingCostsUsd: null,
    sellingCostsUsd: null,
    totalProjectCostUsd: null,
    minimumCapitalRequiredUsd: null,
    structuringFeeUsd: null,
    grossProfitProjectedUsd: null,
    managementFeeUsd: null,
    brokerFeeUsd: null,
    netInvestorProfitUsd: null,
    projectedNetRoiPct: null
  };
}

export class PropertyRpcError extends Error {
  constructor(message = "Blockchain RPC unavailable.") {
    super(message);
    this.name = "PropertyRpcError";
  }
}

const PROPERTY_RECORDS_SEED: PropertyDetail[] = [
  {
    id: "central-norte",
    title: "Edificio Central Norte",
    city: "Bogota",
    country: "CO",
    postalCode: null,
    locationLabel: "Bogota, CO",
    geoLat: null,
    geoLng: null,
    googleMapsPlace: null,
    listingStatus: "active",
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200&auto=format&fit=crop",
    galleryImages: [],
    propertyImages: [],
    shortDescription: "Activo residencial en zona de alta demanda con renta estabilizada.",
    detailedLocation: "Calle 93 #12-40, Bogota, Colombia",
    highlights: ["82 unidades habitacionales", "95% ocupacion", "Contratos renovados en 2026"],
    investmentNotes: "Distribucion mensual de ingresos segun fraccion NFT.",
    investment: {
      supplyTotal: 10000,
      mintedOrSold: 7200,
      nftPriceUsd: 120,
      annualRoiPct: 12.8,
      availabilityLabel: "Disponible"
    },
    project: {
      stage: "operating",
      developerName: "Bricks Operations",
      exitStrategy: "hold",
      durationMonths: null
    },
    economics: {
      ...createEmptyPropertyEconomics(),
      minimumCapitalRequiredUsd: 120000,
      projectedNetRoiPct: 12.8
    },
    governance: {
      riskNotes: "Distribucion mensual de ingresos segun fraccion NFT."
    },
    documents: [
      { id: "prospectus", label: "Prospecto de inversion", url: "https://example.com/docs/central-norte/prospecto.pdf" },
      { id: "legal", label: "Documentacion legal", url: "https://example.com/docs/central-norte/legal.pdf" },
      { id: "dd", label: "Due diligence", url: "https://example.com/docs/central-norte/dd.pdf" }
    ],
    blockchain: {
      network: "Solana Devnet",
      collectionAddress: "CN8fDPDrZf82D9QHcVNt6nBx1hmg8nAZhCtSgPxKrj7",
      assetMintAddress: "7N8dP2mAKtXh3VxH2QtYK8moJeb6Y6uYj6LxF7XnV9tC",
      explorerUrl: "https://explorer.solana.com/address/CN8fDPDrZf82D9QHcVNt6nBx1hmg8nAZhCtSgPxKrj7?cluster=devnet",
      lastOnchainUpdate: "2026-03-04T15:30:00Z",
      syncStatus: "available"
    }
  },
  {
    id: "marberia",
    title: "Complejo Marberia",
    city: "Medellin",
    country: "CO",
    postalCode: null,
    locationLabel: "Medellin, CO",
    geoLat: null,
    geoLng: null,
    googleMapsPlace: null,
    listingStatus: "funding",
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop",
    galleryImages: [],
    propertyImages: [],
    shortDescription: "Complejo mixto con crecimiento de ocupacion en etapa de funding.",
    detailedLocation: "Carrera 43A #7-50, Medellin, Colombia",
    highlights: ["120 locales y apartamentos", "Fase 2 de rehabilitacion", "Cap rate objetivo 11.4%"],
    investmentNotes: "La oferta actual prioriza inversionistas tempranos.",
    investment: {
      supplyTotal: 14000,
      mintedOrSold: 3900,
      nftPriceUsd: 95,
      annualRoiPct: 11.4,
      availabilityLabel: "Funding abierto"
    },
    project: {
      stage: "rehabilitation",
      developerName: "Marberia Capital",
      exitStrategy: "sale",
      durationMonths: 14
    },
    economics: {
      ...createEmptyPropertyEconomics(),
      minimumCapitalRequiredUsd: 95000,
      projectedNetRoiPct: 11.4
    },
    governance: {
      riskNotes: "La oferta actual prioriza inversionistas tempranos."
    },
    documents: [
      { id: "prospectus", label: "Prospecto de inversion", url: "https://example.com/docs/marberia/prospecto.pdf" },
      { id: "legal", label: "Documentacion legal", url: "https://example.com/docs/marberia/legal.pdf" },
      { id: "pitch", label: "Material informativo", url: "https://example.com/docs/marberia/overview.pdf" }
    ],
    blockchain: {
      network: "Solana Devnet",
      collectionAddress: "8cV2BrJ8G8M9cFqQ2jN6hU7F4kX1R4j5s3nYp3dA2oD9",
      assetMintAddress: "9Tw2d6dWJ9mZxKFh75S1yRk8k2sQx8C4zxK7Q7W6N5fB",
      explorerUrl: "https://explorer.solana.com/address/8cV2BrJ8G8M9cFqQ2jN6hU7F4kX1R4j5s3nYp3dA2oD9?cluster=devnet",
      lastOnchainUpdate: null,
      syncStatus: "unavailable"
    }
  },
  {
    id: "torre-rio",
    title: "Torre del Rio",
    city: "CDMX",
    country: "MX",
    postalCode: null,
    locationLabel: "CDMX, MX",
    geoLat: null,
    geoLng: null,
    googleMapsPlace: null,
    listingStatus: "sold-out",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=1200&auto=format&fit=crop",
    galleryImages: [],
    propertyImages: [],
    shortDescription: "Activo completamente distribuido a holders con historial de pago estable.",
    detailedLocation: "Paseo de la Reforma 380, CDMX, Mexico",
    highlights: ["100% tokens emitidos", "Flujo de caja consolidado", "Auditoria financiera completada"],
    investmentNotes: "No disponible para nuevas compras primarias.",
    investment: {
      supplyTotal: 9000,
      mintedOrSold: 9000,
      nftPriceUsd: 140,
      annualRoiPct: 13.2,
      availabilityLabel: "Sold out"
    },
    project: {
      stage: "closed",
      developerName: "Torre Rio Asset Co.",
      exitStrategy: "sale",
      durationMonths: null
    },
    economics: {
      ...createEmptyPropertyEconomics(),
      minimumCapitalRequiredUsd: 140000,
      projectedNetRoiPct: 13.2
    },
    governance: {
      riskNotes: "No disponible para nuevas compras primarias."
    },
    documents: [
      { id: "prospectus", label: "Prospecto de inversion", url: "https://example.com/docs/torre-rio/prospecto.pdf" },
      { id: "legal", label: "Documentacion legal", url: "https://example.com/docs/torre-rio/legal.pdf" },
      { id: "dd", label: "Due diligence", url: "https://example.com/docs/torre-rio/dd.pdf" }
    ],
    blockchain: {
      network: "Solana Devnet",
      collectionAddress: "3v7N9x6S4k2QfL8h6J1cT9wM3rB5qH2aV7nD9zR4uP8",
      assetMintAddress: "4kD7sQ5mL2hG8pN1vR9fX3tZ6jB2wC8yM5uQ1nT4eR7",
      explorerUrl: "https://explorer.solana.com/address/3v7N9x6S4k2QfL8h6J1cT9wM3rB5qH2aV7nD9zR4uP8?cluster=devnet",
      lastOnchainUpdate: "2026-03-03T09:18:00Z",
      syncStatus: "rpc_error"
    }
  },
  {
    id: "boston-harbor-house",
    title: "Boston Harbor House",
    city: "Boston",
    country: "US",
    postalCode: null,
    locationLabel: "Boston, MA, US",
    geoLat: 42.3601,
    geoLng: -71.0589,
    googleMapsPlace: null,
    listingStatus: "active",
    image: "https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1200&auto=format&fit=crop",
    galleryImages: [],
    propertyImages: [],
    shortDescription: "U.S. waterfront asset positioned for the discovery-style marketplace map.",
    detailedLocation: "Seaport District, Boston, MA, United States",
    highlights: ["Waterfront visibility", "Core U.S. market", "High-traffic location"],
    investmentNotes: "Seed listing used to exercise the USA-only map surface locally.",
    investment: {
      supplyTotal: 2000,
      mintedOrSold: 500,
      nftPriceUsd: 180,
      annualRoiPct: 10.2,
      availabilityLabel: "Available"
    },
    project: {
      stage: "operating",
      developerName: "Harbor Street Partners",
      exitStrategy: "hold",
      durationMonths: 18
    },
    economics: {
      ...createEmptyPropertyEconomics(),
      minimumCapitalRequiredUsd: 125000,
      projectedNetRoiPct: 10.2
    },
    governance: {
      riskNotes: "Seed listing used to validate USA-only map rendering and hover focus."
    },
    documents: [
      { id: "prospectus", label: "Prospectus", url: "https://example.com/docs/boston-harbor-house/prospectus.pdf" },
      { id: "legal", label: "Legal package", url: "https://example.com/docs/boston-harbor-house/legal.pdf" },
      { id: "dd", label: "Due diligence", url: "https://example.com/docs/boston-harbor-house/dd.pdf" }
    ],
    blockchain: {
      network: "Solana Devnet",
      collectionAddress: "J3zJVmhaam33CrheptWxJxLHGFCN5VfeRLtWeqFngXna",
      assetMintAddress: "Fjg92YY2WDxndECYD42QLj477YitJUnetb1bnMQsQKsJ",
      explorerUrl: "https://explorer.solana.com/address/J3zJVmhaam33CrheptWxJxLHGFCN5VfeRLtWeqFngXna?cluster=devnet",
      lastOnchainUpdate: "2026-05-28T18:00:00Z",
      syncStatus: "available"
    }
  }
];

function clonePropertyDetail(detail: PropertyDetail): PropertyDetail {
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

function createLocationLabel(city: string, country: string): string {
  return `${city}, ${country}`;
}

function toDocumentId(label: string, index: number): string {
  const normalized = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || `document-${index + 1}`;
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

const propertyRecordsStore: PropertyDetail[] = PROPERTY_RECORDS_SEED.map(clonePropertyDetail);

export function listPropertyDetailsSnapshot(): PropertyDetail[] {
  return propertyRecordsStore.map(clonePropertyDetail);
}

export function createMarketplacePropertyEntry(input: CreateMarketplaceEntryInput): PropertyDetail {
  const alreadyExists = propertyRecordsStore.some((property) => property.id === input.id);
  if (alreadyExists) {
    throw new Error("A marketplace entry with this id already exists.");
  }

  const record: PropertyDetail = {
    id: input.id,
    title: input.title,
    city: input.city,
    country: input.country,
    postalCode: input.postalCode ?? null,
    locationLabel: createLocationLabel(input.city, input.country),
    geoLat: input.geoLat ?? null,
    geoLng: input.geoLng ?? null,
    googleMapsPlace: input.googleMapsPlace ?? null,
    listingStatus: input.listingStatus,
    image: input.image,
    galleryImages: input.galleryImages?.map((item) => ({ ...item })) ?? [],
    propertyImages: input.propertyImages?.map((item) => ({ ...item })) ?? [],
    shortDescription: input.shortDescription,
    detailedLocation: input.detailedLocation,
    highlights: input.highlights,
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

  propertyRecordsStore.unshift(record);
  return clonePropertyDetail(record);
}

export function listPropertyCities(): string[] {
  return Array.from(new Set(propertyRecordsStore.map((property) => property.city))).sort((a, b) => a.localeCompare(b));
}

export function listProperties(filters: PropertyFilters): PropertyListItem[] {
  return mapListItems(filterPropertyDetails(propertyRecordsStore, filters));
}

export function getPropertyDetail(id: string): PropertyDetail | null {
  const found = propertyRecordsStore.find((property) => property.id === id);
  return found ? clonePropertyDetail(found) : null;
}

export function getPropertyDetailOrThrowRpc(id: string): PropertyDetail | null {
  const property = getPropertyDetail(id);

  if (!property) {
    return null;
  }

  if (property.blockchain.syncStatus === "rpc_error") {
    throw new PropertyRpcError("No se pudo sincronizar la informacion blockchain. Intenta nuevamente.");
  }

  return property;
}
