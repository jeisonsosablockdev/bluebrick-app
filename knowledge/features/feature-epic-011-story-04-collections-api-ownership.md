---
type: Feature Spec
title: Feature EPIC- 011 STORY- 04 Collections Api Ownership
description: Feature EPIC- 011 STORY- 04 Collections Api Ownership - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-epic-011-story-04-collections-api-ownership.md
---

# EPIC-011 Story 04: Collections API Ownership

## Summary
- Added the API foundation slices for collection detail routes:
  - `assertAdminCollectionOwnership(adminId, collectionId)`
  - `GET /api/admin/collections/[id]`
  - `parseAdminCollectionPatchPayload(payload)`
  - `PATCH /api/admin/collections/[id]`
- The helper validates ownership through both:
  - `marketplace_entries.created_by`
  - exact `asset_mint_snapshots.created_by + collection_address + candy_machine_address`
- The detail `GET` route uses the helper before reading editable content and returns a stable detail payload for later editor/read-only panels.
- The detail `PATCH` route validates a single section-discriminated payload, enforces ownership, and delegates the normalized update to the collection content repository.

## Notes
- `collectionId` is the `marketplace_entries.id` value.
- A marketplace entry owned by the admin is not enough by itself; exact snapshot evidence must also exist for the same admin.
- Missing entries return `COLLECTION_NOT_FOUND`.
- Cross-admin entries or missing snapshot evidence return `COLLECTION_OWNERSHIP_MISMATCH`.
- `GET /api/admin/collections/[id]` returns:
  - `ownership`: server-side evidence from the centralized helper.
  - `content`: editable off-chain collection fields from `marketplace_entries`.
- Missing content after ownership succeeds returns `COLLECTION_CONTENT_NOT_FOUND` instead of fabricating partial data.
- PATCH payload validation is centralized before the final mutation route:
  - allowed sections: `summary`, `propertyInformation`, `gallery`, `documents`, `googleMapsPlace`
  - cover fields such as `image_url`, `imageUrl`, and `coverImageUrl` are rejected explicitly
  - validation returns repository-ready normalized updates for the PATCH route
- `PATCH /api/admin/collections/[id]` returns:
  - `section`: the accepted section discriminator.
  - `ownership`: the same server-side ownership evidence used by the detail read route.
  - `content`: the persisted editable content after the repository update.
- Payload validation runs before ownership lookup so malformed or immutable-cover requests fail without touching ownership/content repositories.

## Validation
- Added focused unit coverage for:
  - exact entry + snapshot match
  - missing marketplace entry
  - entry owned by another admin
  - owned entry with missing snapshot evidence
  - blank input short-circuiting before DB access
- Added focused API route coverage for:
  - admin-only access
  - centralized ownership helper usage
  - ownership error passthrough
  - missing content after ownership
  - unexpected content lookup failures
- Added focused PATCH payload validation coverage for:
  - each allowed section
  - nullable text clears
  - document tag allowlist
  - immutable cover rejection
  - malformed/unknown section errors
- Added focused PATCH route coverage for:
  - admin-only access
  - valid section update persistence
  - immutable cover rejection before ownership checks
  - ownership error passthrough
  - missing content after ownership
  - unexpected repository update failures
