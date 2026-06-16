---
type: API Reference
title: Collections API (Admin)
description: Admin collection detail read/write with ownership verification
tags: [api, admin, collections, ownership, marketplace, google-maps]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/app/api/admin/collections
---

# Collections API (Admin)

## Overview
Admin-only endpoints for managing marketplace collection content with strict ownership verification.

## Ownership Verification
All endpoints use `assertAdminCollectionOwnership(adminId, collectionId)` which verifies:
1. `marketplace_entries.created_by` === authenticated admin wallet
2. Matching `asset_mint_snapshots` evidence exists for same admin

## Endpoints

### Read
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/admin/collections` | GET | admin | List admin's collections |
| `/api/admin/collections/[id]` | GET | admin | Get collection detail with editable content |
| `/api/admin/collections/[id]/location-maps` | GET | admin | Get normalized location/maps section |

### Write
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/admin/collections/[id]` | PATCH | admin | Update one editable section |

#### PATCH Sections
Allowed section discriminators:
- `summary`
- `propertyInformation`
- `gallery`
- `documents`
- `googleMapsPlace`

**Immutable fields rejected**: `image_url`, `imageUrl`, `coverImageUrl`

### Location Maps Helpers
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/admin/collections/[id]/location-maps/autocomplete` | GET | admin | Google Places autocomplete |
| `/api/admin/collections/[id]/location-maps/resolve` | GET | admin | Resolve place to reduced payload |

## Error Codes
| Code | HTTP | Description |
| --- | --- | --- |
| `COLLECTION_NOT_FOUND` | 404 | Marketplace entry doesn't exist |
| `COLLECTION_OWNERSHIP_MISMATCH` | 403 | Admin doesn't own or missing snapshot evidence |
| `COLLECTION_CONTENT_NOT_FOUND` | 404 | Ownership OK but no editable content |
| `INVALID_SECTION` | 400 | Unknown or immutable section |

## Related
- [Marketplace API](marketplace.md) — public read side
- [Admin Assets API](admin-assets.md) — creation/handoff