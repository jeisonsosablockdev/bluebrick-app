# Problem Spec: Admin Distributions UX/UI Fixes & Enhancements (BRI-8)

## What problem exists
In the current distribution creation flow (`/admin/distributions`), the `CreateDistributionModal` requires administrators to manually inspect, remember, and paste raw base58 Solana collection public keys (`collection_address`) and arbitrary property identifiers (`property_id`). This creates high operational friction, is prone to human typing errors, and lacks visual feedback showing the real marketplace project name, city/country location, and property cover thumbnail.

## Why it matters
Administrators need an intuitive, error-free interface to configure yield distributions. Real estate projects are already registered and structured in the marketplace (`marketplace_entries` and `/api/admin/collections`), containing titles, images, and verified collection addresses. Presenting a visual project selector eliminates manual key entry, ensures cryptographic precision by binding the exact registered collection address automatically, and matches the sober, high-fidelity aesthetic of `/profile`.

## What outcome is expected
1. `CreateDistributionModal` includes a visual project selector dropdown/list loading verified properties from `/api/admin/collections`.
2. Selecting a project displays its thumbnail image (`coverImageUrl`), property title (`title`), property ID (`entryId`), and collection address badge.
3. Form state automatically binds `collectionAddress` and `propertyId` from the selected project without manual input errors.
4. Fallback/manual override option is preserved for unlisted or custom devnet collections if needed.
5. All validations, typechecks, and tests pass cleanly with 100% adherence to 4-layer FDD architecture.

## What gaps exist today
- `CreateDistributionModal` currently uses static text inputs with hardcoded initial state (`9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz` and `PROP-BELLA-VISTA-102`).
- The modal does not query `/api/admin/collections` or receive the available marketplace collection options.
- No project thumbnail card or preview header exists inside the modal.

## What questions remain open
- None; user explicitly confirmed selecting marketplace projects with project name, data, and thumbnail in `CreateDistributionModal`.
