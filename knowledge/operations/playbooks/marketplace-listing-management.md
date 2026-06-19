---
type: Playbook
title: Marketplace Listing Management
description: Playbook for managing marketplace listings - status, content, visibility
tags: [operations, playbook, marketplace, listing, management, admin]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/app/admin
---

# Marketplace Listing Management Playbook

## Listing Lifecycle

### States
| State | Description | Transitions |
|-------|-------------|-------------|
| `draft` | Created but not published | → `funding` |
| `funding` | Mint in progress | → `active` \| `draft` |
| `active` | Published, purchasable | → `sold_out` \| `hidden` |
| `sold_out` | Quantity = 0 | → `active` (if restocked) |
| `hidden` | Admin hidden | → `active` |

## Admin Operations

### 1. View Listings
- **Endpoint**: `GET /api/admin/collections`
- **Filters**: status, search, pagination
- **Data**: title, status, quantity, created_at, sync_status

### 2. Edit Listing Content
- **Endpoint**: `PATCH /api/admin/collections/:id`
- **Sections** (one per request):
  - `summary` - title, description
  - `propertyInformation` - project/economics/governance JSON
  - `gallery` - gallery_images array
  - `documents` - documents array
  - `googleMapsPlace` - location_json

### 3. Ownership Verification
Every edit requires:
```
marketplace_entries.created_by === admin_wallet
AND
asset_mint_snapshots.created_by === admin_wallet (matching collection)
```

### 4. Immutable Fields (Rejected)
- `image_url`, `imageUrl`, `coverImageUrl` - set at deploy only
- `collection_address`, `candy_machine_address` - on-chain immutable

## Status Management

### Hide Listing
```json
PATCH /api/admin/collections/:id
{ "section": "summary", "listing_status": "hidden" }
```

### Restock (if applicable)
- Not supported in v1 (fixed quantity per collection)
- Future: new collection + link from old

### Bulk Operations
- Not implemented in v1
- Future: CSV import, bulk status change

## Sync Status
| Sync Status | Meaning |
|-------------|---------|
| `unavailable` | No DAS verification yet |
| `syncing` | DAS reconciliation in progress |
| `synced` | DAS verified, data current |
| `degraded` | Fallback to CM counters |

### Re-sync
- Manual: `POST /api/admin/mint-orchestrator/jobs/:jobId/reconcile/das`
- Auto: After snapshot finalize

## Public Marketplace
- Reads from `marketplace_entries` with `listing_status = active`
- Merges with seed records for demo data
- Images served from Vercel Blob / Pinata

## Common Operations

### Update Price/Economics
1. Edit `economics_json` in `propertyInformation` section
2. Price changes reflect immediately on public marketplace
3. Active purchases use quote cache (5-min TTL)

### Update Gallery/Images
1. Upload new images via Vercel Blob (separate flow)
2. Update `gallery_images` or `property_images` in gallery section
3. Order field controls display order

### Update Location
1. Use Google Maps autocomplete in admin
2. Select place → resolves to `location_json`
3. Generates embed + directions URLs

## Monitoring
- Listing count by status (admin dashboard)
- Sync status health (alert if `degraded` > 1hr)
- Purchase conversion per listing (analytics)

## Related
- [Collections API](../api/endpoints/collections.md)
- [Marketplace API](../api/endpoints/marketplace.md)
- [Marketplace Entry Model](../database/models/marketplace-entry.md)