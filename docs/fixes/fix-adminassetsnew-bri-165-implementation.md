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
11. keep the live Phantom wallet adapter recoverable for admin deploy after SIWS/session refreshes.
12. allow marketplace image rendering for Vercel Blob URLs produced by the admin upload pipeline.
13. require Core Candy Machine deploy to finalize a verified mint snapshot before `/admin/assets/new` enables marketplace entry creation.
14. carry `/admin/assets/new` gallery and property uploads through the marketplace create handoff and render them on marketplace detail pages.

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
- Add explicit Next/Vercel output-file tracing for the `pdfjs-dist` package metadata, API bundle, and fake-worker bundle because `pdfjs` can still import `pdf.worker.mjs` from `pdf.mjs` when worker execution is disabled.
- Preserve the current brief normalization and commercial description mapping after text extraction.
- Add regression coverage proving the embedded worker source no longer directly resolves `pdf.worker.mjs`, configures `pdfjs` parsing without a separate worker thread, and keeps both the `pdfjs` API bundle and fake-worker bundle in the production serverless trace.
- Confirm with a real admin brief PDF locally that text extraction still succeeds.
- Implementation evidence:
  - `asset-pdf-server.ts` still runs PDF extraction inside the app-owned Node worker, but no longer resolves `pdfjs-dist/legacy/build/pdf.worker.mjs`.
  - `pdfjs.getDocument` is called with `disableWorker: true` inside that worker, avoiding Vercel serverless filesystem dependency on the packaged worker asset.
  - `next.config.ts` includes the `pdfjs-dist` package metadata, `legacy/build/pdf.mjs`, and `legacy/build/pdf.worker.mjs` in the `/api/admin/assets/import-preview` serverless trace so production can resolve both the API bundle and `pdfjs` fake-worker import.
  - A real Brandon brief PDF extracted first-page text locally with `disableWorker: true`, confirming the parser can still read the current brief format.
  - Targeted PDF worker/import-preview/tracing tests, `lint`, `typecheck`, and `validate` passed for this hotfix.

### Slice BRI-165-16
- Investigate the admin deploy state where the UI reports:
  - `Connected wallet: Not connected`
  - while the admin session/header still shows an authenticated wallet.
- Keep the distinction between:
  - authenticated SIWS/admin session used for server authorization, and
  - live wallet-adapter connection required to sign deploy transactions.
- Enable wallet-adapter auto-connect in the shared runtime so Phantom reconnects after refresh/navigation when the user previously authorized it.
- Update `WalletModal` so an active SIWS wallet session with a disconnected adapter can reconnect Phantom without forcing sign-out/sign-in.
- Validate that reconnecting through the modal does not run SIWS again and does not silently accept a different wallet than the active session.
- Add regression coverage for:
  - wallet runtime provider passing `autoConnect`,
  - wallet modal exposing a reconnect action for an authenticated wallet session with disconnected adapter,
  - reconnect path calling wallet adapter `connect` without invoking SIWS.
- Implementation evidence:
  - `WalletRuntimeProvider` now enables wallet-adapter `autoConnect`, allowing Phantom to recover after admin navigation/refresh when previously authorized.
  - `WalletModal` now shows `Reconnect wallet` for active wallet sessions whose live adapter is disconnected, and calls the adapter `connect` path without rerunning SIWS.
  - Reconnect validates the recovered public key against the active session public key before closing the modal.
  - Targeted wallet modal/runtime tests, `lint`, and `typecheck` passed for this slice.

### Slice BRI-165-17
- Investigate the marketplace/detail error after successful mint:
  - `Invalid src prop (...) on next/image`
  - hostname `*.public.blob.vercel-storage.com` is not configured under `images`.
- Keep the remote image allowlist explicit and narrow.
- Add a `next.config.ts` `images.remotePatterns` entry for Vercel Blob public objects generated under `/admin-assets/**`.
- Verify marketplace cover/gallery/property image URLs from `/admin/assets/new` are accepted without opening arbitrary remote image hosts.
- Add regression coverage for the Vercel Blob image remote pattern.

