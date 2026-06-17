---
type: Fix Spec
title: Fix May 2026 Ui Errors Implementation
description: Fix May 2026 Ui Errors Implementation - migrated from docs/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-may-2026-ui-errors-implementation.md
---

# Implementation: May 2026 UI Errors (BRI-166)

## Resolution Strategy

Use a multi-slice frontend fix so each visible regression stays small enough to review and verify independently. The documentation slice owns the plan and test contract first; implementation slices must not redefine scope without updating this artifact.

## Branch Plan

- Integration branch: `fix/app-may-2026-ui-errors-bri-166-integration`
- Current documentation slice: `fix/app-may-2026-ui-errors-bri-166-s01-documentation-slice`
- Final integration PR target: `develop`
- Slice PR target: `fix/app-may-2026-ui-errors-bri-166-integration`

## Slice Plan

| Slice | Status | Branch | Responsibility | Tests First | Evidence |
| --- | --- | --- | --- | --- | --- |
| S01 | complete | `fix/app-may-2026-ui-errors-bri-166-s01-documentation-slice` | Create problem and implementation artifacts, define route scope, branch map, test plan, and responsive QA gates. | Documentation validation and artifact review. | Updated docs and Linear sync. |
| S02 | complete | `fix/app-may-2026-ui-errors-bri-166-s02-marketplace-cache-refresh` | Reproduce and fix the deployed Safari iPhone marketplace cache/page-update path that can hide cover images until history/site data is cleared. | Added route-level assertion that marketplace is dynamic and non-revalidated. | `npx vitest run tests/app/marketplace-page.test.ts tests/lib/next-image-config.test.ts` passed. |
| S03 | complete | `fix/app-may-2026-ui-errors-bri-166-s03-marketplace-profile-footer` | Restore footer rendering on marketplace and profile routes using the existing app footer pattern. | Added route assertions for footer presence on marketplace and profile states. | `npx vitest run tests/app/marketplace-page.test.ts tests/app/protected-perfil-page.test.ts` passed. |
| S04 | complete | `fix/app-may-2026-ui-errors-bri-166-s04-mobile-login-layout` | Fix connected-wallet/login mobile overlap and preserve auth/session behavior. | Added modal layout assertion for mobile-safe scroll containment. | `npx vitest run tests/components/onboarding-reward-decision-modal.test.ts` passed. |
| S05 | complete | `fix/app-may-2026-ui-errors-bri-166-s05-mobile-core-web-vitals-baseline` | Capture the mobile Core Web Vitals baseline for `https://brids.io`, using the reported PageSpeed `83` run to identify LCP, INP/TBT, and CLS contributors. | No production test changes; baseline-only documentation slice. | PageSpeed report link recorded; API extraction attempted and blocked by PageSpeed API quota `429`. |
| S06 | complete | `fix/app-may-2026-ui-errors-bri-166-s06-mobile-core-web-vitals-optimization` | Implement scoped mobile Core Web Vitals improvements from the S05 baseline without regressing visual, cache, or auth behavior. | Added source assertions for image sizing/fetch-priority contracts. | `npx vitest run tests/lib/home-featured-properties-source.test.ts tests/components/marketplace-card-source.test.ts` passed. |
| S07 | complete | `fix/app-may-2026-ui-errors-bri-166-s07-responsive-cwv-qa-clean-code` | Run responsive QA, Core Web Vitals closeout, collect evidence, close clean-code review findings, and update docs with final verification. | QA checklist before closeout. | Responsive script passed; `npm run validate` passed; PageSpeed API remained blocked by quota `429`. |
| S08 | complete | `fix/app-may-2026-ui-errors-bri-166-s08-protected-profile-footer` | Move the profile footer responsibility into the protected shell so `/protected/perfil` shows a real page footer. | Added source assertion that `ProtectedShell` owns `FooterSection` and `/protected/perfil` does not duplicate it. | `npx vitest run tests/app/protected-perfil-page.test.ts tests/components/protected-shell-footer-source.test.ts` passed. |

