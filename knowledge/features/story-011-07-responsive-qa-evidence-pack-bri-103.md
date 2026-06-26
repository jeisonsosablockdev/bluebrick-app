# STORY-011-07 / BRI-103 Responsive QA Evidence Pack

## Scope
- Admin collections responsive QA evidence for:
  - `/admin/collections`
  - `/admin/collections/[id]`
- Required breakpoints:
  - `320px`
  - `375px`
  - `768px`
  - `1024px`

## What changed
- Added a dedicated responsive Playwright checklist spec:
  - `e2e/admin-collections.responsive.pw.spec.ts`
- Extracted reusable admin collections fixture helper for the story E2E suite:
  - `e2e/helpers/admin-collections-fixture.ts`
- Reused the shared helper from the existing functional flow spec:
  - `e2e/admin-collections-flow.pw.spec.ts`

## Responsive checklist result
- `320px`
  - Index: pass
  - Detail: pass
  - Horizontal overflow: none
  - Primary action height: `44px`
- `375px`
  - Index: pass
  - Detail: pass
  - Horizontal overflow: none
  - Primary action height: `44px`
- `768px`
  - Index: pass
  - Detail: pass
  - Horizontal overflow: none
  - Primary action height: `44px`
- `1024px`
  - Index: pass
  - Detail: pass
  - Horizontal overflow: none
  - Primary action heights:
    - index `Manage project`: `44px`
    - detail `Save summary`: `60px`

## Evidence artifacts
- Generated responsive checklist JSON:
  - `test-results/admin-collections.responsi-d60b3-responsive-QA-evidence-pack-playwright-smoke/admin-collections-responsive-checklist.json`
- Generated screenshots:
  - `test-results/admin-collections.responsi-d60b3-responsive-QA-evidence-pack-playwright-smoke/admin-collections-index-mobile-320.png`
  - `test-results/admin-collections.responsi-d60b3-responsive-QA-evidence-pack-playwright-smoke/admin-collections-detail-mobile-320.png`
  - `test-results/admin-collections.responsi-d60b3-responsive-QA-evidence-pack-playwright-smoke/admin-collections-index-mobile-375.png`
  - `test-results/admin-collections.responsi-d60b3-responsive-QA-evidence-pack-playwright-smoke/admin-collections-detail-mobile-375.png`
  - `test-results/admin-collections.responsi-d60b3-responsive-QA-evidence-pack-playwright-smoke/admin-collections-index-tablet-768.png`
  - `test-results/admin-collections.responsi-d60b3-responsive-QA-evidence-pack-playwright-smoke/admin-collections-detail-tablet-768.png`
  - `test-results/admin-collections.responsi-d60b3-responsive-QA-evidence-pack-playwright-smoke/admin-collections-index-desktop-1024.png`
  - `test-results/admin-collections.responsi-d60b3-responsive-QA-evidence-pack-playwright-smoke/admin-collections-detail-desktop-1024.png`

## Commands
- `npx vitest run tests/api/admin-collections-route.test.ts tests/api/admin-collection-detail-route.test.ts`
- `npx playwright test e2e/admin-collections-flow.pw.spec.ts --project=playwright-smoke`
- `npx playwright test e2e/admin-collections.responsive.pw.spec.ts --project=playwright-smoke`
- `npm run validate`

## Notes
- The responsive run emitted a browser warning for `brand/brids-mark.svg` about width/height aspect-ratio styling. It did not produce horizontal overflow or breakpoint breakage in the validated admin collections routes, so it is recorded as non-blocking for this slice.
