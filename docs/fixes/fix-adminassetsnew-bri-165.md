# Fix: `/admin/assets/new` regressions (BRI-165)

## Problem

The admin asset creation flow has a few regressions that block day-to-day use:

- step 0 asset type selection still shows the old asset categories instead of the new investment strategies,
- file uploads can fail during finalization when the storage `ETag` does not match the browser response header,
- step 1 quick import does not accept drag and drop,
- step 1 quick import does not load PDFs,
- step 1 quick import does not accept table formats such as `xls`, `xlsx`, or `csv`,
- PDF-backed quick import must keep populating commercial descriptions from the existing brief parser path,
- the commercial description content should remain a single canonical source of truth in the current locale-driven UI,
- location entry is currently uncomfortable and ambiguous because postal code is embedded inside free-form address text, while `/admin/collections` already has a Google Maps place integration that can provide structured address parts,
- the Core Candy Machine metadata step can fail with the generic message `Pinata request failed.`, leaving operators without enough information to know whether the problem is credentials, Pinata API response, source image fetch, or provider fallback,
- PDF quick import can still fail in production serverless builds when `pdfjs` tries to resolve its packaged `pdf.worker.mjs` file from the deployed function bundle,
- uploads finalized during `/admin/assets/new` are not tied to an edit session, so abandoned form sessions can leave image and document objects in Blob and DB after the admin restarts the flow,
- uploaded image object names are derived mostly from the original local file name, so generic names such as `IMG_1234`, `whatsapp-image`, or `caratula` can become public CDN URLs instead of descriptive SEO-friendly asset media names.

## Why It Matters

- Operators lose confidence in the create flow when cover uploads fail on otherwise valid files.
- Operators also need the initial asset type step to map to the new product language so they can classify assets correctly.
- Quick import becomes unusable when drag and drop does not work or common source files are rejected.
- The admin brief workflow already auto-derives commercial descriptions; regressions here would break the import path that operators rely on.
- The form should remain easy to review without introducing a second, disconnected content model.
- Location quality affects operator confidence and marketplace accuracy; postal code should not be hidden at the end of a street-address string when city/state/country and coordinates already have first-class fields.
- Pinata failures happen late in the create/mint path, so vague provider errors can make operators retry blindly and risk duplicate work or abandoned uploads.
- PDF parsing must be compatible with Vercel's serverless bundle tracing; otherwise a PDF that works locally can fail in production before the import mapper sees any text.
- Abandoned create sessions should not accumulate storage objects or uploaded-file rows that no asset will ever promote.
- The backend already has edit-session lifecycle fields and an orphan reconciler; `/admin/assets/new` should participate in that lifecycle instead of creating unmanaged uploads.
- Public image URLs are a minor but durable SEO signal; descriptive, hyphenated filenames help Google and other crawlers understand asset media without relying only on surrounding page copy.
- Operators should not need to manually rename every uploaded file before upload just to avoid low-quality CDN object names.

## Expected Outcome

`/admin/assets/new` should keep the current brief-driven import behavior, but:

- the initial asset type chooser should use:
  - `FIX & FLIP` / `Capital Growth`
  - `FIX & HOLD` / `Recurring Income`
  - `REAL ESTATE DEV` / `Projects from scratch`
- valid uploads should finalize successfully even when the storage layer returns a different `ETag` shape than the browser upload response,
- step 1 quick import should accept drag and drop,
- step 1 quick import should accept PDF, `xls`, `xlsx`, and `csv` inputs,
- PDF import should continue to hydrate the commercial description fields from the existing normalization pipeline,
- `/admin/assets/new` and `/admin/collections` location editing should share the Google Maps place-selection pattern where possible, and `postalCode` should become a first-class field rather than being buried inside `address`,
- marketplace detail/listing views should display the resulting location clearly, including postal code when present, without duplicating it in the address line,
- Pinata metadata failures should return actionable diagnostics, preserve the current local metadata fallback when Pinata is not configured, and avoid masking source-image fetch problems behind the generic `Pinata request failed.` message,
- PDF quick import should parse inside the app-owned Node worker without requiring the `pdfjs-dist/legacy/build/pdf.worker.mjs` asset to be available in the production function filesystem,
- no new multilingual storage model is introduced in this fix,
- `/admin/assets/new` should generate one `editSessionId` per form session and pass it with every upload,
- uploads from an abandoned or reset form session should become eligible for cancellation and orphan cleanup instead of remaining as unmanaged Blob/DB records,
- abandoned finalized uploads should use a 15-day default retention window before orphan cleanup unless explicitly overridden by `ORPHAN_UPLOAD_ABANDONED_RETENTION_DAYS`,
- uploads from a successful create/mint flow should be promoted so the reconciler does not delete files that are part of the final asset,
- image uploads should get SEO-friendly object names before they are written to Vercel Blob, using asset context plus the original file name when available.