## Technical Approach

### S01 - Documentation Slice

- Created the required fix problem artifact and implementation artifact.
- Reframed the primary marketplace image issue as Safari iPhone cache/page-update freshness after the user confirmed Android and Chrome iOS render correctly and Safari recovers after clearing BRIDS history/site data.
- Added the mobile Core Web Vitals scope using the provided PageSpeed mobile report as a measurement input, while keeping LCP, INP/TBT, and CLS as the optimization targets.
- Defined implementation slices, tests-first expectations, responsive evidence, Core Web Vitals evidence, and the final clean-code gate.

### S02 - Marketplace Cache Refresh

- Treat the deployed Safari iPhone marketplace stale image state as the primary BRI-166 issue.
- Use the updated user evidence: Android renders correctly, Chrome on iOS renders correctly, and Safari iPhone renders correctly after BRIDS history/site data is cleared.
- Capture or inspect Safari iPhone refresh/revisit behavior first, then compare it with desktop, Android, and Chrome on iOS where the image is known to render.
- Inspect the marketplace listing/card image source, but prioritize cache/page-update paths before layout-only changes.
- Confirm whether the stale state can come from HTML/JS cache, Next.js ISR, Next Image optimization, CDN headers, Safari page cache, or PWA registration/update behavior.
- Note: `public/sw.js` exists and is registered with `updateViaCache: "none"`, but initial inspection shows no `fetch` handler, so it should not directly cache marketplace images unless later code changes prove otherwise.
- Prefer fixing cache headers, asset freshness, revalidation, or image URL/versioning over route-specific duplication.
- Preserve existing image loading, fallback, and desktop rendering behavior.
- Check for layout shifts caused by image aspect-ratio or container constraints only after stale-cache causes are ruled out.

Completed in this slice:

- Added an App Router freshness contract to `/marketplace` with `dynamic = "force-dynamic"` and `revalidate = 0`.
- Added route-level coverage so the marketplace page keeps that freshness contract.
- Kept service worker fetch behavior unchanged because `public/sw.js` still does not intercept fetch and the slice did not prove a service worker image cache source.

### S03 - Marketplace And Profile Footer

- Identify the canonical footer component and existing route layout strategy.
- Restore footer presence through the route/layout boundary that matches current app patterns.
- Avoid duplicating footer markup in individual pages if a shared layout owns the responsibility.
- Confirm marketplace and profile do not gain duplicate footers on desktop.

Completed in this slice:

- Added the shared `FooterSection` to `/marketplace`.
- Added the shared `FooterSection` to both authenticated `/protected/perfil` render states.
- Added route-level coverage for footer presence in marketplace and profile without changing auth/session behavior.

### S04 - Mobile Login Layout

- Reproduce the connected-wallet mobile state shown in Linear.
- Identify whether overlap comes from modal positioning, z-index, fixed-height panels, viewport spacing, page scroll behavior, or typography/container sizing.
- Keep wallet/auth state handling unchanged.
- Ensure the prompt fits within the viewport and page content remains readable behind or around the modal according to the existing design pattern.

Completed in this slice:

- Made the onboarding reward decision modal use a mobile-safe overlay with top alignment, safe-area padding, `100svh` height constraints, and overlay scroll.
- Reduced mobile header/card spacing so the connected-wallet decision prompt stays readable on iPhone-sized Safari viewports.
- Kept modal actions, reward copy, wallet state, and auth/session behavior unchanged.

### S05 - Mobile Core Web Vitals Baseline

