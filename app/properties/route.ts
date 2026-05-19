import { NextResponse } from "next/server";

import { type ListingStatus, type PropertyFilters } from "@/lib/property-service";
import { listMarketplaceProperties, listMarketplacePropertyCities } from "@/lib/property-marketplace-server";

const LISTING_STATUSES: ListingStatus[] = ["active", "funding", "sold-out"];
const PUBLIC_CACHE_HEADERS = {
  "cache-control": "public, s-maxage=300, stale-while-revalidate=600"
};

function parseMinRoi(rawValue: string | null): number | undefined {
  if (!rawValue) {
    return undefined;
  }

  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Invalid 'minRoi' value. Expected a non-negative number.");
  }

  return parsed;
}

function parseStatus(rawValue: string | null): ListingStatus | undefined {
  if (!rawValue) {
    return undefined;
  }

  const normalized = rawValue.toLowerCase() as ListingStatus;

  if (!LISTING_STATUSES.includes(normalized)) {
    throw new Error("Invalid 'status' value. Expected one of: active, funding, sold-out.");
  }

  return normalized;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: PropertyFilters = {
      search: searchParams.get("search")?.trim() || undefined,
      city: searchParams.get("city")?.trim() || undefined,
      status: parseStatus(searchParams.get("status")),
      minRoi: parseMinRoi(searchParams.get("minRoi"))
    };

    const properties = await listMarketplaceProperties(filters);
    const availableCities = await listMarketplacePropertyCities();

    return NextResponse.json(
      {
        data: properties,
        meta: {
          total: properties.length,
          filters,
          availableCities,
          availableStatuses: LISTING_STATUSES
        }
      },
      { headers: PUBLIC_CACHE_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error while fetching properties.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
