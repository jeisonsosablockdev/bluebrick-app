# EPIC-011 Story 02: Admin Collections Read Model

## Summary
- Added a dedicated backend read-model contract for admin collections.
- Added the first read-only API surface for the collections list:
  - `GET /api/admin/collections`
- The read model classifies each owned marketplace entry as:
  - `linked`
  - `missing_snapshot`
  - `inconsistent`
- Matching is ownership-aware and uses:
  - `marketplace_entries.collection_address`
  - `marketplace_entries.asset_mint_address` as the persisted candy machine address
  - `asset_mint_snapshots.collection_address`
  - `asset_mint_snapshots.candy_machine_address`

## Notes
- `GET /api/admin/collections` now delegates directly to the read model and requires an authenticated admin session with a server-side pubkey.
- The route intentionally remains read-only and does not add PATCH/detail behavior yet.
- Only `linked` rows expose editable sections in the contract.

## Validation
- Added focused unit coverage for:
  - exact dual match => `linked`
  - no match => `missing_snapshot`
  - partial one-side match => `inconsistent`
  - exact match winning over partial matches
- Added route coverage for:
  - `403` when the caller is not an authenticated admin with a pubkey
  - `200` when the route returns the read-model payload
  - `500` when the delegated read model throws
