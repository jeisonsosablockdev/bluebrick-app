import { deriveAdminCanonicalLocationLabel } from "@/lib/admin/admin-collection-location-sync";
import { getMarketplaceEntryLocationColumnSupport } from "@/lib/admin/marketplace-entry-location-columns";
import { withDbClient } from "@/lib/db/pool";
import { toMarketplaceDocumentId } from "@/lib/marketplace/property-row-mapper";
import type { CreateMarketplaceEntryInput } from "@/lib/property-service";

export type CreateMarketplaceEntryPersistentInput = CreateMarketplaceEntryInput & {
  createdBy: string;
};

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function toJsonbValue(value: unknown): string {
  return JSON.stringify(value);
}

export async function insertMarketplacePropertyEntry(input: CreateMarketplaceEntryPersistentInput): Promise<void> {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required to create marketplace entries.");
  }

  const documentsPayload = input.documents.map((document, index) => ({
    id: toMarketplaceDocumentId(document.label, index),
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
}
