# Fix: `/admin/assets/new` regressions (BRI-165)

## Problem

The admin asset creation flow has a few regressions that block day-to-day use:

- step 0 asset type selection still shows the old asset categories instead of the new investment strategies,
- file uploads can fail during finalization when the storage `ETag` does not match the browser response header,
- step 1 quick import does not accept drag and drop,
- step 1 quick import does not load PDFs,
- step 1 quick import does not accept table formats such as `xls`, `xlsx`, or `csv`,
- PDF-backed quick import must keep populating commercial descriptions from the existing brief parser path,
- the commercial description content should remain a single canonical source of truth in the current locale-driven UI.

## Why It Matters

- Operators lose confidence in the create flow when cover uploads fail on otherwise valid files.
- Operators also need the initial asset type step to map to the new product language so they can classify assets correctly.
- Quick import becomes unusable when drag and drop does not work or common source files are rejected.
- The admin brief workflow already auto-derives commercial descriptions; regressions here would break the import path that operators rely on.
- The form should remain easy to review without introducing a second, disconnected content model.

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
- no new multilingual storage model is introduced in this fix.

## Current Gaps

- The asset type selector still exposes the older category names instead of the new strategy labels.
- The upload finalization step treats `ETag` mismatch as a hard failure even though size, MIME type, and checksum already validate the object.
- The quick import step does not currently accept the file interaction and source formats operators expect.
- The admin import flow already supports brief parsing, but the overall slice needs to stay aligned and regression-free while the upload fix lands.

## Open Questions

- Should `/admin/assets/new` remain single-language, or should it support multiple languages in a future slice? This fix does not introduce a multilingual storage model, so any move to multi-language needs a separate decision and implementation plan.

## Acceptance Mapping

1. Cover image and document uploads finalize successfully when the storage `ETag` is absent or does not exactly match the browser response header.
2. The initial asset type selector uses `FIX & FLIP`, `FIX & HOLD`, and `REAL ESTATE DEV` with the new descriptive subtitles.
3. Step 1 quick import accepts drag and drop and ingests PDF, `xls`, `xlsx`, and `csv` source files.
4. PDF quick import continues to populate `shortDescription`, `longDescription`, and `investmentThesis` from the existing brief parser path.
5. No new content-language storage model is introduced.
6. Existing validation, import, and marketplace creation behavior remains intact.
