---
type: Feature Spec
title: Feature App Create A Marketplace 3d Visual BRI- 164 S21 P2 Debt Inventory
description: Feature App Create A Marketplace 3d Visual BRI- 164 S21 P2 Debt Inventory - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s21-p2-debt-inventory.md
---

# S21 Artifact: P2 Clean-Code Debt Inventory

## Scope
- Feature: BRI-164 marketplace 3D visual.
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s21-p2-debt-artifacts`.
- Slice type: documentation only.
- Runtime changes: none.
- Priority normalization: every item in this artifact is tracked as a P2 follow-up, meaning non-blocking for the current integration branch but important before treating the marketplace route as strict-clean.

## Evidence
- Current integration branch at audit time: `feature/app-create-a-marketplace-3d-visual-bri-164-integration`.
- `npm run validate` passed on the integration branch before this documentation branch was created.
- `git diff --check develop...HEAD` returned no whitespace errors.
- `rg "TODO|FIXME|HACK|XXX|console.log|debugger"` found no runtime marketplace TODO/FIXME/HACK debt; `console.log` findings were limited to CLI script output.
- S15 Web Vitals/SEO audit remains the performance evidence source for `/marketplace`.

## Atomic Slice Rule
- Each implementation slice must own exactly one behavior, extraction, or evidence task.
- Every runtime slice must start with failing tests for that one change.
- A slice may touch multiple files only when the single behavior crosses a boundary, such as server result contract plus its test.
- A slice must not bundle adjacent cleanup, opportunistic refactors, formatting moves, or performance changes.
- Each slice must merge back to the integration branch before the next slice starts.

## Debt Inventory
| ID | Priority | Category | Hotspot | Problem | Atomic Slice Coverage |
| --- | --- | --- | --- | --- | --- |
| P2-01 | P2 | Reliability / observability | `app/marketplace/page.tsx`, `lib/property-marketplace-server.ts` | Data fetch failures can collapse into empty arrays or snapshot fallback without an explicit degraded-state signal. | S23, S24, S25 |
| P2-02 | P2 | Security / API hardening | `app/api/admin/marketplace/entries/route.ts` | Admin create failures can expose raw internal error messages in a 500 response. | S22 |
| P2-03 | P2 | Architecture / structure | `lib/property-marketplace-server.ts` | One 646-line server module owns persistence reads, writes, mapping, fallback, filtering, Solana sync, and map selectors. | S26, S27, S28, S29, S30, S31 |
| P2-04 | P2 | UI maintainability | `components/marketplace/PropertyDetailContent.tsx` | One 317-line detail component owns formatting, Google Maps URL resolution, motion wrappers, and every detail section. | S32, S33, S34, S35, S36, S37, S38, S39, S40 |
| P2-05 | P2 | Data quality / map correctness | `lib/marketplace-map-pins.ts` | Public pin projection only checks finite coordinates; it does not defend against out-of-range persisted or legacy coordinates. | S41 |
| P2-06 | P2 | Performance / Web Vitals | `/marketplace` Mapbox island | S15 recorded mobile LCP `8.0s`, mobile TBT `870ms`, desktop TBT `830ms`, and early Mapbox resource loading in the default map-first state. | S42, S43 |

## Atomic Slice Queue
| Slice | One Change Only | Primary Test Gate | Artifact |
| --- | --- | --- | --- |
| S22 | Safe generic admin create 500 response | API route test | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s22-admin-safe-create-errors.md` |
| S23 | Typed marketplace read result contract | Server test | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s23-read-result-contract.md` |
| S24 | Marketplace page degraded-state rendering | Page/component test | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s24-page-degraded-state.md` |
| S25 | Marketplace read failure structured logging | Server/observability test | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s25-read-failure-logging.md` |
| S26 | Row mapper extraction | Server mapper behavior test | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s26-row-mapper-extraction.md` |
| S27 | Persisted read repository extraction | Repository/server read test | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s27-read-repository-extraction.md` |
| S28 | Persisted write repository extraction | Create/conflict tests | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s28-write-repository-extraction.md` |
| S29 | Pure selector extraction | Selector tests | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s29-selector-extraction.md` |
| S30 | Solana sync status extraction | Sync status tests | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s30-sync-status-extraction.md` |
| S31 | Server facade cleanup after extractions | Full targeted server suite | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s31-server-facade-cleanup.md` |
| S32 | Detail formatter extraction | Formatter tests | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s32-detail-formatters-extraction.md` |
| S33 | Detail Google Maps card extraction | Google Maps card tests | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s33-detail-google-maps-card.md` |
| S34 | Detail hero section extraction | Hero component tests | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s34-detail-hero-section.md` |
| S35 | Detail investment summary extraction | Investment card tests | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s35-detail-investment-summary.md` |
| S36 | Detail property information extraction | Property info card tests | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s36-detail-property-info.md` |
| S37 | Detail deal economics extraction | Deal economics card tests | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s37-detail-deal-economics.md` |
| S38 | Detail fees/return extraction | Fees card tests | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s38-detail-fees-return.md` |
| S39 | Detail execution/governance extraction | Execution/governance tests | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s39-detail-execution-governance.md` |
| S40 | Detail documents/blockchain extraction | Documents/blockchain tests | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s40-detail-documents-blockchain.md` |
| S41 | Coordinate range validation | Map pin projection tests | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s41-coordinate-range-validation.md` |
| S42 | Mapbox lazy loading boundary | Component and browser tests | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s42-mapbox-lazy-boundary.md` |
| S43 | Web Vitals recheck and doc sync | Lighthouse/browser evidence | `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s43-web-vitals-recheck.md` |

