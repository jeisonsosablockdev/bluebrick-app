---
type: Feature Spec
title: Feature App Create A Marketplace 3d Visual BRI- 164 S43 Web Vitals Recheck
description: Feature App Create A Marketplace 3d Visual BRI- 164 S43 Web Vitals Recheck - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s43-web-vitals-recheck.md
---

# S43 Plan: Web Vitals Recheck

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s43-web-vitals-recheck`.
- Runtime scope when implemented: none unless a measurement script needs a non-runtime fixture.
- Evidence scope: Lighthouse/browser comparison against S15.

## Problem
After S42, the team needs objective evidence that the Mapbox lazy boundary improved or at least did not regress the marketplace route.

## Solution
Run a fresh local production Web Vitals/SEO check and update the feature artifact with the measured delta.

## TDD Contract
1. No runtime TDD is expected unless a test fixture changes.
2. Run the same class of evidence as S15.
3. Compare mobile LCP, mobile TBT, desktop TBT, and SEO score.
4. Document the result and any remaining risk.

## Out Of Scope
- Implementing additional performance fixes.
- UI changes.
- Coordinate validation.

## Acceptance Criteria
- S15 baseline and S43 results are comparable.
- Any remaining performance risk is explicitly documented.
- No runtime changes are mixed into the measurement slice.

## S43 Evidence
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s43-web-vitals-recheck`.
- Runtime changes: none.
- Production build command: `npm run build`.
- Production server command: `PORT=3100 npm run start`.
- Route probes:
  - `/marketplace`: `200 text/html; charset=utf-8`, `1.344610s`.
  - `/marketplace/fix-flip-brandon-117`: `200 text/html; charset=utf-8`, `0.966893s`.
- Initial HTML check after S42:
  - `/marketplace` contains the active listing text.
  - `/marketplace` does not contain `marketplace-map-shell` or `marketplace-map-client` in initial HTML.
  - This confirms the Mapbox island is no longer part of the first server-rendered marketplace payload.
- Lighthouse commands:
  - `npx -y lighthouse@12.8.2 http://localhost:3100/marketplace --only-categories=performance,seo --preset=desktop --output=json --output-path=artifacts/lighthouse-marketplace-s43-desktop.json --chrome-flags='--headless=new --no-sandbox' --quiet`
  - `npx -y lighthouse@12.8.2 http://localhost:3100/marketplace --only-categories=performance,seo --output=json --output-path=artifacts/lighthouse-marketplace-s43-mobile.json --chrome-flags='--headless=new --no-sandbox' --quiet`
- Artifact note: `artifacts/` is gitignored, so the JSON outputs are local evidence files and are not committed.

## S15 vs S43 Comparison
| Metric | S15 Baseline | S43 Recheck | Delta |
| --- | ---: | ---: | ---: |
| Desktop performance score | not recorded in S15 summary | 97 | n/a |
| Desktop SEO score | 100 | 100 | no regression |
| Desktop LCP | 1.7s | 1.1s | improved by ~0.6s |
| Desktop TBT | 830ms | 0ms | improved by ~830ms |
| Mobile performance score | not recorded in S15 summary | 74 | n/a |
| Mobile SEO score | 100 | 100 | no regression |
| Mobile LCP | 8.0s | 5.1s | improved by ~2.9s |
| Mobile TBT | 870ms | 259ms | improved by ~611ms |
| Mobile CLS | not recorded in S15 summary | 0.055 | under 0.1 target |

## Result
- S42 materially reduced initial JavaScript contention and moved Mapbox work out of the initial HTML/render path.
- Desktop lab performance is now strong in local production evidence.
- Mobile lab LCP remains above the `2.5s` Core Web Vitals target even after improving from `8.0s` to `5.1s`.
- Mobile TBT improved substantially, but `259ms` remains above the ideal `200ms` threshold.
- SEO remains `100` in both desktop and mobile Lighthouse runs.

## Remaining Risk
- The premium marketplace still has mobile LCP risk. The next performance pass should inspect the actual mobile LCP element, image priority/size, wallet/modal bundle cost, and remaining route-level client JavaScript.
- This is local lab evidence. Production field Core Web Vitals from Vercel/Chrome UX Report/Search Console are still required after deployment.