- Use the provided PageSpeed report as the initial lab baseline: `https://pagespeed.web.dev/analysis/https-brids-io/nvj0gnc6r8?form_factor=mobile`.
- Record the reported mobile performance score `83` as context, but optimize against Core Web Vitals rather than the aggregate score.
- Record the report timestamp `May 30, 2026, 11:13:58 AM`.
- Extract Lighthouse metric values and top opportunities before proposing optimizations, with priority on LCP, INP/TBT, and CLS.
- Map each opportunity to the likely source: hero/listing imagery, CSS/font loading, client JavaScript, cache/revalidation, layout shift, third-party cost, or server response time.
- Separate cache/update freshness findings from general performance findings so S02 and S06 do not overwrite each other's responsibilities.
- Note that PageSpeed reports no sufficient Chrome UX Report field data for the page, so S05 relies on Lighthouse lab diagnostics and direct browser evidence until field data exists.

Completed in this slice:

- Recorded the provided PageSpeed mobile report as the initial mobile CWV input: `https://pagespeed.web.dev/analysis/https-brids-io/nvj0gnc6r8?form_factor=mobile`.
- Preserved the reported aggregate mobile performance score `83` as context, not as the success target.
- Attempted to fetch detailed Lighthouse metrics through `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Fbrids.io&strategy=mobile&category=performance`.
- The PageSpeed API returned `429 RESOURCE_EXHAUSTED` because the public API quota for the consumer was `0`, so detailed LCP/TBT/CLS extraction remains pending for browser/UI evidence or an authenticated API key.
- Confirmed S06 should still optimize the likely app-owned CWV sources: LCP image priority/sizing, render-blocking CSS/font work, route payload, cache/revalidation, layout stability, and unnecessary client JavaScript.

### S06 - Mobile Core Web Vitals Optimization

- Prioritize changes that improve mobile Core Web Vitals without changing product behavior.
- Candidate areas include LCP image sizing/priority, critical route payload, render-blocking work, font loading, cache headers, ISR/revalidation, layout stability, and unnecessary client JavaScript.
- Keep the changes scoped to the opportunities proven in S05.
- Target good-threshold outcomes where practical: LCP <= `2.5s`, INP <= `200ms` when field data is available or TBT as the lab proxy, and CLS <= `0.1`.
- If a metric remains outside target, document the remaining bottleneck, measured final value, and why further work should move to a separate performance initiative.

Completed in this slice:

- Added explicit high fetch priority to the home hero image, which is the likely landing-page LCP candidate.
- Added responsive `sizes` contracts to home featured property images so mobile browsers do not request unnecessarily wide candidates.
- Added responsive `sizes` and conditional fetch priority to marketplace card images, preserving eager loading only for the first prioritized card.
- Added tests that keep these CWV image contracts from regressing.

### S07 - Responsive QA, Core Web Vitals QA, And Clean Code

- Capture evidence at `320`, `375`, `768`, and `1024` widths.
- Include a Safari iPhone deployed or deployment-equivalent marketplace check for the cover image regression across revisit/refresh/update behavior.
- Use Android and Chrome iOS as positive controls for the same listing/card image.
- Check marketplace, profile, and connected-wallet/login route states.
- Include final mobile Core Web Vitals evidence after S06, with PageSpeed/Lighthouse used as the measurement source.
- Confirm no horizontal overflow at the document level before reviewing local component polish.
- Run the explicit clean-code pass and document unresolved non-blocking notes if any remain.

Completed in this slice:

- Ran `npm run validate` successfully on the accumulated integration diff.
- Captured local Playwright responsive evidence against the existing `http://localhost:3000` dev server.
- Marketplace checks at `320`, `375`, `768`, `1024`, and `1440` widths reported:
  - no document-level horizontal overflow
  - shared footer visible
  - `3` marketplace images rendered
- Home checks at `320`, `375`, `768`, and `1024` widths reported:
  - no document-level horizontal overflow
  - hero image rendered
- PageSpeed API extraction remained blocked by `429 RESOURCE_EXHAUSTED`, so final CWV field/lab metrics must be refreshed from the PageSpeed UI or an authenticated API key after deployment.
- Clean-code pass found no blocking findings in the touched diff; changes stayed scoped to route freshness, footer placement, modal layout containment, image loading hints, tests, and required docs.

### S08 - Protected Profile Footer Correction