## Metrics Dashboard
| Metric | Current | Target | Notes |
| --- | ---: | ---: | --- |
| Runtime validation | Pass | Pass | `npm run validate` passed before this docs slice. |
| P2 debt groups | 6 | 0 open P2 groups | Each group is split into atomic slices. |
| Atomic follow-up slices | 22 | 22 individually implemented or closed | S22-S43. |
| Largest marketplace server module | 646 lines | under 300 lines per focused module | Reached through S26-S31, not one broad refactor. |
| Largest marketplace detail UI component | 317 lines | under 200 lines or split into section components | Reached through S32-S40, one section at a time. |
| Mobile lab LCP | 8.0s | under 2.5s | From S15 local Lighthouse mobile audit. |
| Mobile lab TBT | 870ms | under 200ms directionally | From S15 local Lighthouse mobile audit. |
| Desktop lab TBT | 830ms | under 200ms directionally | From S15 local Lighthouse desktop audit. |

## Impact Analysis
These are planning estimates, not accounting records. The estimate uses the skill default of `$150/hour` only to compare relative ROI.

| ID | Estimated Cost If Ignored | Atomic Remediation Path | Expected ROI |
| --- | --- | --- | --- |
| P2-01 | 2-4 hours per incident to distinguish no-inventory state from data failure. | S23-S25 | Positive after 1-2 avoided debugging sessions. |
| P2-02 | 2-6 hours per leaked/internal error investigation plus avoidable support/security review noise. | S22 | Positive in first hardening pass. |
| P2-03 | 4-8 extra hours per future marketplace server change because several responsibilities must be understood together. | S26-S31 | Positive after 2-3 server-side marketplace changes. |
| P2-04 | 2-5 extra hours per detail-page layout/content change because every section is coupled in one component. | S32-S40 | Positive after 2 detail-page iterations. |
| P2-05 | 1-3 hours per bad coordinate issue, plus user-visible broken camera/pin risk. | S41 | Immediate low-effort quick win. |
| P2-06 | Conversion and UX risk on mobile; slow LCP/TBT can make the premium surface feel heavy. | S42-S43 | Positive if mobile first-load metrics improve measurably. |

## Prioritized Roadmap
| Order | Slice Range | Why |
| ---: | --- | --- |
| 1 | S22-S25 | Reliability, safe errors, and observability reduce debugging ambiguity. |
| 2 | S41-S43 | Coordinate validation is small, and Web Vitals risk is already measured. |
| 3 | S26-S31 | Server boundary split reduces future change cost after reliability behavior is protected by tests. |
| 4 | S32-S40 | Detail decomposition is useful but less risky than reliability, data quality, or server boundaries. |

## Prevention Plan
- Add tests before every refactor slice, then keep runtime behavior stable.
- Keep public route fallbacks explicit: empty inventory, degraded data source, missing token, and map unavailable should be distinguishable in tests.
- For API handlers, never return raw internal 500 error messages; log server-side and return stable error codes.
- Keep map data projection defensive even if admin validation already exists.
- Keep heavy client dependencies behind measurable loading boundaries when S15 or future Lighthouse data shows regression.

## Completion Criteria For This Documentation Slice
- P2 problems and target solutions are captured.
- Every implementation slice is atomic.
- Every runtime slice has an explicit TDD contract.
- Governing feature artifacts reference the atomic slice queue.
- No runtime files are changed.
- Documentation validation passes.
