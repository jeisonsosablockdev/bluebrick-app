---
type: Feature Spec
title: Feature App Create A Marketplace 3d Visual BRI- 164 S16 Clean Code Refactor Audit
description: Feature App Create A Marketplace 3d Visual BRI- 164 S16 Clean Code Refactor Audit - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s16-clean-code-refactor-audit.md
---

# S16 Audit: Marketplace Map Clean-Code Refactor

## Scope
- Route/surface: `/marketplace`
- Feature: BRI-164 marketplace map experience
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s16-clean-code-refactor-audit`
- Audit type: clean-code and refactor readiness
- Runtime changes: none in this audit slice

## Evidence Commands
- `nl -ba components/marketplace/MarketplaceMapClient.tsx`
- `nl -ba components/marketplace/MarketplaceMapShell.tsx`
- `nl -ba components/marketplace/MarketplaceExperience.tsx`
- `nl -ba lib/marketplace-map-camera.ts`
- `nl -ba lib/marketplace-map-camera-motion.ts`
- `nl -ba lib/marketplace-format.ts`
- `npm run test -- tests/lib/marketplace-format.test.ts tests/lib/marketplace-map-camera.test.ts tests/lib/marketplace-map-camera-motion.test.ts tests/components/marketplace-map-client.test.ts tests/components/marketplace-map-shell.test.ts tests/components/marketplace-experience.test.ts tests/app/marketplace-page.test.ts`

## Verification Result
- Targeted marketplace/map test suite passed: `7` test files, `19` tests.
- No blocking clean-code issue was found that requires an immediate behavior-preserving refactor before merge.

## Cleanup Plan
1. Keep the current small helper extraction from S14: `% sold` formatting is now centralized in `lib/marketplace-format.ts`.
2. Keep camera math in pure helpers: `lib/marketplace-map-camera.ts` and `lib/marketplace-map-camera-motion.ts` remain testable without Mapbox.
3. Defer larger UI component decomposition until a performance/refactor slice is explicitly opened.

## Findings
### Finding 1: `MarketplaceMapClient` mixes camera state, timer orchestration, Mapbox wiring, and marker rendering
- **Evidence:** `components/marketplace/MarketplaceMapClient.tsx:52` defines the exported component; camera state and orbit timer are handled around lines `60-94`, Mapbox move handling around lines `98-113`, and marker rendering around lines `117-154`.
- **Severity:** Medium
- **Blocking:** No
- **Clean-Code Principle:** Functions/components should do one thing and stay small.
- **Rationale:** The component is still understandable, but future map interaction work will become harder if timer behavior, camera state, and marker UI keep growing in one component.
- **Recommendation:** In a future refactor slice, extract a `useMarketplaceMapViewState` hook and a small `MarketplaceMapMarker` component.

### Finding 2: `MarketplaceMapShell` owns layout, fallback, and pin-list rendering in one component
- **Evidence:** `components/marketplace/MarketplaceMapShell.tsx:15` branches fallback behavior, while lines `20-67` render the full map shell and pin list.
- **Severity:** Low
- **Blocking:** No
- **Clean-Code Principle:** Components should keep one level of abstraction where practical.
- **Rationale:** The shell is still short enough to read, but the pin list will become a natural extraction point if pin metadata or interactions grow.
- **Recommendation:** Extract `MarketplaceMapPinList` only when the pin panel receives additional behavior.

### Finding 3: Initial Mapbox loading is a performance/refactor boundary, not just an SEO finding
- **Evidence:** S15 recorded initial Mapbox resource transfer in the default map-first state; `MarketplaceExperience.tsx:27-45` builds the map node whenever a token and pins exist.
- **Severity:** Medium
- **Blocking:** No
- **Clean-Code Principle:** High-cost dependencies should have clear boundaries.
- **Rationale:** The current design is valid for a premium default map-first experience, but the lazy-loading boundary should be explicit if mobile Core Web Vitals becomes a release gate.
- **Recommendation:** If S15 findings are accepted, open a dedicated performance slice to lazy hydrate the Mapbox island without changing the list fallback contract.

### Finding 4: Pure helper structure is good and should be preserved
- **Evidence:** `lib/marketplace-map-camera.ts:79`, `lib/marketplace-map-camera-motion.ts:14`, and `lib/marketplace-format.ts:1` expose small deterministic helpers covered by tests.
- **Severity:** Positive finding
- **Blocking:** No
- **Clean-Code Principle:** Small pure functions are easier to test and change safely.
- **Rationale:** The highest-risk map calculations are not hidden inside React components.
- **Recommendation:** Keep future geographic, camera, and formatting logic in pure helpers before wiring it into React.

## Risk Notes
- Do not perform a broad component rewrite in this audit slice; the current behavior is covered and stable.
- The next meaningful refactor should be tied to either S15 performance remediation or a new interaction requirement.
- Any map lazy-loading work needs browser evidence because it changes first-load behavior.

## S21 Strict P2 Addendum
- S21 added a documentation-only P2 inventory after the stricter clean-code pass on the integration branch.
- The inventory keeps runtime behavior unchanged and splits remaining P2 work into atomic implementation slices.
- Central inventory: `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s21-p2-debt-inventory.md`.
- S22-S25 cover reliability and observability as separate one-change slices.
- S26-S31 cover the `lib/property-marketplace-server.ts` boundary refactor as one extraction per slice.
- S32-S40 cover `PropertyDetailContent` decomposition as one formatter or section extraction per slice.
- S41 covers coordinate projection hardening.
- S42-S43 split Mapbox lazy-boundary implementation from Web Vitals evidence.
- Every runtime follow-up must start with failing tests and must not bundle adjacent cleanup.

## Test And Verification Plan
- Continue using the targeted marketplace suite for behavior-preserving refactors.
- Add browser evidence before changing the Mapbox loading boundary.
- Run `npm run validate` after this slice is merged back to integration.