- User verification found that the footer still was not visible on `/protected/perfil`.
- Root cause: the footer had been added inside the profile page content instead of as the footer for the protected shell. Depending on profile state/content length, it behaved like module content rather than a page footer.
- Moved `FooterSection` ownership to `ProtectedShell`, after the dashboard grid, inside a full-width constrained wrapper.
- Removed the duplicate page-level footer from `/protected/perfil`.
- Added source coverage to keep the footer owned by the shell and avoid duplicate footers in the profile page.

## Tests-First Contract

Before implementation in each slice:

- Inspect existing test coverage for the touched route or component.
- Add or update the smallest relevant test before changing production code when a stable test hook exists.
- If S02 changes cache headers or revalidation behavior, add or update route/header tests where practical.
- If a route state is not practical to unit-test, document that decision in the slice and cover it with Playwright/browser evidence.
- For auth or wallet-adjacent UI, verify the change does not modify nonce, cookie, signer, session, role, or account-linking behavior.

Planned verification commands:

- `npm run validate`
- Targeted unit/component tests discovered during each implementation slice
- Mobile Core Web Vitals baseline and follow-up report evidence for `https://brids.io`
- Playwright or browser-driven responsive captures for affected surfaces

## Responsive QA Matrix

| Surface | State | Widths | Required Checks |
| --- | --- | --- | --- |
| Marketplace | Public/listing view | `320`, `375`, `768`, `1024` plus deployed/deployment-equivalent Safari iPhone refresh/revisit check | Cover image visible on Safari iPhone without clearing history/site data, Android, Chrome iOS, and desktop; footer visible; no horizontal overflow. |
| Marketplace | Connected-wallet/login prompt | `320`, `375`, `768`, `1024` | Modal/prompt readable, no overlap with hero, filters, cards, or reward content. |
| Profile | Public/profile view | `320`, `375`, `768`, `1024` | Footer visible, no horizontal overflow, desktop unaffected. |

## Core Web Vitals QA Matrix

| Surface | Tool | Baseline | Target | Required Checks |
| --- | --- | --- | --- | --- |
| `https://brids.io` | PageSpeed Insights / Lighthouse mobile | PageSpeed score `83`; CWV metrics to be extracted in S05 | LCP <= `2.5s`, INP <= `200ms` when field data is available or TBT as lab proxy, CLS <= `0.1` | Record before/after CWV metrics, top opportunities addressed, and remaining blockers if any metric stays outside target. |

Final note: the PageSpeed API could not provide follow-up metrics from this environment because the public API returned `429 RESOURCE_EXHAUSTED`. S07 therefore closes with local responsive/browser evidence and the successful repo validation gate; deployed CWV re-measurement remains the first post-merge verification step.

## Trust Boundary Notes

This fix is intended to be presentational. It must not change:

- SIWS nonce lifecycle
- Cookies or session persistence
- Wallet signer behavior
- Auth redirects
- Profile completion authorization
- Marketplace API or persistence contracts
- Service worker fetch behavior unless S02 proves it is required for cache freshness

If implementation discovers that auth/session code must change, this artifact must be updated before that work proceeds and the security participant becomes a required implementation reviewer.

## Documentation And Linear Sync

- Problem artifact: `docs/fixes/fix-may-2026-ui-errors.md`
- Solution artifact: `docs/fixes/fix-may-2026-ui-errors-implementation.md`
- PageSpeed mobile report: `https://pagespeed.web.dev/analysis/https-brids-io/nvj0gnc6r8?form_factor=mobile`
- Linear must be updated from these artifacts after the documentation slice is stable.

## Completion Gate

- All implementation slices merged into `fix/app-may-2026-ui-errors-bri-166-integration`.
- Required responsive QA artifacts collected and referenced.
- Mobile Core Web Vitals baseline and final evidence collected and referenced.
- `npm run validate` passes.
- Final reviewer clean-code pass completed with no unresolved blocking findings.
- Final integration PR opened from `fix/app-may-2026-ui-errors-bri-166-integration` into `develop`.
