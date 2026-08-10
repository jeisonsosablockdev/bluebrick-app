CREATE TABLE IF NOT EXISTS marketplace_entries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  location_label TEXT NOT NULL,
  listing_status TEXT NOT NULL CHECK (listing_status IN ('active', 'funding', 'sold-out')),
  image_url TEXT NOT NULL,
  short_description TEXT NOT NULL,
  detailed_location TEXT NOT NULL,
  highlights_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  investment_notes TEXT NOT NULL,
  supply_total INTEGER NOT NULL CHECK (supply_total > 0),
  minted_or_sold INTEGER NOT NULL CHECK (minted_or_sold >= 0),
  nft_price_usd NUMERIC(14,2) NOT NULL CHECK (nft_price_usd >= 0),
  annual_roi_pct NUMERIC(7,2) NOT NULL CHECK (annual_roi_pct >= 0),
  availability_label TEXT NOT NULL,
  documents_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  collection_address TEXT NOT NULL,
  asset_mint_address TEXT NOT NULL,
  explorer_url TEXT NOT NULL,
  last_onchain_update TIMESTAMPTZ NULL,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('available', 'unavailable', 'rpc_error')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS marketplace_entries_listing_status_idx
  ON marketplace_entries(listing_status);

CREATE INDEX IF NOT EXISTS marketplace_entries_city_idx
  ON marketplace_entries(city);

CREATE INDEX IF NOT EXISTS marketplace_entries_created_at_idx
  ON marketplace_entries(created_at DESC);