## Current Gaps

- The asset type selector still exposes the older category names instead of the new strategy labels.
- The upload finalization step treats `ETag` mismatch as a hard failure even though size, MIME type, and checksum already validate the object.
- The quick import step does not currently accept the file interaction and source formats operators expect.
- The admin import flow already supports brief parsing, but the overall slice needs to stay aligned and regression-free while the upload fix lands.
- `/admin/collections` already has Google Maps autocomplete/resolve routes and a `googleMapsPlace` payload, while `/admin/assets/new` still relies on manually editing `country`, `state`, `city`, `address`, `geoLat`, and `geoLng`.
- There is no explicit `postalCode` field in the current new-asset location flow, which makes ZIP/postal-code placement unclear and harder to render consistently in marketplace.
- `lib/pinata-file-service.ts` falls back to `Pinata request failed.` when Pinata does not return a structured error payload, and route/UI copy can fail to distinguish Pinata auth/API errors from source-image fetch failures.
- `asset-pdf-server.ts` currently resolves `pdfjs-dist/legacy/build/pdf.worker.mjs` inside the worker source; production deployments can omit that file from the function trace and fail with `Cannot find module 'pdfjs-dist/legacy/build/pdf.worker.mjs'`.
- `uploadAssetFileViaSignedUrl` already accepts `editSessionId`, but `use-asset-upload-workflow.ts` does not pass one from `/admin/assets/new`.
- `asset_upload_contracts` has `edit_session_id`, `promoted_at`, and `canceled_at`, but the new-asset form does not currently promote successful session uploads or cancel abandoned session uploads.
- The orphan reconciler only cleans session-scoped uploads (`edit_session_id IS NOT NULL`), so current new-asset uploads are outside the automatic cleanup path.
- `sanitizeFileName` already lowercases and hyphenates the original file name, but `buildVersionedObjectKey` does not use asset SEO context such as asset name, city, strategy, or internal code.
- Image filenames can therefore remain technically safe but semantically weak for search, especially for mobile-imported files.

## Open Questions

- Should `/admin/assets/new` remain single-language, or should it support multiple languages in a future slice? This fix does not introduce a multilingual storage model, so any move to multi-language needs a separate decision and implementation plan.

## Acceptance Mapping

1. Cover image and document uploads finalize successfully when the storage `ETag` is absent or does not exactly match the browser response header.
2. The initial asset type selector uses `FIX & FLIP`, `FIX & HOLD`, and `REAL ESTATE DEV` with the new descriptive subtitles.
3. Step 1 quick import accepts drag and drop and ingests PDF, `xls`, `xlsx`, and `csv` source files.
4. PDF quick import continues to populate `shortDescription`, `longDescription`, and `investmentThesis` from the existing brief parser path.
5. No new content-language storage model is introduced.
6. Existing validation, import, and marketplace creation behavior remains intact.
7. `/admin/assets/new` assigns a stable `editSessionId` for the active form session and sends it with signed-url and finalize upload calls.
8. Successful asset creation promotes finalized uploads for that `editSessionId` so retained files are explicit.
9. Reset, back-out, or explicit cancel behavior marks unpromoted session uploads as canceled where possible.
10. Abandoned session uploads are eligible for orphan reconciliation after the configured retention windows, with Blob objects removed before DB rows are deleted.
11. Image object names generated before upload are lowercase, hyphenated, ASCII-safe, and include natural asset context when available.
12. SEO filename generation never changes MIME validation, checksum validation, upload category policy, or the stored original file name audit trail.
13. Location editing uses Google Maps place selection where available, persists/displays `postalCode` separately, and renders the final marketplace location without duplicated or hidden ZIP/postal-code text.
14. Pinata metadata generation failures return actionable admin-facing errors and preserve the non-Pinata/local metadata fallback when Pinata is not configured.
15. PDF quick import no longer depends on resolving the packaged `pdf.worker.mjs` file at production runtime and still extracts brief text for the current mapper.
