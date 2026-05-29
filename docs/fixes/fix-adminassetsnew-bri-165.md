# Fix: `/admin/assets/new` regressions (BRI-165)

## Problem

The admin asset creation flow has a few regressions that block day-to-day use:

- the `?` guidance affordance is too visually broad and needs to behave like a true local tooltip trigger,
- file uploads can fail during finalization when the storage `ETag` does not match the browser response header,
- PDF-backed quick import must keep populating commercial descriptions from the existing brief parser path,
- the commercial description content should remain a single canonical source of truth in the current locale-driven UI.

## Why It Matters

- Operators lose confidence in the create flow when cover uploads fail on otherwise valid files.
- Tooltip guidance becomes noisy instead of contextual when it is visible outside the icon interaction.
- The admin brief workflow already auto-derives commercial descriptions; regressions here would break the import path that operators rely on.
- The form should remain easy to review without introducing a second, disconnected content model.

## Expected Outcome

`/admin/assets/new` should keep the current brief-driven import behavior, but:

- the `?` helper should only reveal its tooltip on local hover/focus,
- valid uploads should finalize successfully even when the storage layer returns a different `ETag` shape than the browser upload response,
- PDF import should continue to hydrate the commercial description fields from the existing normalization pipeline,
- no new multilingual storage model is introduced in this fix.

## Current Gaps

- Tooltip rendering is too easy to perceive as global noise instead of local guidance.
- The upload finalization step treats `ETag` mismatch as a hard failure even though size, MIME type, and checksum already validate the object.
- The admin import flow already supports brief parsing, but the overall slice needs to stay aligned and regression-free while the upload fix lands.

## Acceptance Mapping

1. `?` help behaves like a local tooltip and does not leak visually beyond the trigger interaction.
2. Cover image and document uploads finalize successfully when the storage `ETag` is absent or does not exactly match the browser response header.
3. PDF quick import continues to populate `shortDescription`, `longDescription`, and `investmentThesis` from the existing brief parser path.
4. No new content-language storage model is introduced.
5. Existing validation, import, and marketplace creation behavior remains intact.
