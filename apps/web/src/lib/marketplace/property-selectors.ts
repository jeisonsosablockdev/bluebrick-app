import type { MarketplaceMapPinSource } from "@/lib/marketplace-map-pins";
import type {
  PropertyDetail,
  PropertyFilters,
  PropertyListItem
} from "@/lib/property-service";

export function filterMarketplacePropertyDetails(records: PropertyDetail[], filters: PropertyFilters): PropertyDetail[] {
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

export function mapMarketplacePropertyListItems(records: PropertyDetail[]): PropertyListItem[] {
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

export function mapMarketplaceMapEntries(records: PropertyDetail[]): MarketplaceMapPinSource[] {
  return records
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

export function listMarketplacePropertyCitiesFromRecords(records: PropertyDetail[]): string[] {
  return Array.from(new Set(records.map((property) => property.city))).sort((a, b) => a.localeCompare(b));
}
