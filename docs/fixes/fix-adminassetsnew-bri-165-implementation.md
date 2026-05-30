# Implementation: `/admin/assets/new` regressions (BRI-165)

## Resolution Strategy

Apply the smallest safe changes that unblock the admin flow:

1. update the initial asset type chooser to the new investment strategy labels,
2. relax upload finalization so `ETag` is treated as advisory metadata rather than a hard validation gate,
3. restore quick import interaction and file acceptance so drag and drop works and supported source files are ingested,
4. keep the existing PDF import normalization path unchanged so commercial descriptions continue to auto-fill,
5. keep the current single-language storage model unchanged in this fix,
6. add edit-session lifecycle wiring to `/admin/assets/new` uploads so abandoned create sessions can be canceled and reconciled,
7. generate SEO-friendly image object names before upload so public Blob URLs carry useful asset context,
8. align location entry across `/admin/assets/new` and `/admin/collections` with Google Maps place selection and first-class postal code handling,
9. harden Pinata metadata generation errors so `Pinata request failed.` becomes actionable during the create/mint path.
10. make PDF quick import production-safe by avoiding runtime resolution of the packaged `pdf.worker.mjs` asset in Vercel serverless functions.

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
- Use a 15-day default abandoned-upload retention window, while keeping `ORPHAN_UPLOAD_ABANDONED_RETENTION_DAYS` as an explicit override.
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

### Slice BRI-165-13
- Replace the uncomfortable manual location-entry pattern in `/admin/assets/new` with a Google Maps place-selection flow that reuses the existing `/admin/collections` integration where possible.
- Confirm the existing `/admin/collections` location editor remains supported and consistent with the new-asset flow instead of diverging into two address models.
- Add `postalCode` as a first-class location field for both creation and existing-project editing surfaces where location is edited.
- When a Google Maps place is selected, extract and persist structured address parts:
  - `address` or address line,
  - `city`,
  - `state`,
  - `country`,
  - `postalCode`,
  - `geoLat`,
  - `geoLng`,
  - reduced `googleMapsPlace` payload when supported.
- Keep manual editing as a fallback when Google Maps is unavailable or the operator needs to correct provider data.
- Avoid duplicating postal code inside the street address if `postalCode` is present separately.
- Verify marketplace detail/listing rendering shows location clearly and includes postal code in the correct place without hiding it at the end of an ambiguous address string.
- Add or update tests for:
  - Google Maps place selection hydrating `/admin/assets/new` location fields,
  - `/admin/collections` location editing preserving `postalCode`,
  - create/marketplace payload propagation of `postalCode`,
  - marketplace display formatting with and without `postalCode`,
  - fallback/manual entry behavior when Maps is not configured.
- Implementation evidence:
  - `/admin/assets/new` now has an admin-only Google Maps lookup path and keeps manual fields available as fallback.
  - Google Place Details hydrates address line, city, state/province, country, postal code, latitude, longitude, and the reduced `googleMapsPlace` payload.
  - `postalCode` is persisted through marketplace creation, collection editing, bootstrap mapping, and a dedicated `marketplace_entries.postal_code` migration.
  - Marketplace detail rendering shows postal code separately and strips a trailing duplicate from the address line when needed.
  - Targeted tests, `typecheck`, `lint`, and `validate` passed for this slice.

### Slice BRI-165-14
- Investigate `Pinata request failed.` in the Core Candy Machine metadata step used from `/admin/assets/new`.
- Improve `lib/pinata-file-service.ts` error extraction so Pinata API responses without the current expected shape still surface status, provider code/message, and safe diagnostic context.
- Keep `PINATA_JWT` absence as the explicit local metadata fallback path; do not treat missing Pinata config as a failed create flow when fallback is intended.
- Distinguish provider request failures from source-image fetch/read failures so operators know whether the issue is Pinata credentials/API, Blob/source URL reachability, or metadata payload validation.
- Ensure admin route responses from `app/api/admin/core-candy-machine/metadata/route.ts` preserve structured error codes/statuses and do not collapse everything into `Pinata request failed.`
- Add regression coverage for:
  - Pinata JSON pin failure with an unstructured response body,
  - Pinata file pin failure with an unstructured response body,
  - source image fetch failure,
  - local metadata fallback when Pinata is not configured.
- Capture one QA note showing the admin-facing message is actionable and does not encourage blind retries.
- Implementation evidence:
  - Pinata API failures now include provider status, provider code, and a safe provider-response message when available.
  - Non-JSON provider bodies are surfaced as bounded diagnostic text instead of collapsing to `Pinata request failed.`
  - Source image download/read failures keep their own `PINATA_SOURCE_*` codes and do not look like Pinata credential/API failures.
  - The admin metadata route now returns structured error payloads for Pinata failures while preserving the local metadata provider path when `PINATA_JWT` is not configured.
  - Targeted Pinata/Core Candy tests, `typecheck`, `lint`, and `validate` passed for this slice.

### Slice BRI-165-15
- Investigate the production Quick Import PDF error:
  - `Cannot find module 'pdfjs-dist/legacy/build/pdf.worker.mjs'`
  - require stack ending at the Vercel function package root.
- Keep the app-owned Node worker isolation for PDF parsing so expensive parsing does not run directly in the route handler.
- Stop resolving or importing the `pdfjs` packaged worker file from the production runtime bundle.
- Use the `pdfjs` API bundle with worker execution disabled inside the app-owned worker thread.
- Preserve the current brief normalization and commercial description mapping after text extraction.
- Add regression coverage proving the embedded worker source no longer references `pdf.worker.mjs` and configures `pdfjs` parsing without its packaged worker.
- Confirm with a real admin brief PDF locally that text extraction still succeeds.
- Implementation evidence:
  - `asset-pdf-server.ts` still runs PDF extraction inside the app-owned Node worker, but no longer resolves `pdfjs-dist/legacy/build/pdf.worker.mjs`.
  - `pdfjs.getDocument` is called with `disableWorker: true` inside that worker, avoiding Vercel serverless filesystem dependency on the packaged worker asset.
  - A real Brandon brief PDF extracted first-page text locally with `disableWorker: true`, confirming the parser can still read the current brief format.
  - Targeted PDF worker and import-preview tests, `lint`, and `typecheck` passed for this hotfix.

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
- SEO image naming falls back safely when asset context is incomplete and never bypasses MIME, extension, size, or checksum validation,
- Google Maps place selection and `postalCode` propagation produce consistent admin and marketplace location rendering,
- Pinata errors expose actionable diagnostics while preserving the non-Pinata fallback path.
- PDF parsing does not reference `pdf.worker.mjs` at runtime and still extracts text through the app-owned Node worker.

## Final Review

- A final clean-code audit is required before completion.
- The final review must confirm the implementation slices are locally scoped and that no blocking maintainability issues remain.
- The upload lifecycle follow-up must explicitly check that new asset creation and collection-editor upload lifecycles share backend helpers instead of introducing parallel cleanup rules.
- The SEO naming follow-up must confirm generated names are descriptive without keyword stuffing and remain deterministic enough for tests.
- The location follow-up must confirm `/admin/assets/new`, `/admin/collections`, and marketplace rendering share one coherent location contract and do not fork postal-code semantics.
- The Pinata follow-up must confirm no secrets are logged or returned while still surfacing enough provider/source context for operators.

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
  - Google Maps/postal-code regression output for new asset creation, collection editing, and marketplace rendering,
  - Pinata metadata route/service regression output for provider failures and fallback behavior,
  - PDF worker regression output showing production-safe workerless `pdfjs` parsing,
  - explicit clean-code pass or no-blockers result
