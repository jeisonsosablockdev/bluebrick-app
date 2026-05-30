# Implementation: `/admin/assets/new` regressions (BRI-165)

## Resolution Strategy

Apply the smallest safe changes that unblock the admin flow:

1. update the initial asset type chooser to the new investment strategy labels,
2. relax upload finalization so `ETag` is treated as advisory metadata rather than a hard validation gate,
3. restore quick import interaction and file acceptance so drag and drop works and supported source files are ingested,
4. keep the existing PDF import normalization path unchanged so commercial descriptions continue to auto-fill,
5. keep the current single-language storage model unchanged in this fix.

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

## Test-First Contract

Targeted regression coverage will verify:

- the initial asset type selector uses the new strategy labels and subtitles,
- upload finalization succeeds when `ETag` values do not line up exactly,
- step 1 quick import accepts drag and drop and ingests supported source files,
- PDF import still produces the expected normalized description fields,
- the current asset creation flow remains single-language.

## Final Review

- A final clean-code audit is required before completion.
- The final review must confirm the implementation slices are locally scoped and that no blocking maintainability issues remain.

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
  - explicit clean-code pass or no-blockers result
