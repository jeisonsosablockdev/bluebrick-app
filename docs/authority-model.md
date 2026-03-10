# Authority Model

## Scope
- Feature: P0-06 H1 + H4 + H5 + H6 + H7 - Idempotent mint orchestration with admin signing UI, DAS reconciliation, and permanent job mutation authority.
- Program: Off-chain API layer (Next.js route handlers + in-memory orchestrator + PostgreSQL idempotency schema + DAS read client).

## Authorities
| Authority | Source | Validation Logic | Revocation/Rotation |
| --- | --- | --- | --- |
| Mint authority | Wallet-connected signer (planned in H2+) | Not executed in H1 | Defined in NFT milestone when on-chain mint starts |
| Update authority | Collection/update signer (planned in H2+) | Not executed in H1 | Defined in NFT milestone when on-chain mint starts |
| Collection authority | Core collection authority (planned in H2+) | Not executed in H1 | Defined in NFT milestone when on-chain mint starts |
| Admin authority | SIWS session + `ADMIN_WALLETS` allowlist | Every `/api/admin/mint-jobs*` request checks `getRequestRole()` | Remove wallet from allowlist or revoke SIWS session |
| Job mutation authority (H7) | Immutable `mint_jobs.created_by` per job | Manual mutation endpoints require `actorPubkey === createdBy` | New job under a different admin wallet |
| Webhook ingestion authority | Helius sender + optional `HELIUS_WEBHOOK_SECRET` | `/api/webhooks/helius/mint-orchestrator` checks secret before processing | Rotate `HELIUS_WEBHOOK_SECRET` in runtime environment |
| DAS reconcile authority | SIWS admin session | `/api/admin/mint-orchestrator/jobs/:jobId/reconcile/das` enforces admin role | Remove wallet from allowlist or revoke SIWS session |

## Signer Requirements
| Action | Required Signer(s) | Why |
| --- | --- | --- |
| Create/reuse mint job | SIWS admin session | Prevent non-admin creation and idempotency abuse |
| Read mint job overview | SIWS admin session | Restrict operational state visibility to admin panel |
| Mutate existing mint job manually (prepare/submit/reconcile) | SIWS admin session + same wallet as `createdBy` | Freeze operational authority to original job owner and block cross-admin state mutation |
| Submit Helius webhook event | Webhook secret (if configured) | Prevent unauthenticated third-party webhook mutation attempts |
| Trigger DAS reconciliation | SIWS admin session | Restrict bulk reconciliation scans to authorized operators |

## Explicit Invariants
- [x] Exactly one `mint_jobs` row per `emission_id`.
- [x] Exactly one `mint_job_batches` row per (`job_id`, `batch_no`) and (`job_id`, `batch_token`).
- [x] Exactly one `mint_job_items` row per (`job_id`, `serial_no`) and (`job_id`, `asset_pubkey`).
- [x] Exactly one `mint_item_signatures` row per `signature`.
- [x] Exactly one `webhook_events` row per (`provider`, `event_fingerprint`) with secondary unique key by (`provider`, `event_id`) when available.
- [x] Exactly one in-memory webhook reconcile action per (`provider`, `event_id`) or (`provider`, `event_fingerprint`) in orchestrator H4 flow.
- [x] DAS reconcile only mutates submitted items that have both `signature` and `expectedAddress`.
- [x] `createdBy` authority is immutable per job and manual mutations are rejected for non-owner admin actors.

## Unauthorized Paths Blocked
- Case: Non-admin wallet attempts `POST /api/admin/mint-jobs`.
- Expected error: HTTP `403` with `Forbidden`.

- Case: Payload without valid `emissionId` or invalid `totalItems`.
- Expected error: HTTP `400` with validation message.

- Case: Helius webhook sent with missing or wrong secret while `HELIUS_WEBHOOK_SECRET` is configured.
- Expected error: HTTP `401` with `Unauthorized webhook request.`

- Case: Non-admin wallet attempts `POST /api/admin/mint-orchestrator/jobs/:jobId/reconcile/das`.
- Expected error: HTTP `403` with `Forbidden`.

- Case: Admin wallet differs from immutable job authority (`createdBy`) and attempts `prepare/submit/reconcile`.
- Expected error: HTTP `403` with authority mismatch.

Last Updated: 2026-03-10 07:35:00 UTC
