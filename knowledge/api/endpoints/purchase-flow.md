---
type: API Reference
title: Purchase Flow API
description: User marketplace mint flow — quote, challenge, prepare, submit with multi-quantity, anti-bot, and idempotency
tags: [api, purchase, mint, marketplace, nft, candy-machine, idempotency, anti-bot]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/app/api/purchase
---

# Purchase Flow API

## Overview
User-facing mint flow for BRIDS NFT fractions from Candy Machine listings.
Requires SIWS wallet session. All endpoints wallet-bound server-side.

## Flow
```
quote → challenge → prepare → submit
```

## Endpoints

### Quote (Public Cache)
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/purchase/quote` | POST | None | Cached Candy Guard quote + quantity contract |

**Response**:
```json
{
  "priceLamports": 1000000,
  "priceUsdcAtomic": 1000000,
  "paymentCurrency": "USDC",
  "startDate": "ISO8601",
  "itemsRemaining": 100,
  "quantityMode": "MULTI_ENABLED",
  "quantity": 1,
  "totalPriceLamports": 1000000
}
```

### Challenge (Anti-Bot)
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/purchase/challenge` | POST | SIWS | Issue one-time challenge bound to quantity |

**Request**: `{ "quantity": 2 }`
**Response**: `{ "challengeId", "nonce", "message", "expiresAt" }`

### Prepare (On-Chain Revalidation)
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/purchase/prepare` | POST | SIWS | Verify challenge, revalidate guard, return tx + idempotencyKey |

**Request**: `{ "quantity": 2, "challengeSignature": "..." }`
**Response**: `{ "transactionBase64", "attemptId", "idempotencyKey", "expectedAssetAddresses" }`

### Submit (Idempotent)
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/purchase/submit` | POST | SIWS | Lock attempt, validate tx, persist submitted |

**Request**: `{ "attemptId", "idempotencyKey", "signedTransactionBase64" }`
**Response**: `{ "status": "confirmed", "txSignature", "verifiedAssetAddresses" }`

**Idempotency**: Deduped by `(wallet_public_key, idempotency_key)` with 5-min TTL.

## Quantity Contract
- Mode: `PURCHASE_QUANTITY_MODE` (default `MULTI_ENABLED`)
- Max per order: `PURCHASE_MAX_QUANTITY_PER_ORDER` (default `10`)
- Invalid/out-of-policy → `INVALID_QUANTITY`

## Error Codes
| Code | Description |
| --- | --- |
| `MINT_NOT_STARTED` | Guard startDate not reached |
| `SOLD_OUT` | itemsRemaining === 0 |
| `PRICE_CHANGED` | Quote cache diverged from fresh guard |
| `INVALID_QUANTITY` | Quantity out of policy or doesn't fit in tx |
| `INSUFFICIENT_FUNDS` | Wallet balance too low |
| `INVALID_CHALLENGE` | Challenge expired/consumed/invalid signature |
| `RATE_LIMITED` | Wallet/IP rate limit exceeded |
| `TRANSACTION_FAILED` | On-chain tx failed |

## Asset Verification
Post-submit verifies each expected asset:
- Asset exists on-chain
- Owner === buyer wallet
- Collection === expected BRIDS collection
- `freezeDelegate.authority === Owner` (for Stake eligibility)

## Tracing
Send `x-flow-id` header to correlate all steps in `purchase_flow_events`.

## Related
- [Mint Orchestrator API](mint-orchestrator.md) — admin batch mint
- [Stake API](../endpoints/stake.md) — stake/unstake purchased assets