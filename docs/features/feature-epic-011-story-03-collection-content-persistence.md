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
