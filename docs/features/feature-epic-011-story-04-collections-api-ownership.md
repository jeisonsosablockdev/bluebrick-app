# EPIC-011 Story 04: Collections API Ownership

## Summary
- Added the first API foundation slice for collection detail routes:
  - `assertAdminCollectionOwnership(adminId, collectionId)`
- The helper validates ownership through both:
  - `marketplace_entries.created_by`
  - exact `asset_mint_snapshots.created_by + collection_address + candy_machine_address`
- The helper returns stable ownership evidence for later `GET` and `PATCH` detail routes.

## Notes
- `collectionId` is the `marketplace_entries.id` value.
- A marketplace entry owned by the admin is not enough by itself; exact snapshot evidence must also exist for the same admin.
- Missing entries return `COLLECTION_NOT_FOUND`.
- Cross-admin entries or missing snapshot evidence return `COLLECTION_OWNERSHIP_MISMATCH`.
- This slice does not add route handlers yet; `BRI-89` will consume the helper for detail reads.

## Validation
- Added focused unit coverage for:
  - exact entry + snapshot match
  - missing marketplace entry
  - entry owned by another admin
  - owned entry with missing snapshot evidence
  - blank input short-circuiting before DB access
