---
type: Schema
title: Marketplace Entry Schema
description: Marketplace entry data model — persisted from admin handoff, read by public marketplace APIs
tags: [schema, marketplace, database, postgresql, admin, handoff]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/db/migrations/006_marketplace_entries.sql
---

# Marketplace Entry Schema

## Database Table
`marketplace_entries` (migration `006_marketplace_entries.sql`)

## Core Fields
| Column | Type | Nullable | Description |
| --- | --- | --- | --- |
| `id` | UUID | PK | Entry identifier (slug-like) |
| `created_by` | TEXT | NO | Admin wallet pubkey (ownership) |
| `collection_address` | TEXT | NO | Core collection pubkey |
| `candy_machine_address` | TEXT | NO | Core Candy Machine pubkey |
| `asset_mint_address` | TEXT | YES | First minted asset (for reference) |
| `listing_status` | TEXT | NO | `draft`, `funding`, `active`, `sold_out`, `hidden` |
| `sync_status` | TEXT | NO | `unavailable`, `syncing`, `synced`, `degraded` |
| `snapshot_id` | UUID | YES | FK to `asset_mint_snapshots` |

## Editable Content (Admin Writable)
| Column | Type | Nullable | Section |
| --- | --- | --- | --- |
| `title` | TEXT | YES | summary |
| `description` | TEXT | YES | summary |
| `project_json` | JSONB | YES | project |
| `economics_json` | JSONB | YES | economics |
| `governance_json` | JSONB | YES | governance |
| `location_json` | JSONB | YES | googleMapsPlace |
| `gallery_images` | JSONB | YES | gallery |
| `property_images` | JSONB | YES | propertyInformation |
| `documents` | JSONB | YES | documents |

## Derived/Computed
| Column | Type | Description |
| --- | --- | --- |
| `price_usdc_atomic` | BIGINT | From Candy Guard `tokenPayment` |
| `price_sol_lamports` | BIGINT | From Candy Guard `solPayment` (legacy) |
| `quantity_total` | INT | From CM config |
| `quantity_remaining` | INT | From CM `itemsRemaining` |
| `created_at` | TIMESTAMPTZ | Row creation |
| `updated_at` | TIMESTAMPTZ | Last admin edit |

## JSON Structures

### project_json
```json
{
  "name": "string",
  "location": "string",
  "propertyType": "residential|commercial|mixed",
  "totalUnits": 100,
  "description": "string"
}
```

### economics_json
```json
{
  "pricePerUnitUsd": 1000,
  "expectedYieldBps": 800,
  "yieldMode": "linear|cap",
  "distributionFrequency": "monthly|quarterly",
  "revenueShareBps": 2500
}
```

### governance_json
```json
{
  "votingRights": true,
  "quorumThreshold": 51,
  "adminWallet": "base58"
}
```

### location_json (googleMapsPlace)
```json
{
  "placeId": "ChIJ...",
  "formattedAddress": "string",
  "lat": 12.345,
  "lng": -67.890,
  "embedUrl": "https://maps.google.com/...",
  "directionsUrl": "https://maps.google.com/..."
}
```

### gallery_images / property_images
```json
[
  { "url": "https://...", "caption": "string", "order": 0 }
]
```

### documents
```json
[
  { "url": "https://...", "name": "string", "category": "brochure|legal|financial|media", "order": 0 }
]
```

## Ownership & Access
- **Admin write**: Requires `created_by === session wallet` + matching `asset_mint_snapshots` evidence
- **Public read**: Anonymous via `/api/marketplace/entries`
- **Sync status**: `degraded` if DAS verification failed

## Indexes
- `idx_marketplace_entries_created_by` (admin listing)
- `idx_marketplace_entries_collection_address` (collection queries)
- `idx_marketplace_entries_listing_status` (public filtering)

## Related
- [Collections API](../endpoints/collections.md) — admin CRUD with ownership
- [Marketplace API](../endpoints/marketplace.md) — public read
- [Admin Assets API](../endpoints/admin-assets.md) — creation handoff