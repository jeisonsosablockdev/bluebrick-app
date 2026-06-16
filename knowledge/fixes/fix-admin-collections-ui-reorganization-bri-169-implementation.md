# Implementation: Admin Collections UI Reorganization (BRI-169)

## Status
- Current slice: complete, ready for final PR to `develop`
- Parent issue: `BRI-169`
- Initiative branch: `initiative/bri-169-admin-collections-ui-reorganization`
- S01 branch: `fix/app-admin-collections-ui-reorganization-bri-169-s01-spec`
- Workflow: `.codex/workflows/frontend-cycle.md`
- Additional workflow for delivery closeout: `.codex/workflows/responsive-qa.md`

## Governing Decisions
- This is a multi-slice `fix/app` initiative.
- S01 owns the artifact pair, slice map, tests-first contract, and Linear sync before implementation begins.
- Delivery slices must start from `initiative/bri-169-admin-collections-ui-reorganization` by passing `--base initiative/bri-169-admin-collections-ui-reorganization` to `npm run task:init`.
- No server authority boundary moves into the browser. Client UI may organize state and drafts, but ownership, snapshot evidence, editable sections, and admin eligibility remain server-authoritative.
- Motion is not required for the base reorganization. If a delivery slice adds motion, it must use Motion 12 current syntax from `motion/react`, respect `prefers-reduced-motion`, and document the interaction purpose.
- No OpenAI Developers tooling is expected for this UI-only fix.

## Slice Plan
| Slice | Status | Branch | Objective | Scope | Validation | PR |
| --- | --- | --- | --- | --- | --- | --- |
| S01 | complete | `fix/app-admin-collections-ui-reorganization-bri-169-s01-spec` | Lock the problem, UX direction, slice map, and tests-first gates. | Fix artifact pair plus the initiative-target preflight false positive discovered while opening the spec PR. | `npm run validate:docs-governance`; `npx vitest run tests/lib/pr-governance-contracts.test.ts`; GitHub CI | #252 |
| S02 | complete | `fix/app-admin-collections-ui-reorganization-bri-169-s02-index-workspace` | Rework `/admin/collections` into a compact operations workspace. | `app/admin/collections/page.tsx`, `components/admin/admin-collections-*`, index tests, auth/session docs. | `npx vitest run tests/app/admin-collections-page.test.ts`; `npx eslint app/admin/collections/page.tsx components/admin/admin-collections-card-grid.tsx tests/app/admin-collections-page.test.ts`; `npx playwright test e2e/admin-collections-flow.pw.spec.ts --project=playwright-smoke`; GitHub CI | #253 |
| S03 | complete | `fix/app-admin-collections-ui-reorganization-bri-169-s03-detail-ia` | Reorder `/admin/collections/[id]` around editable work first and reference metadata second. | detail shell, hero, blockchain/reference placement, detail page tests, auth/session docs. | `npx vitest run tests/app/admin-collection-detail-page.test.ts`; `npx eslint app/admin/collections/[id]/page.tsx components/admin/admin-collection-detail-hero.tsx components/admin/admin-collection-detail-shell.tsx tests/app/admin-collection-detail-page.test.ts`; `npx playwright test e2e/admin-collections-flow.pw.spec.ts --project=playwright-smoke`; GitHub CI | #254 |
| S04 | complete | `fix/app-admin-collections-ui-reorganization-bri-169-s04-editor-consistency` | Align mounted editor surfaces and section shells without changing persistence. | property editor copy, location status copy, gallery reference shell, fallback detail sections, loading/error states, blockchain reference label, auth/session docs. | `npx vitest run tests/app/admin-collection-detail-page.test.ts`; `npx eslint app/admin/collections/[id]/page.tsx app/admin/collections/[id]/loading.tsx components/admin/admin-collection-property-information-editor.tsx components/admin/admin-collection-location-editor.tsx components/admin/admin-collection-gallery-shell.tsx components/admin/admin-collection-blockchain-base-panel.tsx components/admin/admin-collection-detail-sections.tsx components/admin/admin-collection-location-shell.tsx tests/app/admin-collection-detail-page.test.ts`; `npm run validate:docs-governance`; `npx playwright test e2e/admin-collections-flow.pw.spec.ts --project=playwright-smoke`; GitHub CI | #255 |
| S05 | complete | `fix/app-admin-collections-ui-reorganization-bri-169-s05-health-responsive-qa` | Align health queue, complete responsive QA, clean-code pass, and Linear/docs closeout. | health workspace, health page copy, e2e responsive evidence, docs sync. | `npx vitest run tests/app/admin-collections-health-page.test.ts`; `npx eslint app/admin/health/collections/page.tsx components/admin/admin-collections-health-workspace.tsx tests/app/admin-collections-health-page.test.ts`; `npx playwright test e2e/admin-collections.responsive.pw.spec.ts --project=playwright-smoke`; `npm run validate`; clean-code pass; GitHub CI | #256 |

## Tests First Contract
S02 must update or add tests before implementation for:
- index copy that removes planning-era language and preserves server-authority messaging only where it is user-relevant
- ready/review summary rendering
- collection actions for linked and review-required rows

S03 must update or add tests before implementation for:
- detail page no longer showing stale future-slice copy
- editable sections appearing before read-only blockchain/reference metadata
- back navigation remaining available

S04 must update or add tests before implementation for:
- consistent section labels/status affordances
- document editor preserving drag-and-drop upload, 10 MB warning, and LovePDF guidance
- no regression in PATCH section scope for mounted editors

S05 must update or add tests/evidence before closeout for:
- health queue state labels and context actions
- no horizontal overflow at 320, 375, 768, and 1024 widths
- primary touch targets at least 44px high

## Delivery Gates
- Required artifacts exist before product-code implementation.
- Each delivery slice opens from the initiative branch and targets the initiative branch.
- Each delivery slice runs its targeted tests.
- Browser-critical closeout captures responsive evidence at 320, 375, 768, and 1024 widths.
- Final initiative PR to `develop` runs `npm run validate`.
- Final reviewer pass includes explicit clean-code findings or explicit no-findings result.
- Linear `BRI-169` is updated after S01 and after each merged delivery slice.

## Validation Notes
- `npm run validate:docs-governance` covers the governing artifacts for S01.
- `npx vitest run tests/lib/pr-governance-contracts.test.ts` covers the S01 preflight-script correction that prevents GitHub's synthetic merge commit from failing initiative-target PR commit convention checks.
- Product-code delivery slices inherit the full frontend Definition of Done from `AGENTS.md`, including `npm run validate` at the initiative closeout.
- No `validate:db` special handling is expected because this initiative does not touch migrations or persistence code.

## Known Constraints
- The existing `Card` component uses the BRIDS glass admin language and `rounded-2xl`; delivery slices should keep that system unless a local component explicitly needs a denser inner row treatment.
- The global admin module placeholder may remain in place, but delivery slices should reduce redundant `highlights` and product-facing implementation notes on the collection pages.
- The BRI-165 document upload workflow is canonical and must not be replaced by link-only document editing.

## Linear Sync
After S01 lands, update `BRI-169` with:
- artifact paths
- final slice map
- branch map
- S01 validation result
- note that implementation remains blocked until S01 is merged into the initiative branch
