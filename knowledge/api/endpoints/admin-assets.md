---
type: API Reference
title: Admin Assets API
description: Admin asset creation, upload, and marketplace handoff endpoints
tags: [api, admin, assets, marketplace, upload, candy-machine]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/app/api/admin
---

# Admin Assets API

## Overview
Endpoints for admin-driven asset creation, upload management, and marketplace publishing.

## Endpoints

### Asset Creation & Deploy
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/admin/metaplex-core/prepare` | POST | admin | Prepare Core Candy Machine deploy transaction |
| `/api/admin/metaplex-core/submit` | POST | admin | Submit signed deploy transaction |
| `/api/admin/core-candy-machine/deploy/prepare` | POST | admin | Prepare Core Candy Machine deployment |
| `/api/admin/core-candy-machine/metadata` | POST | admin | Generate/upload metadata to Pinata |
| `/api/admin/core-candy-machine/snapshot/finalize` | POST | admin | Finalize mint snapshot with DAS verification |

### Upload Management
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/admin/assets/uploads/signed-url` | POST | admin | Get signed upload URL for Vercel Blob |
| `/api/admin/assets/uploads/client-upload` | POST | admin | Client direct upload handler |
| `/api/admin/assets/uploads/[uploadId]/finalize` | POST | admin | Finalize upload after client upload |
| `/api/admin/assets/uploads/orphan-reconciler` | POST | admin | Clean up abandoned uploads |

### Edit Session Lifecycle
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/admin/assets/uploads/edit-session/promote` | POST | admin | Promote session uploads to permanent |
| `/api/admin/assets/uploads/edit-session/cancel` | POST | admin | Cancel and mark session uploads for cleanup |

### Marketplace Handoff
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/admin/marketplace/entries` | POST | admin | Create marketplace entry from deployed asset |

### Import & Preview
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/admin/assets/import-preview` | POST | admin | Preview CSV/JSON import |
| `/api/admin/assets/import-jobs` | POST | admin | Create bulk import job |
| `/api/admin/assets/import-jobs/[id]` | GET | admin | Get import job status |
| `/api/admin/assets/import-jobs/[id]/errors` | GET | admin | Get import errors |
| `/api/admin/assets/import-jobs/process` | POST | admin | Process import job |

## Authentication
All endpoints require valid SIWS session with `admin` role (wallet in `ADMIN_WALLETS`).

## Related
- [Marketplace API](../endpoints/marketplace.md)
- [Collections API](../endpoints/collections.md)
- [Mint Orchestrator API](../endpoints/mint-orchestrator.md)