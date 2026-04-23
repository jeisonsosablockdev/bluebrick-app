# EPIC-011 Story 02: Admin Collections Read Model

## Summary
- Added a dedicated backend read-model contract for admin collections.
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
- This slice does not add `/api/admin/collections` yet.
- It prepares the server-side query contract for `BRI-81`.
- Only `linked` rows expose editable sections in the contract.

## Validation
- Added focused unit coverage for:
  - exact dual match => `linked`
  - no match => `missing_snapshot`
  - partial one-side match => `inconsistent`
  - exact match winning over partial matches
