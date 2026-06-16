---
type: API Reference
title: Marketplace API
description: Public marketplace read endpoints for property listings, collections, and search
tags: [api, marketplace, public, read, collections, properties]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/app/api/marketplace
---

# Marketplace API

## Overview
Public read-only endpoints for marketplace discovery. No authentication required.

## Endpoints

### Listings & Collections
| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/marketplace/entries` | GET | List marketplace entries with filters |
| `/api/marketplace/entries/[id]` | GET | Get single property detail |
| `/api/marketplace/collections` | GET | List collections |
| `/api/marketplace/collections/[id]` | GET | Get collection detail |

### Search & Discovery
| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/marketplace/search` | GET | Full-text search with filters |
| `/api/marketplace/featured` | GET | Featured properties for landing |
| `/api/marketplace/map/bounds` | GET | Properties within map viewport |

### Location & Maps
| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/marketplace/[id]/location-maps` | GET | Google Maps embed/outbound URLs |
| `/api/marketplace/[id]/location-maps/autocomplete` | GET | Google Places autocomplete suggestions |
| `/api/marketplace/[id]/location-maps/resolve` | GET | Resolve place to reduced payload |

## Response Format
All endpoints return JSON with standard structure:
```json
{
  "data": {},
  "meta": { "timestamp": "ISO8601" }
}
```

## Rate Limiting
Public endpoints have generous rate limits. See headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`.

## Related
- [Admin Assets API](admin-assets.md) — write/admin side
- [Purchase Flow API](purchase-flow.md) — mint/purchase