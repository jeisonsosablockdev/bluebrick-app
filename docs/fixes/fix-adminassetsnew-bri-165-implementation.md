# Implementation: `/admin/assets/new` regressions (BRI-165)

## Resolution Strategy

Apply the smallest safe changes that unblock the admin flow:

1. update the initial asset type chooser to the new investment strategy labels,
2. relax upload finalization so `ETag` is treated as advisory metadata rather than a hard validation gate,
3. restore quick import interaction and file acceptance so drag and drop works and supported source files are ingested,
4. keep the existing PDF import normalization path unchanged so commercial descriptions continue to auto-fill,
5. keep the current single-language storage model unchanged in this fix,
6. add edit-session lifecycle wiring to `/admin/assets/new` uploads so abandoned create sessions can be canceled and reconciled,
7. generate SEO-friendly image object names before upload so public Blob URLs carry useful asset context.

## Slice Plan

### Slice BRI-165-1
- Update the initial asset type chooser to show:
  - `FIX & FLIP` / `Capital Growth`
  - `FIX & HOLD` / `Recurring Income`
  - `REAL ESTATE DEV` / `Projects from scratch`
- Keep the selection logic and downstream asset creation contract intact.

### Slice BRI-165-2
- Update `app/api/admin/assets/uploads/[uploadId]/finalize/route.ts`.
- Stop hard-failing when the browser `ETag` and storage `ETag` differ if the object has already passed checksum, size, and MIME validation.
- Persist the storage `ETag` when available, but do not block finalization on mismatch.
- Add a route-level regression test that proves finalization succeeds when `ETag` values differ.

### Slice BRI-165-3
- Restore step 1 quick import interaction so drag and drop works and supported file inputs are accepted.
- Ensure the current import pipeline ingests PDFs and table formats (`xls`, `xlsx`, `csv`).

### Slice BRI-165-4
- Leave the existing PDF quick-import normalization path intact for commercial description hydration.
- Verify the PDF parser still populates the commercial description fields through the current import mapping.

### Slice BRI-165-5
- Confirm the current asset creation flow remains single-language in this fix.
- Do not introduce a new multilingual storage model or persistence layer in this change.

### Slice BRI-165-6
- Run the final clean-code audit on the full `/admin/assets/new` diff.
- Verify naming, duplication, dead code, and slice boundaries before merge.
- Capture any blocking findings and resolve them before closing the integration branch.

### Slice BRI-165-7
- Generate a stable `editSessionId` for each `/admin/assets/new` form session.
- Pass that `editSessionId` through `use-asset-upload-workflow.ts` into `uploadAssetFileViaSignedUrl`.
- Ensure signed-url and finalize requests persist the session identifier through the existing upload contract.
- Keep existing upload refs and form field hydration behavior intact.

### Slice BRI-165-8
- Promote finalized uploads for the active `editSessionId` only after the asset create/mint flow succeeds.
- Add or reuse a server route/action that calls `promoteEditSessionUploads` with `draftId`, `editSessionId`, and the admin actor.
- Verify promoted uploads are retained and no longer eligible for orphan cleanup.

### Slice BRI-165-9
- Add explicit cancel/reset handling for `/admin/assets/new` sessions.
- Mark unpromoted uploads for the active session as canceled through `cancelEditSessionUploads` where the admin intentionally resets or backs out.
- Do not block navigation on best-effort cancellation failures; surface only actionable errors in the admin UI.

### Slice BRI-165-10
- Verify orphan reconciliation covers abandoned new-asset uploads because they now carry `editSessionId`.
- Add regression coverage for temporary finalized uploads that are not promoted and become cleanup candidates after the configured retention window.
- Confirm Blob deletion happens before DB row deletion, preserving the current reconciler safety order.

### Slice BRI-165-11
- Add SEO-aware image filename generation before `buildVersionedObjectKey` writes objects to Vercel Blob.
- Keep the existing safe filename rules: lowercase, hyphenated, ASCII-safe, no special characters, and extension validated against MIME type.
- Build the SEO base name from natural asset context where available, such as asset name, city/state, strategy label, internal code, and upload category.
- Preserve the original local filename in `original_file_name` for audit/debugging, while storing the SEO-renamed file name in the upload contract/object key.
- Avoid keyword stuffing; use a bounded slug length and fall back to the current sanitized original filename when asset context is missing.
- Apply SEO renaming to image categories (`coverImage`, `galleryImage`, `propertyImage`) first; do not rename legal or financial documents unless a later document SEO policy is approved.

### Slice BRI-165-12
- Run the final clean-code audit on the upload lifecycle follow-up.
- Verify no orphan lifecycle helpers are duplicated across admin asset creation and collection-editor flows.
- Verify the SEO naming helper is shared and covered instead of embedding ad hoc filename string logic in UI components.
- Resolve blocking findings before merging the follow-up branch.

## Test-First Contract

Targeted regression coverage will verify:

- the initial asset type selector uses the new strategy labels and subtitles,
- upload finalization succeeds when `ETag` values do not line up exactly,
- step 1 quick import accepts drag and drop and ingests supported source files,
- PDF import still produces the expected normalized description fields,
- the current asset creation flow remains single-language,
- `/admin/assets/new` passes `editSessionId` into signed-url and finalize upload calls,
- successful create/mint completion promotes finalized uploads for the active session,
- reset/cancel behavior marks unpromoted session uploads as canceled,
- the orphan reconciler selects abandoned new-asset uploads after retention and deletes Blob objects before DB rows,
- SEO image naming produces descriptive lowercase hyphenated object names from asset context while preserving original filename audit metadata,
- SEO image naming falls back safely when asset context is incomplete and never bypasses MIME, extension, size, or checksum validation.

## Final Review

- A final clean-code audit is required before completion.
- The final review must confirm the implementation slices are locally scoped and that no blocking maintainability issues remain.
- The upload lifecycle follow-up must explicitly check that new asset creation and collection-editor upload lifecycles share backend helpers instead of introducing parallel cleanup rules.
- The SEO naming follow-up must confirm generated names are descriptive without keyword stuffing and remain deterministic enough for tests.

## Tooling

- `vitest` for unit and route coverage
- existing `npm run lint`
- existing `npm run typecheck`
- `npm run validate` before completion

## Gates

- Frontend-cycle participants: `planner`, `frontend`, `qa`, `docs`, `reviewer`
- Required evidence:
  - updated docs paths,
  - targeted test output,
  - lint/typecheck/validate output,
  - orphan reconciler regression output for canceled/unpromoted uploads,
  - SEO image naming regression output for asset-context filenames and fallback filenames,
  - explicit clean-code pass or no-blockers result
