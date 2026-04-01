# Authority Model

## Scope
- Feature: P0-06 H1 + H4 + H5 + H6 + H7 - Idempotent mint orchestration with admin signing UI, DAS reconciliation, and permanent job mutation authority.
- Program: Off-chain API layer (Next.js route handlers + in-memory orchestrator + PostgreSQL idempotency schema + DAS read client).

## Authorities
| Authority | Source | Validation Logic | Revocation/Rotation |
| --- | --- | --- | --- |
| Mint authority | Wallet-connected signer (planned in H2+) | Not executed in H1 | Defined in NFT milestone when on-chain mint starts |
| Update authority | Deploy signer wallet in Core collection flow (current devnet operation) | Server-side admin/session checks + on-chain signer requirement for `UpdateAuthority`-gated writes | Pending governance decision: migrate to dedicated multisig or keep deploy signer model |
| Collection authority | Core collection authority (planned in H2+) | Not executed in H1 | Defined in NFT milestone when on-chain mint starts |
| Candy Guard payment destination (STORY-002-07) | On-chain `tokenPayment.destinationAta` owner (`TEMP_USDC_PAYMENT_RECIPIENT` bridge phase) | Deploy/prepare derives ATA from configured recipient + USDC mint and purchase flow revalidates on-chain guard before mint | Future migration to `TREASURY_USDC_OWNER` per environment |
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
| Prepare public purchase transaction | Buyer wallet signer + backend Candy Guard third-party signer | Backend validates guard payment mode (`tokenPayment`/`solPayment`) and guard signer match before returning transaction to user | Rotate backend signer secret / update Candy Guard signer key |

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

## EPIC-006 STORY-006-03 Addendum (AppData Economic Authority)
### Authority Matrix
| Operation | Required Authority | Enforcement |
| --- | --- | --- |
| Attach `AppData` plugin on freshly minted asset | Admin wallet authenticated in SIWS admin session | `/api/admin/core-candy-machine/mint/prepare` enforces `admin` role and binds payer to authenticated pubkey |
| Write initial economic payload (`v1`) | Admin wallet signer + `UpdateAuthority` key for `AppData` | Transaction built server-side via `writeData` with `key.type = AppData` and `dataAuthority = UpdateAuthority` |
| Update economic payload (`v1`) | Same authority model as initial write | On-chain write path requires valid signer for the configured app-data authority |

### Current Metadata Privilege Scope (Decision Pending)
- Current state:
  - The deploy signer wallet is the collection `updateAuthority` in the active devnet deployment.
  - This is intentional and temporary while authority governance is being finalized.
- Privileges granted by `updateAuthority` in this flow:
  - Update collection-level metadata fields.
  - Authorize/update `UpdateAuthority`-gated AppData economic payload writes.
  - Reassign `updateAuthority` to another wallet/multisig.
- Privileges not granted by `updateAuthority` alone:
  - Spending SOL from other wallets.
  - Taking ownership/custody of assets owned by third parties.

### Sensitive Fields
- Classified as sensitive:
  - `revenue_share_bps`
  - `yield_bps`
  - `yield_mode`
  - `distribution_enabled`
- Constraints:
  - All sensitive fields are validated server-side before transaction construction.
  - Invalid catalog/version/shape values are rejected before signing.

### Invariants Added
- [x] `AppData` economic payload always includes `economic_version`.
- [x] `AppData` updates are audit-ready (`last_updated_at`, `updated_by` required).
- [x] Unknown payload keys are rejected to avoid silent schema drift.

Last Updated: 2026-04-01 14:15:57 UTC
