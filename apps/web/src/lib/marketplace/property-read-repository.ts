import { getMarketplaceEntryLocationColumnSupport } from "@/lib/admin/marketplace-entry-location-columns";
import { withDbClient } from "@/features/shared/infrastructure/db/pool";
import {
  mapPersistedRowToPropertyDetail,
  type PersistedMarketplaceRow
} from "@/lib/marketplace/property-row-mapper";
import type { PropertyDetail } from "@/lib/property-service";

export type PersistedMarketplaceEntriesResult = {
  records: PropertyDetail[];
  degraded: boolean;
  errorCode?: "PERSISTED_MARKETPLACE_READ_FAILED";
};

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function readPersistedMarketplaceEntries(): Promise<PersistedMarketplaceEntriesResult> {
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
           gallery_images_json,
           property_images_json,
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
