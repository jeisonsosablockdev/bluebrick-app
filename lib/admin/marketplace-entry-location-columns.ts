import "server-only";

type DbQueryable = {
  query: <TRow = unknown>(sql: string, values?: unknown[]) => Promise<{ rows: TRow[] }>;
};

export type MarketplaceEntryLocationColumnSupport = {
  stateProvince: boolean;
  postalCode: boolean;
  geoLat: boolean;
  geoLng: boolean;
};

type ColumnRow = {
  column_name: string;
};

function normalizeSupport(columnNames: string[]): MarketplaceEntryLocationColumnSupport {
  const available = new Set(columnNames.map((value) => value.trim().toLowerCase()).filter(Boolean));

  return {
    stateProvince: available.has("state_province"),
    postalCode: available.has("postal_code"),
    geoLat: available.has("geo_lat"),
    geoLng: available.has("geo_lng")
  };
}

export function resetMarketplaceEntryLocationColumnSupportCache(): void {
  // No-op. Kept for test compatibility after removing schema caching.
}

export async function getMarketplaceEntryLocationColumnSupport(
  client: DbQueryable
): Promise<MarketplaceEntryLocationColumnSupport> {
  const result = await client.query<ColumnRow>(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'marketplace_entries'
        AND column_name = ANY($1::text[])`,
    [["state_province", "postal_code", "geo_lat", "geo_lng"]]
  );

  return normalizeSupport(result.rows.map((row) => row.column_name));
}
