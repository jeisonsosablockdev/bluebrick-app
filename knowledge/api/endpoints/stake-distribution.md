---
type: API Reference
title: Stake Distribution API
description: Stake/unstake user flow and admin distribution preparation
tags: [api, stake, distribution, nft, freeze, admin, helius]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/app/api/protected/stake
---

# Stake & Distribution API

## User Stake Flow (Protected)
Requires SIWS wallet session. Only NFTs owned by authenticated wallet in BRIDS-tracked collections.

### Endpoints
| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/protected/stake/assets` | GET | List eligible assets for stake/unstake |
| `/api/protected/stake/prepare` | POST | Build freeze/thaw tx for asset |
| `/api/protected/stake/submit` | POST | Submit signed stake tx |
| `/api/protected/profile/stake-history` | GET | User's stake history |

### Asset Eligibility
- Must be in BRIDS-tracked collection (persisted in DB)
- Must be currently owned by authenticated wallet
- Must have `FreezeDelegate` with `Owner` authority

### Replay Protection
- Prepared actions stored as server-owned attempts with `attemptId + idempotencyKey`
- Submit rejects mismatched wallet, mismatched prepared message, non-`prepared` attempts

### Blockhash Expired
`BLOCKHASH_EXPIRED` is recoverable: attempt marked failed, UI prompts fresh signature.

## Admin Distribution Preparation
Requires SIWS admin session (`getRequestRole` → `admin`).

### Endpoints
| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/admin/distributions/runs` | GET | List distribution runs |
| `/api/admin/distributions/runs` | POST | Create distribution run |
| `/api/admin/distributions/runs/[runId]/finalize` | POST | Finalize run (records admin actor) |

### Eligibility
Derived server-side from:
- Validated `user_profile_stake_events`
- Persisted `user_profiles.compliance_status`

### Webhook
| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/webhooks/helius/stake` | POST | Helius stake event ingestion (deduped) |

## Related
- [Purchase Flow API](purchase-flow.md) — acquire stakeable assets
- [Auth API](auth.md) — session requirements