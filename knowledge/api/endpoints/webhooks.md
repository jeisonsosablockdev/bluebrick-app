---
type: API Reference
title: Webhooks
description: External webhook ingestion — Helius (mint/stake), Stripe (KYC), Airwallex (cards suspended)
tags: [api, webhook, helius, stripe, airwallex, idempotency, hmac]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/app/api/webhooks
---

# Webhooks

## Overview
Ingestion endpoints for external event providers. No SIWS session — validated via provider-specific secrets and idempotency.

## Helius Webhooks

### Mint Orchestrator
**Endpoint**: `POST /api/webhooks/helius/mint-orchestrator?jobId=<jobId>`

| Header | Required | Description |
| --- | --- | --- |
| `x-helius-webhook-secret` | If configured | Shared secret from `HELIUS_WEBHOOK_SECRET` |

**Validation**:
1. Optional secret check
2. Parse enhanced transaction
3. Dedupe by `(provider, eventId)` and `(provider, eventFingerprint)`
4. Reconcile signatures for matching `jobId`

### Stake
**Endpoint**: `POST /api/webhooks/helius/stake`

Observes `freezeAsset` / `thawAsset` for profile history reconciliation.
Canonical RPC revalidation required before persistence.

## Stripe Webhooks

### KYC Identity
**Endpoint**: `POST /api/webhooks/stripe/identity`

| Header | Required | Description |
| --- | --- | --- |
| `Stripe-Signature` | Yes | HMAC-SHA256 with `STRIPE_IDENTITY_WEBHOOK_SECRET` |

**Events Handled**:
| Event | Action |
| --- | --- |
| `identity.verification_session.verified` | Trigger AML screening, update compliance status |
| `identity.verification_session.requires_input` | Update status |

**Idempotency**: By `provider_event_id` (Stripe event ID).

## Airwallex Webhooks (Suspended)

**Endpoint**: `POST /api/webhooks/airwallex`

| Header | Description |
| --- | --- |
| `x-timestamp` | Request timestamp |
| `x-signature` | HMAC-SHA256(timestamp + rawBody) with `AIRWALLEX_WEBHOOK_SECRET` |

**Validation**: Timestamp freshness ±5 min, HMAC verification, dedupe by provider event ID.

**Status**: Card checkout suspended — endpoint retained for infrastructure.

## Internal Compliance

### AML Screening
**Endpoint**: `POST /api/internal/compliance/aml/screen`

| Auth | Description |
| --- | --- |
| SIWS admin **or** `Authorization: Bearer COMPLIANCE_INTERNAL_TOKEN` | Execute AML screening |

## Idempotency Strategy

| Provider | Key | Storage |
| --- | --- | --- |
| Helius | `(provider, eventId)` + `(provider, eventFingerprint)` | In-memory (orchestrator) |
| Stripe | `provider_event_id` | Event ID |
| Airwallex | Provider event ID | DB/event store |

## Error Responses

| Code | HTTP | Description |
| --- | --- | --- |
| `WEBHOOK_SECRET_INVALID` | 401 | Missing/wrong shared secret |
| `SIGNATURE_INVALID` | 400 | HMAC verification failed |
| `PAYLOAD_INVALID` | 400 | Malformed JSON |
| `IDEMPOTENT_DUPLICATE` | 200 | Already processed (silent success) |

## Security Notes
- **Never trust webhook payload blindly** — always verify secret/HMAC + dedupe + state transition
- **Helius**: Optional secret + in-memory dedupe
- **Stripe**: Required `Stripe-Signature` + event ID idempotency
- **Airwallex**: Required timestamp + HMAC + freshness check
- **No SIWS session** — webhooks are external ingress

## Related
- [Purchase Webhook Events Schema](../schemas/purchase-webhook-events.md) — payload schemas
- [Mint Orchestrator API](mint-orchestrator.md) — job reconciliation
- [Auth API](auth.md) — no SIWS on webhook endpoints