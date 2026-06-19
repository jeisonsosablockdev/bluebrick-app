---
type: Schema
title: Purchase Webhook Events
description: Webhook event schemas for Helius (mint/stake) and Stripe (KYC) — idempotent ingestion, HMAC verification
tags: [schema, webhook, helius, stripe, kyc, purchase, idempotency]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/app/api/webhooks
---

# Purchase Webhook Events

## Helius Webhooks

### Mint Orchestrator
**Endpoint**: `POST /api/webhooks/helius/mint-orchestrator?jobId=<jobId>`

**Headers**:
- `x-helius-webhook-secret` (optional, if `HELIUS_WEBHOOK_SECRET` configured)
- `Content-Type: application/json`

**Payload** (Helius enhanced transaction):
```json
{
  "signature": "base58",
  "slot": 123456,
  "blockTime": 1234567890,
  "meta": {
    "err": null,
    "logMessages": ["Program log: MintV1", "..."]
  },
  "events": {
    "nft": {
      "mints": [{ "mint": "base58", "collection": "base58" }]
    }
  }
}
```

**Idempotency**: Deduped by `(provider, eventId)` and `(provider, eventFingerprint)` in memory.

### Stake
**Endpoint**: `POST /api/webhooks/helius/stake`

Similar structure, observes `freezeAsset` / `thawAsset` for profile history reconciliation.

## Stripe Webhooks

### KYC Identity Verification
**Endpoint**: `POST /api/webhooks/stripe/identity`

**Headers**:
- `Stripe-Signature` — HMAC-SHA256 verified against `STRIPE_IDENTITY_WEBHOOK_SECRET`

**Event Types**:
| Event | Action |
| --- | --- |
| `identity.verification_session.verified` | Trigger AML screening, update compliance |
| `identity.verification_session.requires_input` | Update status, notify user |

**Idempotency**: By `provider_event_id` (Stripe event ID).

## Airwallex Webhooks (Suspended)

**Endpoint**: `POST /api/webhooks/airwallex`

**Headers**:
- `x-timestamp` + `x-signature` (HMAC-SHA256 with `AIRWALLEX_WEBHOOK_SECRET`)

**Status**: Card checkout suspended — webhook retained for infrastructure.

## Validation Rules

| Rule | Implementation |
| --- | --- |
| HMAC verification | Required for Stripe/Airwallex; optional for Helius |
| Timestamp freshness | Airwallex: ±5 min tolerance |
| Idempotent ingestion | In-memory dedupe (Helius); event ID (Stripe) |
| Signature-level state transition | Only transition on confirmed signatures |

## Error Responses
| Code | HTTP | Description |
| --- | --- | --- |
| `WEBHOOK_SECRET_INVALID` | 401 | Missing/wrong secret |
| `SIGNATURE_INVALID` | 400 | HMAC verification failed |
| `IDEMPOTENT_DUPLICATE` | 200 | Already processed (silent success) |
| `PAYLOAD_INVALID` | 400 | Malformed JSON |

## Related
- [Purchase Flow API](../endpoints/purchase-flow.md) — flow that generates events
- [Auth API](../endpoints/auth.md) — no SIWS on webhook endpoints