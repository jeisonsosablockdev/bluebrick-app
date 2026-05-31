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

## Debt Inventory
| ID | Priority | Category | Hotspot | Problem | Required Solution Artifact |
| --- | --- | --- | --- | --- | --- |
| P2-01 | P2 | Reliability / observability | `app/marketplace/page.tsx`, `lib/property-marketplace-server.ts` | Data fetch failures can collapse into empty arrays or snapshot fallback without an explicit degraded-state signal. | S22 runtime observability and error-boundary plan |
| P2-02 | P2 | Security / API hardening | `app/api/admin/marketplace/entries/route.ts` | Admin create failures can expose raw internal error messages in a 500 response. | S22 runtime observability and error-boundary plan |
| P2-03 | P2 | Architecture / structure | `lib/property-marketplace-server.ts` | One 646-line server module owns persistence reads, writes, mapping, fallback, filtering, Solana sync, and map selectors. | S23 marketplace server boundary plan |
| P2-04 | P2 | UI maintainability | `components/marketplace/PropertyDetailContent.tsx` | One 317-line detail component owns formatting, Google Maps URL resolution, motion wrappers, and every detail section. | S24 property detail decomposition plan |
| P2-05 | P2 | Data quality / map correctness | `lib/marketplace-map-pins.ts` | Public pin projection only checks finite coordinates; it does not defend against out-of-range persisted or legacy coordinates. | S25 map quality and Web Vitals plan |
| P2-06 | P2 | Performance / Web Vitals | `/marketplace` Mapbox island | S15 recorded mobile LCP `8.0s`, mobile TBT `870ms`, desktop TBT `830ms`, and early Mapbox resource loading in the default map-first state. | S25 map quality and Web Vitals plan |

## Metrics Dashboard
| Metric | Current | Target | Notes |
| --- | ---: | ---: | --- |
| Runtime validation | Pass | Pass | `npm run validate` passed before this docs slice. |
| P2 follow-up count | 6 | 0 open P2 items | Count includes reliability, architecture, UI, data quality, and performance debt. |
| Largest marketplace server module | 646 lines | under 300 lines per focused module | `lib/property-marketplace-server.ts`. |
| Largest marketplace detail UI component | 317 lines | under 200 lines or split into section components | `components/marketplace/PropertyDetailContent.tsx`. |
| Marketplace map view-state hook | 172 lines | monitor, split only if behavior grows | Current hook is acceptable after S20, but should not absorb unrelated concerns. |
| Mobile lab LCP | 8.0s | under 2.5s | From S15 local Lighthouse mobile audit. |
| Mobile lab TBT | 870ms | under 200ms directionally | From S15 local Lighthouse mobile audit. |
| Desktop lab TBT | 830ms | under 200ms directionally | From S15 local Lighthouse desktop audit. |

## Impact Analysis
These are planning estimates, not accounting records. The estimate uses the skill default of `$150/hour` only to compare relative ROI.

| ID | Estimated Cost If Ignored | Remediation Effort | Expected ROI |
| --- | --- | --- | --- |
| P2-01 | 2-4 hours per incident to distinguish no-inventory state from data failure. | 4-6 hours | Positive after 1-2 avoided debugging sessions. |
| P2-02 | 2-6 hours per leaked/internal error investigation plus avoidable support/security review noise. | 2-4 hours | Positive in first hardening pass. |
| P2-03 | 4-8 extra hours per future marketplace server change because several responsibilities must be understood together. | 8-14 hours | Positive after 2-3 server-side marketplace changes. |
| P2-04 | 2-5 extra hours per detail-page layout/content change because every section is coupled in one component. | 5-8 hours | Positive after 2 detail-page iterations. |
| P2-05 | 1-3 hours per bad coordinate issue, plus user-visible broken camera/pin risk. | 1-2 hours | Immediate low-effort quick win. |
| P2-06 | Conversion and UX risk on mobile; slow LCP/TBT can make the premium surface feel heavy. | 8-16 hours for first performance pass | Positive if mobile first-load metrics improve measurably. |

## Slice Separation
### S22 - Runtime observability and error boundaries
- Branch when implemented: `feature/app-create-a-marketplace-3d-visual-bri-164-s22-runtime-observability`
- Owns P2-01 and P2-02.
- Outcome: logged degraded states, safe admin errors, and tests proving user-facing responses do not leak internal errors.
- Artifact: `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s22-runtime-observability.md`.

### S23 - Marketplace server boundary refactor
- Branch when implemented: `feature/app-create-a-marketplace-3d-visual-bri-164-s23-server-boundaries`
- Owns P2-03.
- Outcome: split server persistence, mapping, filtering, Solana sync, and map selectors behind focused modules without behavior change.
- Artifact: `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s23-server-boundaries.md`.

### S24 - Property detail content decomposition
- Branch when implemented: `feature/app-create-a-marketplace-3d-visual-bri-164-s24-detail-decomposition`
- Owns P2-04.
- Outcome: split the property detail UI into focused section components and shared formatting helpers.
- Artifact: `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s24-detail-decomposition.md`.

### S25 - Map data quality and Web Vitals boundary
- Branch when implemented: `feature/app-create-a-marketplace-3d-visual-bri-164-s25-map-quality-web-vitals`
- Owns P2-05 and P2-06.
- Outcome: harden coordinate projection and add a measurable first-load performance boundary for Mapbox.
- Artifact: `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s25-map-quality-web-vitals.md`.

## Prioritized Roadmap
| Order | Slice | Why First |
| ---: | --- | --- |
| 1 | S22 | Reliability and safe error responses are the highest leverage P2 fixes and reduce debugging ambiguity. |
| 2 | S25 | Coordinate validation is a quick win, and Web Vitals risk is already measured. |
| 3 | S23 | Server boundary split reduces future change cost after reliability behavior is explicitly protected by tests. |
| 4 | S24 | Detail decomposition is important but less risky than runtime observability, data quality, or server boundaries. |

## Prevention Plan
- Add tests before every refactor slice, then keep runtime behavior stable.
- Keep public route fallbacks explicit: empty inventory, degraded data source, missing token, and map unavailable should be distinguishable in tests.
- For API handlers, never return raw internal 500 error messages; log server-side and return stable error codes.
- Keep map data projection defensive even if admin validation already exists.
- Keep heavy client dependencies behind measurable loading boundaries when S15 or future Lighthouse data shows regression.

## Completion Criteria For This Documentation Slice
- P2 problems and target solutions are captured.
- Each P2 item is mapped to an implementation slice.
- Governing feature artifacts reference the new P2 debt inventory.
- No runtime files are changed.
- Documentation validation passes.
