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
  locationLabel: string;
  listingStatus: ListingStatus;
  image: string;
  shortDescription: string;
  detailedLocation: string;
  highlights: string[];
  investmentNotes: string;
  investment: PropertyInvestment;
  documents: PropertyDocument[];
  blockchain: PropertyBlockchainInfo;
};

export type PropertyListItem = Pick<
  PropertyDetail,
  "id" | "title" | "locationLabel" | "listingStatus" | "image"
> & {
  nftPriceUsd: number;
  annualRoiPct: number;
};

export type PropertyFilters = {
  search?: string;
  city?: string;
  status?: ListingStatus;
  minRoi?: number;
};

export class PropertyRpcError extends Error {
  constructor(message = "Blockchain RPC unavailable.") {
    super(message);
    this.name = "PropertyRpcError";
  }
}

const PROPERTY_RECORDS: PropertyDetail[] = [
  {
    id: "central-norte",
    title: "Edificio Central Norte",
    city: "Bogota",
    country: "CO",
    locationLabel: "Bogota, CO",
    listingStatus: "active",
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200&auto=format&fit=crop",
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
    locationLabel: "Medellin, CO",
    listingStatus: "funding",
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop",
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
    locationLabel: "CDMX, MX",
    listingStatus: "sold-out",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=1200&auto=format&fit=crop",
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
  }
];

export const PROPERTY_CITIES = Array.from(new Set(PROPERTY_RECORDS.map((property) => property.city))).sort((a, b) => a.localeCompare(b));

export function listProperties(filters: PropertyFilters): PropertyListItem[] {
  const normalizedSearch = filters.search?.trim().toLowerCase();

  return PROPERTY_RECORDS.filter((property) => {
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
  }).map((property) => ({
    id: property.id,
    title: property.title,
    locationLabel: property.locationLabel,
    listingStatus: property.listingStatus,
    image: property.image,
    nftPriceUsd: property.investment.nftPriceUsd,
    annualRoiPct: property.investment.annualRoiPct
  }));
}

export function getPropertyDetail(id: string): PropertyDetail | null {
  return PROPERTY_RECORDS.find((property) => property.id === id) ?? null;
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
