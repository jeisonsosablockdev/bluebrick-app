# Problem Spec: Admin Distributions UX/UI Fixes & Enhancements (BRI-8)

## What problem exists
In the current distribution creation flow (`/admin/distributions`), the `CreateDistributionModal` required administrators to manually inspect and paste raw base58 Solana collection public keys and property identifiers. Additionally, `/admin/collections/[id]` lacked visibility and mutation of the on-chain Notary PDA dates, and `/admin/treasury` relied on static mock fixtures (`SAMPLE_RUN`, `SAMPLE_ITEMS`, `MOVEMENTS`) instead of reflecting real active distribution runs and pending date change proposals.

## Why it matters
Administrators need an intuitive, error-free interface to configure yield distributions, inspect on-chain project notary dates, and govern treasury proposals with live real-time state. Real estate projects are structured in the marketplace (`marketplace_entries` and `/api/admin/collections`), containing titles, images, and verified collection addresses. Presenting visual project selectors, on-chain date notarization panels, and live treasury proposal inspection eliminates manual entry errors, ensures cryptographic precision, and matches Next.js 16 best practices and the sober aesthetic of `/profile`.

## What outcome is expected
1. `CreateDistributionModal` includes a visual project selector dropdown/list loading verified properties from `/api/admin/collections`.
2. Selecting a project displays its thumbnail image (`coverImageUrl`), property title (`title`), property ID (`entryId`), and on-chain notary dates.
3. `/admin/collections/[id]` includes an interactive on-chain notary panel (`AdminCollectionNotaryDatesPanel`) with calendar date pickers, proposal audit persistence, and multisig status badges.
4. `/admin/treasury` and `/admin/treasury/squads` are updated to Next.js 16 App Router best practices, querying real active distribution runs and live date change proposals from the proposal store.
5. All validations, typechecks, and tests pass cleanly with 100% adherence to 4-layer FDD architecture and mandatory in-code commentary standards.

## What gaps exist today
- `/admin/treasury` currently uses hardcoded sample fixtures (`SAMPLE_RUN`, `SAMPLE_ITEMS`, `MOVEMENTS`).
- The treasury overview does not display real pending date change proposals registered from `/admin/collections/[id]`.

## What questions remain open
- None; user explicitly requested adding a SPEC to connect real data and modernize `/admin/treasury` with Next.js 16 best practices and in-code commentary.
