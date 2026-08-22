# Problem Spec: Admin Distributions UX/UI Fixes & Enhancements (BRI-8)

## What problem exists
In the current distribution creation flow (`/admin/distributions`), the `CreateDistributionModal` required administrators to manually inspect and paste raw base58 Solana collection public keys and property identifiers. Additionally, `/admin/collections/[id]` lacked visibility and mutation of the on-chain Notary PDA dates, and `/admin/treasury` relied on static mock fixtures (`SAMPLE_RUN`, `SAMPLE_ITEMS`, `MOVEMENTS`) instead of reflecting real active distribution runs and pending date change proposals.

## Why it matters
Administrators need an intuitive, error-free interface to configure yield distributions, inspect on-chain project notary dates, and govern treasury proposals with live real-time state. Real estate projects are structured in the marketplace (`marketplace_entries` and `/api/admin/collections`), containing titles, images, and verified collection addresses. Presenting visual project selectors, on-chain date notarization panels, and live treasury proposal inspection eliminates manual entry errors, ensures cryptographic precision, and matches Next.js 16 best practices and the sober aesthetic of `/profile`.

## What outcome is expected
1. `CreateDistributionModal` includes a visual project selector dropdown/list loading verified properties from `/api/admin/collections`.
2. Selecting a project displays its thumbnail image (`coverImageUrl`), property title (`title`), property ID (`entryId`), and on-chain notary dates.
3. `/admin/collections/[id]` includes an interactive on-chain notary panel (`AdminCollectionNotaryDatesPanel`) with calendar date pickers, proposal audit persistence, and multisig status badges.
4. `/admin/treasury` and `/admin/treasury/squads` are updated to Next.js 16 App Router best practices, querying real active distribution runs and live date change proposals without static mock fixtures.
5. All validations, typechecks, and tests pass cleanly with 100% adherence to 4-layer FDD architecture and mandatory in-code commentary standards.
6. All date change proposals are created natively on-chain in Squads Protocol v4 (`SQDS4ep65T...`) via `proposalCreate` and sealed with Keccak-256 hashes (`proposal_hash = keccak256(...)`) per SOLUTION-ARCHITECTURE.md, using the backend purely as a transitory UI cache.

## What gaps exist today
- Native Squads v4 `proposalCreate` and `proposalApprove` instructions must be wired to collection date requests and multisig governance.

## What questions remain open
- None; user explicitly directed to implement native Squads v4 proposal creation with Keccak-256.
