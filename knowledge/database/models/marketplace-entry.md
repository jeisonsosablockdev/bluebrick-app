---
type: Data Model
title: Marketplace Entry
description: Marketplace property listing data model — persisted from admin handoff, read by public marketplace APIs
tags: [database, model, marketplace, property, postgresql]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/lib/marketplace
---

# Marketplace Entry

## Database Table
`marketplace_entries` (migration `006_marketplace_entries.sql`)

## Type Definition
From `lib/marketplace/property-row-mapper.ts`:

```typescript
export type PersistedMarketplaceRow = {
  id: string;
  created_by: string;
  collection_address: string;
  candy_machine_address: string;
  asset_mint_address: string | null;
  listing_status: MarketplaceListingStatus;
  sync_status: MarketplaceSyncStatus;
  snapshot_id: string | null;
  title: string | null;
  description: string | null;
  project_json: ProjectJson | null;
  economics_json: EconomicsJson | null;
  governance_json: GovernanceJson | null;
  location_json: LocationJson | null;
  gallery_images: GalleryImage[] | null;
  property_images: PropertyImage[] | null;
  documents: Document[] | null;
  price_usdc_atomic: number | null;
  price_sol_lamports: number | null;
  quantity_total: number | null;
  quantity_remaining: number | null;
  created_at: Date;
  updated_at: Date;
};
```

## Related Types

### MarketplaceListingStatus
```typescript
type MarketplaceListingStatus = 
  | "draft" 
  | "funding" 
  | "active" 
  | "sold_out" 
  | "hidden";
```

### MarketplaceSyncStatus
```typescript
type MarketplaceSyncStatus = 
  | "unavailable" 
  | "syncing" 
  | "synced" 
  | "degraded";
```

### JSON Structures

#### ProjectJson
```typescript
type ProjectJson = {
  name: string;
  location: string;
  propertyType: "residential" | "commercial" | "mixed";
  totalUnits: number;
  description: string;
};
```

#### EconomicsJson
```typescript
type EconomicsJson = {
  pricePerUnitUsd: number;
  expectedYieldBps: number;
  yieldMode: "linear" | "cap";
  distributionFrequency: "monthly" | "quarterly";
  revenueShareBps: number;
};
```

#### GovernanceJson
```typescript
type GovernanceJson = {
  votingRights: boolean;
  quorumThreshold: number;
  adminWallet: string;
};
```

#### LocationJson
```typescript
type LocationJson = {
  placeId: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  embedUrl: string;
  directionsUrl: string;
};
```

#### GalleryImage / PropertyImage
```typescript
type GalleryImage = {
  url: string;
  caption: string;
  order: number;
};
```

#### Document
```typescript
type Document = {
  url: string;
  name: string;
  category: "brochure" | "legal" | "financial" | "media";
  order: number;
};
```

## Repository Operations
From `lib/marketplace/property-read-repository.ts` and `property-write-repository.ts`:

- `listMarketplaceProperties(filters)` → `PersistedMarketplaceRow[]`
- `getMarketplaceEntryById(id)` → `PersistedMarketplaceRow | null`
- `createMarketplaceEntry(input)` → `PersistedMarketplaceRow`
- `updateMarketplaceEntrySection(id, section, data)` → `PersistedMarketplaceRow`

## Indexes
- `idx_marketplace_entries_created_by` (admin listing)
- `idx_marketplace_entries_collection_address` (collection queries)
- `idx_marketplace_entries_listing_status` (public filtering)

## Related
- [Marketplace API](../api/endpoints/marketplace.md)
- [Collections API](../api/endpoints/collections.md)
- [Admin Assets API](../api/endpoints/admin-assets.md)