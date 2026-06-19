---
type: API Reference
title: Mint Orchestrator API
description: Admin batch mint job orchestration — create, prepare batches, submit signatures, reconcile via RPC/DAS
tags: [api, admin, mint, orchestrator, batch, reconciliation, das, idempotency]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/app/api/admin/mint-orchestrator
---

# Mint Orchestrator API

## Overview
Server-side batch mint orchestration for Core Candy Machine. Admin creates jobs, requests batches, collects signatures, submits, and reconciles.

## Authority
- All endpoints require SIWS `admin` role
- **Permanent job authority (H7)**: Manual mutations (`next-batch`, `submit`, `reconcile`) require `actorPubkey === job.createdBy`
- Webhook/DAS reconciliation is server-initiated, not wallet-bound

## Job Lifecycle
```
created → preparing → signing → submitting → confirming → completed|partial|failed
```

## Endpoints

### Job Management
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/admin/mint-orchestrator/jobs` | POST | admin | Create mint job (`job_id`) |
| `/api/admin/mint-orchestrator/jobs` | GET | admin | List recent jobs with progress |
| `/api/admin/mint-orchestrator/jobs/:jobId` | GET | admin | Get job snapshot |

### Batch Operations
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/admin/mint-orchestrator/jobs/:jobId/next-batch` | POST | admin | Reserve next batch idempotently |
| `/api/admin/mint-orchestrator/jobs/:jobId/batches/:batchNo/submit` | POST | admin | Submit signed item signatures |

### Reconciliation
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/admin/mint-orchestrator/jobs/:jobId/reconcile` | POST | admin | RPC-based signature confirmation |
| `/api/admin/mint-orchestrator/jobs/:jobId/reconcile/das` | POST | admin | DAS paginated asset confirmation |

## Idempotency
| Operation | Key | TTL |
| --- | --- | --- |
| `next-batch` | `jobId + idempotency_key` | Permanent (DB unique) |
| `submit` | Signature uniqueness per item | Permanent |
| DAS reconcile | Bounded pagination (`page`, `limit`, `maxPages`) | Per-request |

## Authority Gates (H7)
```typescript
// Every manual mutation endpoint validates:
if (actorPubkey !== job.createdBy) return 403; // "Authority mismatch"
```

## DAS Reconciliation Parameters
```json
{
  "page": 1,
  "limit": 1000,
  "maxPages": 10
}
```
Returns `nextPage` token for continuation.

## Snapshot Finalization
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/admin/core-candy-machine/snapshot/finalize` | POST | admin | DAS verify quantity, persist snapshot + on-chain proofs |

**Create Asset Gate**: Enabled only when `verificationStatus=verified` AND `mint_jobs.status=completed`.

## Webhook Ingestion
| Endpoint | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/webhooks/helius/mint-orchestrator?jobId=<jobId>` | POST | None | Ingest Helius events, dedupe, reconcile signatures |

**Dedupe**: In-memory by `(provider, eventId)` and `(provider, eventFingerprint)`.

## Error Codes
| Code | Description |
| --- | --- |
| `JOB_NOT_FOUND` | Job ID doesn't exist |
| `AUTHORITY_MISMATCH` | Actor ≠ job.createdBy |
| `BATCH_ALREADY_RESERVED` | Idempotency key collision |
| `INVALID_SIGNATURE` | Signature verification failed |
| `RECONCILIATION_INCOMPLETE` | Some items unconfirmed after maxPages |

## Related
- [Admin Assets API](admin-assets.md) — Deploy triggers job creation
- [Solana RPC Methods](../rpc/solana-methods.md) — RPC reconciliation patterns
- [Auth Flow](../architecture/auth-flow.md) — Session requirements