---
type: Feature Spec
title: Feature EPIC- 011 STORY- 03 Collection Content Persistence
description: Feature EPIC- 011 STORY- 03 Collection Content Persistence - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-epic-011-story-03-collection-content-persistence.md
---

# EPIC-011 Story 03: Editable Collection Content Persistence

## Summary
- Added the first schema slice for collection editor persistence in `marketplace_entries`.
- New editable off-chain columns:
  - `gallery_images_json`
  - `property_images_json`
  - `fractional_investment_summary`
  - `property_information`
  - `google_maps_place_json`
  - `updated_by`
- Added a deterministic bootstrap mapper contract for the next migration slice:
  - typed `gallery_images_json` items
  - typed `property_images_json` items
  - normalized `documents_json` items with taxonomy tags
  - `manual_review_required` reason codes for corrupt or incomplete snapshot data
  - upload-ref-first ordering with snapshot URL fallback
- Added a versioned bootstrap dry-run runner:
  - `lib/admin/collection-bootstrap-dry-run.ts`
  - `scripts/collection-bootstrap-dry-run.ts`
  - manifest version `2026-04-23-v1`
  - explicit buckets for `successes`, `manualReviewRequired`, and `failures`
  - preflight failure reasons for `missing_snapshot`, `inconsistent_snapshot_link`, `missing_draft_id`, and runtime `bootstrap_exception`
- Added a narrow repository/helper layer for editable collection content:
  - `lib/admin/collection-content-repository.ts`
  - `get`/`list` helpers for repository-backed detail reads
  - `update` helper for editable fields only
  - `applyBootstrap` helper for manifest-backed persistence reuse
- Added edit-session lifecycle tracking for temporary collection-editor uploads:
  - `db/migrations/020_asset_upload_edit_sessions.sql`
  - optional `editSessionId` association in the upload contract
  - repository helpers to promote or cancel session-linked uploads
  - orphan cleanup that only purges non-promoted session uploads and deletes blob objects before removing DB rows

## Notes
- `image_url` remains the immutable cover field and was not changed by this slice.
- Gallery and property images now have explicit, separate JSON storage with empty-array defaults.
- Textual editor fields remain nullable until bootstrap and manual editing slices populate them.
- Google Maps persistence remains a reduced JSON payload and is still separate from address text fields already present on the entry.
- Column comments were added to document the separation between editable marketplace content and historical snapshot evidence.
- The bootstrap mapper uses `uploadRefs` from `form_snapshot` as the primary ordering source and falls back to raw snapshot URLs only when the referenced finalized upload is missing.
- Existing `documents_json` marketplace data is preserved first and deduped against bootstrap uploads by both `fileRefId` and URL to avoid duplicate brochure/legal/financial rows.
- When `form_snapshot` contains malformed arrays, unresolved upload refs without fallback URLs, or an invalid reduced Google Maps payload, the mapper does not invent data and instead marks the row for manual review.
- The dry-run runner only plans and renders the bootstrap result. It does not mutate `marketplace_entries` in this slice.
- The CLI supports scoped execution by `--actor-pubkey` and repeatable `--entry-id`, and can emit JSON either to stdout or to an `--output-file` for audit/review.
- The repository layer keeps `image_url` out of the write contract and centralizes the SQL update surface for `gallery_images_json`, `property_images_json`, `documents_json`, `fractional_investment_summary`, `property_information`, `google_maps_place_json`, and `updated_by`.
- Read helpers normalize `documents_json` into the typed collection document contract so later API/detail slices do not need to duplicate legacy compatibility parsing.
- Edit-session uploads can now stay temporary while a collection section is being edited, then be promoted on save so later cleanup jobs do not remove them.
- Explicit session cancelation is now supported at the repository layer, giving later API/detail slices a deterministic way to mark abandoned uploads before scheduled cleanup runs.
- The orphan reconciler now scopes itself to `editSessionId`-linked uploads that were never promoted and attempts blob deletion before deleting DB records.

## Validation
- Added migration contract coverage for:
  - approved column names and types
  - immutable cover protection at the migration level
  - schema comments documenting editorial vs snapshot separation
- Added bootstrap mapper coverage for:
  - deterministic upload-ref ordering
  - fallback to snapshot URLs
  - documents taxonomy normalization and dedupe
  - manual review detection for corrupt snapshot payloads
- Added bootstrap runner coverage for:
  - exact-link candidate planning
  - deterministic preflight failures for missing/inconsistent snapshots and blank `draftId`
  - versioned manifest bucketing across `success`, `manual_review_required`, and `failed`
  - CLI argument parsing and help output
- Added repository helper coverage for:
  - repository-backed detail reads
  - write SQL restricted to editable fields only
  - bootstrap payload application reuse
- Added upload lifecycle coverage for:
  - optional `editSessionId` parsing in signed-url/finalize contracts
  - session-linked promotion and cancelation helpers
  - cleanup that ignores promoted uploads and records blob-delete failures explicitly
