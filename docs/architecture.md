# Architecture

## Scope
- Feature: H2 Metaplex Core admin collection + batch mint (prepare/sign/submit flow).
- Paths touched:
  - `lib/metaplex-core-admin.ts`
  - `app/api/admin/metaplex-core/prepare/route.ts`
  - `app/api/admin/metaplex-core/submit/route.ts`
  - `components/admin/metaplex-core-mint-panel.tsx`
  - `app/admin/page.tsx`
- Related PR: `feature/solana-p0-06-h2-metaplex-core-collection-mint -> epic/p0-06-metaplex-core-admin-minting`

## On-Chain Accounts
| Account | Type | PDA Seeds | Owner Program | Notes |
| --- | --- | --- | --- | --- |
| Collection address | Core asset account | N/A (fresh signer keypair) | `mpl-core` (`CoREENx...`) | Created by `createCollectionV2` |
| Asset address | Core asset account | N/A (fresh signer keypair) | `mpl-core` (`CoREENx...`) | Minted by `createV2` in collection |

## Instructions
| Instruction | Signers | Writable Accounts | Preconditions | Postconditions |
| --- | --- | --- | --- | --- |
| `createCollectionV2` | Admin wallet (payer/authority) + collection signer | New collection account | Admin SIWS session + `admin` role | Core collection account created |
| `createV2` | Admin wallet (payer/authority) + asset signer | New asset account + collection account | Existing collection + admin SIWS session | Asset minted in collection |

## Data Flow
1. Client action:
   - Admin opens `/admin`, sets mint payload, requests prepare batch.
2. Server validation:
   - Verifies SIWS session and `admin` role.
   - Validates URI/name/total constraints.
   - Builds Metaplex Core transactions server-side.
3. Program execution:
   - Frontend signs each prepared transaction with Phantom.
   - Signed payloads are posted back to `/api/admin/metaplex-core/submit`.
   - Server broadcasts and confirms each signature on devnet.
4. State readback:
   - UI shows progress and signatures.
   - Devnet proof validates accounts exist and are owned by Core program.

## Dependencies
- Programs/CPIs:
  - Metaplex Core Program `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d`
- SDK/packages:
  - `@metaplex-foundation/umi`
  - `@metaplex-foundation/umi-bundle-defaults`
  - `@metaplex-foundation/umi-web3js-adapters`
  - `@metaplex-foundation/mpl-core`
  - `@solana/web3.js`

## Admin Marketplace Entry Handoff
- Scope:
  - `components/admin/asset-creation-form.tsx`
  - `app/api/admin/marketplace/entries/route.ts`
  - `lib/property-marketplace-server.ts`
  - `lib/property-service.ts`
  - `db/migrations/006_marketplace_entries.sql`
- Flow:
  1. Admin completes deploy in `CoreCandyMachinePanel`.
  2. `Create Asset` triggers `POST /api/admin/marketplace/entries`.
  3. Server validates admin role and payload.
  4. A marketplace entry is persisted in Postgres (`marketplace_entries`) with `listingStatus = funding` and `syncStatus = unavailable`.
  5. Marketplace list/detail APIs read persisted entries from DB and merge with seed records.
- Notes:
  - This handoff is intentionally deploy-first (no mint required).
  - Explorer link is derived from collection address using devnet cluster.
  - If `DATABASE_URL` is not configured, create-entry returns an explicit failure.

## Compliance Dashboard and Audit (EPIC-004 STORY-005)
- Scope:
  - `app/admin/compliance/page.tsx`
  - `components/admin/compliance-console.tsx`
  - `app/api/admin/compliance/cases/*`
  - `lib/compliance/case-service.ts`
  - `lib/compliance/profile-repository.ts`
  - `db/migrations/014_compliance_notes.sql`
- Queue data model:
  - Operational queue reads from denormalized `user_profiles.compliance_status`.
  - Cursor pagination ordered by `compliance_status_updated_at DESC, wallet_public_key DESC`.
- Admin actions:
  - `kyc-decision`: `verified` or `rejected` (reason required for rejected).
  - `aml-decision`: `clear` or `flagged` (reason required).
  - `suspend` and `unsuspend`: toggles `is_suspended`, then recomputes projected status.
  - `notes`: internal notes persisted in `compliance_notes`.
- Audit model:
  - Every admin mutation writes to `compliance_audit_events` with actor, event name, payload and UTC timestamp.
  - Notes also produce dedicated audit events (`compliance.note_added`).
- Financial guardrail:
  - Financial routes enforce compliance blocking for `restricted_aml` and `suspended`.
  - Applied to `/api/purchase/challenge`, `/api/purchase/prepare`, `/api/purchase/submit`.

## EPIC-006 STORY-006-03: Economic AppData Plugin
- Scope:
  - `lib/core-candy-machine-admin.ts`
  - `components/admin/core-candy-machine-panel.tsx`
  - `tests/lib/core-candy-machine-admin-validation.test.ts`
- Runtime flow (mint pipeline):
  1. `mint` transaction creates the asset from Core Candy Machine.
  2. `add-app-data-plugin` attaches `AppData` with `ExternalPluginAdapterSchema.Json` and `UpdateAuthority`.
  3. `write-app-data` writes economic payload `v1` immediately after mint.
- Canonical payload fields:
  - `revenue_share_bps`, `yield_bps`, `yield_mode`
  - `locked_at`, `eligible_from`, `earning_start_ts`
  - `distribution_enabled`, `economic_version`
  - `last_updated_at`, `updated_by`
- Validation guarantees:
  - Catalog-only `yield_mode` (`cap | linear`).
  - `bps` range in `[0, 10000]`.
  - `economic_version` format gate + explicit support for `v1`.
  - Unsupported keys rejected (`additionalProperties=false` behavior).
  - Optional lifecycle timestamps accepted when omitted.
- Devnet proof anchor:
  - Collection: `2vPD7d2ojHbMTa4CubV5MwzhQKRNrc1DFbTpBBTBszHi`
  - Asset: `D5HnpX9tXFi5gxaD1mds6EmtPvVSyeuWvHpu4Z7X7YqK`
  - Final on-chain `AppData` confirms updated economic payload (`yield_mode=linear`, `yield_bps=1300`, `distribution_enabled=false`).

Last Updated: 2026-04-01 08:20:33 UTC
