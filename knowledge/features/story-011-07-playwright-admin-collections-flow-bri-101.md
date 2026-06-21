# STORY-011-07 / BRI-101 / Playwright Admin Collections Flow

## Summary
Add one deterministic Playwright journey for the admin collections module covering index access, detail navigation, allowed section edits, and the immutable cover boundary.

## What Changed
- Added `e2e/admin-collections-flow.pw.spec.ts`:
  - authenticates with a real admin SIWS session
  - loads deterministic admin collections fixture data for `GET /api/admin/collections`
  - navigates into `/admin/collections/[id]`
  - verifies summary, property information, and documents save loops
  - verifies cover remains read-only
- Added `lib/admin/admin-collections-e2e-fixture.ts` and connected it only to:
  - `app/api/admin/collections/route.ts`
  - `app/api/admin/collections/[id]/route.ts`
- Added regression coverage for the fixture path in:
  - `tests/api/admin-collections-route.test.ts`
  - `tests/api/admin-collection-detail-route.test.ts`

## Why
- The page loads its initial state server-side, so browser-only request interception is not enough for deterministic first render coverage.
- This slice keeps auth real and isolates only the initial read state, while still exercising browser-side save behavior through Playwright.

## Validation
- `npx vitest run tests/api/admin-collections-route.test.ts tests/api/admin-collection-detail-route.test.ts`
- `npx playwright test e2e/admin-collections-flow.pw.spec.ts --project=playwright-smoke`
- `npm run validate`