### Slice BRI-165-18
- Investigate the deploy handoff where `/admin/assets/new` creates marketplace entries even though `asset_mint_snapshots`, `mint_jobs`, and `asset_mint_onchain_proofs` remain empty.
- Wire the existing `finalizeSnapshot` helper in `components/admin/core-candy-machine-panel.tsx` into the successful deploy path before `onDeployCompleted` is emitted.
- Keep transaction submission and confirmation behavior intact, but do not mark deploy as complete for `Create Asset` when snapshot finalization fails or returns `canCreateAsset: false`.
- Preserve `onSnapshotFinalized` so `/admin/assets/new` stores the returned `snapshotId` and sends it to `app/api/admin/marketplace/entries/route.ts`.
- Keep pending-background-confirmation deploys visible to the operator, but block marketplace entry creation until a verified snapshot exists.
- Add regression coverage for:
  - verified snapshot finalization before deploy completion,
  - blocked deploy completion when snapshot verification is degraded or failed.
- Implementation evidence:
  - `runDeployFlow` now finalizes `/api/admin/core-candy-machine/snapshot/finalize` after confirmed deploy transactions and before `onDeployCompleted`.
  - `onDeployCompleted` only fires when the snapshot response has `canCreateAsset: true`.
  - Snapshot verification errors stay visible in the panel and the Create Asset gate remains blocked instead of creating a marketplace entry with `snapshotId: null`.

### Slice BRI-165-19
- Investigate why images uploaded in `/admin/assets/new` exist in Vercel Blob and `asset_uploaded_files`, but do not appear on `/marketplace/[id]`.
- Extend the marketplace create handoff to send the active `draftId` and `uploadRefs` with `Create Asset`.
- Resolve finalized uploads server-side through `listUploadedFileRefsByDraftId` and reuse the existing collection bootstrap mapper to build `gallery_images_json` and `property_images_json`.
- Insert the media JSON fields with the marketplace entry so `/admin/collections` and marketplace detail share one image item contract.
- Extend the persisted marketplace read model and `PropertyDetail` DTO to expose gallery/property images.
- Render a compact marketplace media section on `/marketplace/[id]` when gallery or property images exist, without replacing the existing cover image.
- Add regression coverage for:
  - marketplace entry API resolving `uploadRefs` into media JSON,
  - repository INSERT carrying `gallery_images_json` and `property_images_json`,
  - persisted marketplace rows mapping media images into `PropertyDetail`,
  - detail UI rendering gallery/property media.
- Implementation evidence:
  - Uploaded image objects remain in Vercel Blob and their original upload audit trail is preserved.
  - Marketplace detail no longer depends only on `image_url`; attached gallery/property images are visible from the same persisted entry.

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
- PDF parsing does not directly resolve `pdf.worker.mjs` from app code, keeps the `pdfjs` API/fake-worker bundles in the production trace, and still extracts text through the app-owned Node worker.
- Admin deploy can recover the live Phantom signer after navigation/refresh without clearing the authenticated admin session.
- Next Image allows Vercel Blob URLs under `/admin-assets/**` so minted assets can be opened in marketplace immediately after creation.
- Core Candy Machine deploy finalizes a verified snapshot before enabling Create Asset and blocks deploy completion when the snapshot is not ready.
- Marketplace create handoff persists and renders gallery/property images uploaded during `/admin/assets/new`.

## Final Review

- A final clean-code audit is required before completion.
- The final review must confirm the implementation slices are locally scoped and that no blocking maintainability issues remain.
- The upload lifecycle follow-up must explicitly check that new asset creation and collection-editor upload lifecycles share backend helpers instead of introducing parallel cleanup rules.
- The SEO naming follow-up must confirm generated names are descriptive without keyword stuffing and remain deterministic enough for tests.
- The location follow-up must confirm `/admin/assets/new`, `/admin/collections`, and marketplace rendering share one coherent location contract and do not fork postal-code semantics.
- The Pinata follow-up must confirm no secrets are logged or returned while still surfacing enough provider/source context for operators.
- The wallet reconnect follow-up must confirm reconnecting the adapter does not bypass SIWS authorization and rejects mismatched wallet addresses.
- The Vercel Blob image follow-up must confirm the allowlist remains scoped to HTTPS `admin-assets` URLs instead of allowing all remote hosts.
- The deploy snapshot follow-up must confirm marketplace entries cannot be created from `/admin/assets/new` without a verified `snapshotId`.
- The marketplace media follow-up must confirm gallery/property images use the existing collection media item contract instead of a parallel format.

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
  - PDF worker regression output showing production-safe `pdfjs` API and fake-worker tracing,
  - wallet runtime/modal regression output for admin deploy signer recovery,
  - Next Image config regression output for Vercel Blob admin-assets URLs,
  - deploy snapshot gate regression output proving snapshot finalization precedes Create Asset enablement,
  - marketplace media handoff regression output proving uploaded gallery/property images are persisted and rendered,
  - explicit clean-code pass or no-blockers result
