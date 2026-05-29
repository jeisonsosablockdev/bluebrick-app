# Implementation: `/admin/assets/new` regressions (BRI-165)

## Resolution Strategy

Apply the smallest safe changes that unblock the admin flow:

1. tighten the `?` guidance trigger so it behaves like a local tooltip affordance,
2. relax upload finalization so `ETag` is treated as advisory metadata rather than a hard validation gate,
3. add regression tests around the tooltip component and the upload finalize route,
4. keep the existing PDF import normalization path unchanged so commercial descriptions continue to auto-fill.

## Slice Plan

### Slice BRI-165-1
- Update the shared guidance tooltip component under `components/admin/asset-creation/sections/`.
- Ensure the tooltip only appears from the local icon interaction and stays anchored to the icon container.
- Add a component-level regression test for the tooltip affordance.

### Slice BRI-165-2
- Update `app/api/admin/assets/uploads/[uploadId]/finalize/route.ts`.
- Stop hard-failing when the browser `ETag` and storage `ETag` differ if the object has already passed checksum, size, and MIME validation.
- Persist the storage `ETag` when available, but do not block finalization on mismatch.
- Add a route-level regression test that proves finalization succeeds when `ETag` values differ.

### Slice BRI-165-3
- Leave the existing PDF quick-import normalization path intact.
- Verify the PDF parser still populates the commercial description fields through the current import mapping.

## Test-First Contract

Targeted regression coverage will verify:

- tooltip content is not effectively global UI noise,
- local hover/focus on the `?` trigger exposes the tooltip,
- upload finalization succeeds when `ETag` values do not line up exactly,
- PDF import still produces the expected normalized description fields.

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
