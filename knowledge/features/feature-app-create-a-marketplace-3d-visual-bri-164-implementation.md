# Implementation Plan: Marketplace 3D Visual (BRI-164)

## Status
- Solution artifact
- Depends on: `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164.md`
- Mother/integration branch: `feature/app-create-a-marketplace-3d-visual-bri-164-integration`
- Current slice: `feature/app-create-a-marketplace-3d-visual-bri-164-s21-p2-debt-artifacts`

## Goal
Implement a single `/marketplace` experience that can cycle through four visual states while keeping the traditional list as the safe fallback and the detail page untouched.

The result should feel premium and discovery-driven, but still conversion-friendly and resilient when the map cannot load.

## Decision Summary
1. Keep `/marketplace` as the only page that hosts the map experience.
2. Leave the property detail page unchanged.
3. Use one button to cycle through the agreed view states.
4. Make the default experience map-first with the list still present when the map can initialize.
5. Fall back to list-only when Mapbox configuration is missing or the map fails.
6. Limit the map to USA.
7. Show only the property name and `% sold` on each pin.
8. Zoom the map toward a property when the pin is hovered.
9. Make the page feel like the user is discovering the property location, not just browsing a dataset.

## TDD Execution Model
- Every slice begins with failing tests for the behavior that slice owns.
- Implementation starts only after the slice's tests exist and fail for the new expectation.
- Each slice ends with the smallest possible green implementation and a short cleanup pass.
- The final audit slice uses the `code-refactoring-refactor-clean` skill to inspect the finished diff for smells, coupling, duplication, and naming issues.
- Behavior changes are not allowed in the final audit slice unless the user explicitly approves them.

## Atomic Slice Gate
- A slice may implement only one behavior, one extraction, or one evidence task.
- A slice may touch multiple files only when that one behavior requires a boundary handoff.
- A slice must not combine reliability, refactor, UI decomposition, coordinate validation, performance, and evidence work.
- Each slice must merge back to the integration branch before the next slice starts.
- If a planned slice reveals a second necessary change, open a new slice instead of expanding the current one.

## Technical Architecture
The implementation should use `Mapbox GL JS v3` as the rendering engine and `React Map GL` as the React integration layer.

Why this split:
- `Mapbox GL JS v3` gives us WebGL-backed rendering, which is what makes smooth pan/zoom/tilt and a premium 3D surface practical.
- The marketplace map is expected to stay responsive even as the inventory grows, so the GPU-backed path is the right fit for the long term.
- `React Map GL` keeps the map controllable from the existing React state model, which matters because this screen is state-driven and must cycle through multiple layout modes.
- The React layer keeps the map isolated from the rest of the marketplace page instead of forcing the whole route to become a large imperative canvas.

Implementation consequences:
- Keep the map inside a client island; do not make the full marketplace page client-only.
- Use the React layer to coordinate map readiness, hover focus, and state changes.
- Keep the list visible and functional even if the map engine is missing, slow, or temporarily unavailable.
- Read the Mapbox access token from a client-exposed env var and treat absence of configuration as a first-class fallback case.
- Reuse the canonical location payload already captured at item creation time, including `google_maps_place_json` and persisted coordinates (`geoLat`, `geoLng`), instead of creating a second location source.
- Project that canonical location payload into the public marketplace map model so the map can render real property pins without a separate geocoding flow in the marketplace route.
- Leave items without canonical US map coordinates in the list-only path instead of forcing approximate pins.

## Pin Rendering Strategy
Pins should be Mapbox markers, not Motion objects.

- Use `Marker` from `react-map-gl/mapbox` so Mapbox owns the geographic placement and the marker stays attached to the map camera correctly.
- Use Motion only for the visual shell inside the marker, such as a subtle scale-in, hover lift, glow, or floating accent.
- Keep the pin content compact: property name and `% sold`.
- Drive the hover event through the marker interaction, then let the map camera handle the zoom toward the hovered property.
- If pin density becomes large enough that DOM markers start to feel heavy, migrate the dense rendering path to a Mapbox layer and keep Motion only for the selected/highlighted pin or overlay.

## State Model
The marketplace page should behave like a small view-mode state machine.

Proposed cycle:
- `combined-map-top`: map on top, list below
- `list-only`
- `map-only`
- `combined-list-top`: list on top, map below

Fallback behavior:
- if the map cannot initialize, the state machine should collapse to `list-only`
- the page must not block the list while waiting for map readiness
- once the map is ready, it should render into the active map-capable state without breaking the page

## Slice Plan

### S01 - documentation slice
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s01-documentation`
- Outcome: govern the problem, the UX contract, the fallback behavior, and the implementation slice boundaries.

### S02 - tooling and map foundation
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s02-tooling`
- Scope:
  - TDD first: add failing tests for the Mapbox token helper, controlled map wrapper, and canonical location projection
  - install and wire `mapbox-gl` v3 plus `react-map-gl`
  - add the public Mapbox token env contract and client-safe fallback helper
  - establish the client-only map wrapper and CSS entrypoint
  - project the canonical item location payload into the public map model
  - add tests for missing-token fallback, controlled map setup, and location projection

### S03 - marketplace view state foundation
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s03-state-foundation`
- Scope:
  - TDD first: add failing tests for the state machine and cycle button behavior
  - create the marketplace view-mode state machine
  - wire the single cycle button
  - define the four screen states
  - keep the detail page unchanged
  - add tests for state transitions

### S04 - map surface and pin rendering
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s04-map-surface`
- Scope:
  - TDD first: add failing tests for the marker rendering contract and hover-driven camera focus
  - add the USA-only Mapbox / React Map GL surface
  - render property pins with name and `% sold`
  - implement hover focus and zoom toward the hovered property
  - keep the list visible as the stable anchor

### S05 - fallback, loading, and polish
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s05-fallback-polish`
- Scope:
  - TDD first: add failing tests for the fallback-to-list behavior and loading state degradation
  - add the missing-token fallback to list-only
  - ensure slow map initialization does not block the list
  - refine loading and empty states
  - tune the premium visual treatment without sacrificing readability

### S06 - tests, browser validation, and docs sync
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s06-validation`
- Scope:
  - TDD first: add or tighten the regression tests that prove the final marketplace states and fallback behavior
  - add and update the relevant unit tests
  - verify the marketplace state cycle in browser testing
  - confirm the detail page remains unchanged
  - sync the final documentation trail if the implementation changes any assumptions

### S07 - clean-code audit and refactor hardening
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s07-clean-code-audit`
- Scope:
  - TDD first: add or tighten regression tests for any hotspot that will be cleaned up
  - run a final `code-refactoring-refactor-clean` audit on the completed diff
  - inspect the map, state, and data-projection layers for smells, duplication, naming issues, and tight coupling
  - apply only small behavior-preserving cleanup refactors
  - resolve or document any clean-code findings before closure
  - re-run the targeted tests and final validation after cleanup

### S08 - marketplace detail Google Maps preview fix
- Branch: `fix/app-marketplace-detail-google-maps-bri-164-s08-detail-map`
- Scope:
  - TDD first: add failing tests for the missing Google Maps iframe on `/marketplace/[id]`
  - keep the detail page as a traditional property detail entry, not a Mapbox 3D state surface
  - expose the canonical Google Maps place payload and/or address-derived embed URL to the detail component
  - render an official Google Maps Embed API iframe when a public embed key exists
  - render a stable outbound Google Maps link when embedding is not configured
  - preserve the `/marketplace` Mapbox list/map behavior unchanged

### S09 - Mapbox DevKit MCP tooling
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s09-mapbox-mcp-tooling`
- Scope:
  - TDD first: add config-contract coverage for Mapbox MCP registration and no hardcoded token leakage
  - add the hosted Mapbox DevKit MCP server to Codex repo config
  - add the hosted Mapbox DevKit MCP server to Cursor repo config
  - document the hosted endpoint choice and the npm/local-token alternative from official Mapbox docs
  - keep runtime Mapbox app tokens separate from MCP authentication and do not commit `MAPBOX_ACCESS_TOKEN`

### S10 - Decimal-inspired BRIDS map style contract
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s10-mapbox-decimal-style`
- Scope:
  - TDD first: add style URL config and map-client coverage
  - add `NEXT_PUBLIC_MAPBOX_STYLE_URL` as the published custom style contract
  - keep `mapbox://styles/mapbox/dark-v11` as the safe fallback
  - document the Decimal-inspired BRIDS palette and layer priorities
  - keep runtime behavior unchanged until a published Mapbox Studio style URL is supplied
  - add an importable Mapbox Style v8 JSON artifact for `BRIDS Marketplace Decimal`
  - add a style artifact regression test for structure, palette, POI muting, and token hygiene

### S11 - marketplace map camera focus
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s11-map-camera-focus`
- Scope:
  - TDD first: add tests for selected-pin camera focus and unselected aggregate camera centering
  - add a pure map-camera helper that derives view state from marketplace pins
  - center the map on a selected pin when the user selects an entry in the map panel
  - center the map on the available pin midpoint when no pin is selected
  - preserve hover zoom behavior for direct marker interaction
  - keep detail navigation on the traditional list/card path

### S12 - pin location leader line
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s12-pin-location-leader`
- Scope:
  - TDD first: add component coverage for a pin leader line and anchor dot
  - render a subtle vertical leader from the floating pin card down to the geographic anchor point
  - use the exact same cyan tone as the `Marketplace Map` eyebrow text (`text-cyan-300`, `#67E8F9`)
  - keep the marker accessible as a button and preserve hover/focus camera behavior

### S13 - deferred subtle camera orbit
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s13-deferred-camera-motion`
- Scope:
  - TDD first: add coverage proving camera motion does not start during the initial render window
  - add a delayed, subtle circular camera drift to create depth after the marketplace map has settled
  - defer the animation with a timer so it does not compete with initial load and Core Web Vitals
  - respect `prefers-reduced-motion`
  - keep the movement small enough that pins remain discoverable and readable
- Production status: superseded by `fix/app-marketplace-disable-auto-camera-orbit-bri-164`; only the automatic orbit is disabled while hover focus and selected-pin centering remain active.

### S14 - clean-code sold-percent formatting
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s14-clean-code-formatting`
- Scope:
  - TDD first: add direct coverage for marketplace sold-percent formatting
  - remove duplicated `% sold` formatting logic from the map pin and pin list panel
  - keep output stable for integer, decimal, and trailing-zero percentage values
  - preserve the current visual rendering and map camera behavior

### S15 - Core Web Vitals and SEO audit
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s15-web-vitals-seo-audit`
- Scope:
  - audit `/marketplace` SEO readiness and Core Web Vitals risk after the Mapbox visual slices
  - document assumptions, evidence, findings, score, and limitations
  - verify that deferred map motion does not intentionally compete with initial page load
  - do not implement SEO or performance fixes in this slice unless a blocking configuration issue is discovered
  - preserve runtime behavior

### S16 - clean-code refactor audit
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s16-clean-code-refactor-audit`
- Scope:
  - run a final clean-code/refactor audit over the marketplace map surface
  - document blocking and non-blocking findings with file references
  - avoid broad rewrites in the audit slice
  - confirm targeted marketplace map tests still pass
  - preserve runtime behavior

### S17 - Linear and artifact sync
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s17-linear-artifact-sync`
- Scope:
  - sync S12-S16 merge status into the governing feature artifact
  - capture S15 Core Web Vitals/SEO findings as explicit follow-up backlog
  - capture S16 clean-code audit result and non-blocking refactor candidates
  - update Linear `BRI-164` with the same operational summary
  - preserve runtime behavior

### S18 - single-file MarketplaceMapClient refactor
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s18-map-client-refactor`
- Runtime file scope:
  - `components/marketplace/MarketplaceMapClient.tsx`
- Scope:
  - apply the clean-code audit finding to one runtime file only
  - split camera/orbit state derivation, map movement handling, and marker rendering into smaller same-file units
  - do not create new runtime files in this slice
  - preserve visual behavior, map camera behavior, accessibility labels, and deferred motion behavior
  - validate with the existing marketplace map component tests before and after refactor

### S19 - MarketplaceMapMarker extraction
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s19-map-marker-extraction`
- Runtime file scope:
  - `components/marketplace/MarketplaceMapMarker.tsx`
- Scope:
  - TDD first: add direct marker rendering coverage before extraction
  - extract the marker card, leader line, anchor dot, and activation handlers out of `MarketplaceMapClient`
  - keep marker visuals, accessibility label, cyan leader color, and activation behavior unchanged
  - leave map camera/orbit state in `MarketplaceMapClient` for a separate slice

### S20 - marketplace map view-state hook extraction
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s20-map-view-state-hook`
- Runtime file scope:
  - `components/marketplace/useMarketplaceMapViewState.ts`
- Scope:
  - TDD first: add direct hook coverage for selected-pin camera and focus behavior
  - extract camera key, camera view-state creation, moved state, and deferred orbit state out of `MarketplaceMapClient`
  - keep `MarketplaceMapClient` focused on Mapbox wiring and marker composition
  - preserve existing camera behavior, hover/focus behavior, and deferred motion behavior

### S21 - P2 clean-code debt artifacts
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s21-p2-debt-artifacts`
- Documentation scope:
  - `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s21-p2-debt-inventory.md`
  - atomic implementation artifacts S22-S43 under `docs/features/`
- Scope:
  - document strict audit P2 findings with problem, solution, impact, and prevention plan
  - split the P2 follow-ups into one-change implementation slices before touching runtime code
  - require TDD-first execution in every runtime slice
  - preserve runtime behavior

### S22 - admin safe create errors
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s22-admin-safe-create-errors`
- Runtime file scope:
  - `app/api/admin/marketplace/entries/route.ts`
- Scope:
  - TDD first: add an API test proving internal create errors are not returned in 500 response bodies
  - return a generic public `MARKETPLACE_ENTRY_CREATE_FAILED` message for non-conflict 500s
  - preserve existing 400 and 409 behavior

### S23 - marketplace read result contract
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s23-read-result-contract`
- Runtime file scope:
  - `lib/property-marketplace-server.ts`
- Scope:
  - TDD first: add server tests proving degraded persisted reads are representable
  - introduce a minimal read result contract without changing existing public return shapes
  - do not render UI or add logging in this slice

### S24 - marketplace page degraded state
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s24-page-degraded-state`
- Runtime file scope:
  - `app/marketplace/page.tsx`
- Scope:
  - TDD first: add a page test for degraded marketplace data
  - render a user-safe degraded-state signal while keeping the list usable
  - preserve true empty inventory behavior

### S25 - marketplace read failure logging
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s25-read-failure-logging`
- Runtime file scope:
  - `lib/property-marketplace-server.ts`
- Scope:
  - TDD first: add a server/observability test proving persisted read failures emit a structured event
  - add logging only for marketplace read failures
  - preserve user-facing behavior from S23/S24

### S26 - row mapper extraction
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s26-row-mapper-extraction`
- Runtime file scope:
  - `lib/property-marketplace-server.ts`
  - one new marketplace row mapper module
- Scope:
  - TDD first: preserve persisted row mapping outcomes
  - move row-to-domain and create-input-to-detail mapping only
  - preserve all public server exports

### S27 - read repository extraction
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s27-read-repository-extraction`
- Runtime file scope:
  - marketplace persisted read SQL
- Scope:
  - TDD first: preserve persisted read success/fallback behavior
  - extract read SQL only
  - do not move write SQL or selectors

### S28 - write repository extraction
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s28-write-repository-extraction`
- Runtime file scope:
  - marketplace persisted create SQL
- Scope:
  - TDD first: preserve successful create and duplicate-entry behavior
  - extract write SQL only
  - preserve admin route behavior

### S29 - selector extraction
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s29-selector-extraction`
- Runtime file scope:
  - marketplace filter/list/city/map source selector logic
- Scope:
  - TDD first: add direct pure selector coverage
  - extract filtering and projection logic only
  - do not add coordinate range validation in this slice

### S30 - sync status extraction
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s30-sync-status-extraction`
- Runtime file scope:
  - marketplace Solana sync status logic
- Scope:
  - TDD first: preserve available, unavailable, and rpc-error behavior
  - extract sync status and best-effort persistence only
  - preserve `getMarketplacePropertyDetailOrThrowRpc`

### S31 - server facade cleanup
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s31-server-facade-cleanup`
- Runtime file scope:
  - `lib/property-marketplace-server.ts`
- Scope:
  - TDD first: run targeted server suite before cleanup
  - remove only orphaned implementation after S26-S30 extractions
  - keep public exports stable

### S32 - detail formatter extraction
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s32-detail-formatters-extraction`
- Runtime file scope:
  - `components/marketplace/PropertyDetailContent.tsx`
  - one formatter helper
- Scope:
  - TDD first: add direct formatter tests
  - move only detail formatting helpers
  - preserve detail UI output

### S33 - detail Google Maps card
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s33-detail-google-maps-card`
- Runtime file scope:
  - Google Maps section in `PropertyDetailContent.tsx`
- Scope:
  - TDD first: add embed and fallback-link component tests
  - extract only the Google Maps card
  - preserve detail page behavior

### S34 - detail hero section
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s34-detail-hero-section`
- Runtime file scope:
  - hero section in `PropertyDetailContent.tsx`
- Scope:
  - TDD first: add hero title/status/CTA tests
  - extract only the hero section
  - preserve `imageClassName` and `layoutId` behavior

### S35 - detail investment summary
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s35-detail-investment-summary`
- Runtime file scope:
  - fractional investment summary card
- Scope:
  - TDD first: add supply/sold/price/ROI/availability tests
  - extract only the investment summary card
  - preserve locale labels

### S36 - detail property information
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s36-detail-property-info`
- Runtime file scope:
  - property information card
- Scope:
  - TDD first: add location/postal/highlights tests
  - extract only the property information card
  - preserve optional postal code behavior

### S37 - detail deal economics
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s37-detail-deal-economics`
- Runtime file scope:
  - deal economics card
- Scope:
  - TDD first: add visible/hidden metric tests
  - extract only the deal economics card
  - preserve conditional metric behavior

### S38 - detail fees and return
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s38-detail-fees-return`
- Runtime file scope:
  - fees and projected return card
- Scope:
  - TDD first: add fee and projected ROI tests
  - extract only the fees and return card
  - preserve conditional metric behavior

### S39 - detail execution and governance
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s39-detail-execution-governance`
- Runtime file scope:
  - execution/exit card
  - governance card
- Scope:
  - TDD first: add execution/governance tests
  - extract only the paired execution/governance cards
  - preserve optional project field behavior

### S40 - detail documents and blockchain
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s40-detail-documents-blockchain`
- Runtime file scope:
  - documents card
  - blockchain info card
- Scope:
  - TDD first: add documents/blockchain tests
  - extract only the paired documents/blockchain cards
  - preserve link and unavailable-state behavior

### S41 - coordinate range validation
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s41-coordinate-range-validation`
- Runtime file scope:
  - `lib/marketplace-map-pins.ts`
- Scope:
  - TDD first: add out-of-range latitude and longitude tests
  - enforce public pin latitude/longitude ranges
  - preserve valid pin projection behavior

### S42 - Mapbox lazy boundary
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s42-mapbox-lazy-boundary`
- Runtime file scope:
  - `components/marketplace/MarketplaceExperience.tsx`
  - `components/marketplace/MarketplaceMapClient.tsx`
- Scope:
  - TDD first: add list-before-map readiness tests
  - add only the measured lazy/deferred Mapbox client boundary
  - keep map-top as the configured premium state when ready

### S43 - Web Vitals recheck
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s43-web-vitals-recheck`
- Runtime file scope:
  - none expected
- Scope:
  - rerun local production Lighthouse/browser evidence after S42
  - compare against S15 mobile LCP/TBT and desktop TBT
  - document remaining risk without mixing in runtime changes
- Completed evidence:
  - `npm run build` passed.
  - Local production `/marketplace` returned `200` and initial HTML did not include `marketplace-map-shell` or `marketplace-map-client`, confirming the S42 deferred Mapbox boundary.
  - Lighthouse desktop: performance `97`, SEO `100`, LCP `1.1s`, TBT `0ms`.
  - Lighthouse mobile: performance `74`, SEO `100`, LCP `5.1s`, TBT `259ms`, CLS `0.055`.
  - Compared with S15, mobile LCP improved from `8.0s` to `5.1s` and mobile TBT improved from `870ms` to `259ms`; mobile LCP remains above target and is documented as residual risk.

### S44 - Marketplace security audit and remediation plan
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s44-security-audit-plan`
- Runtime file scope:
  - none expected
- Documentation file scope:
  - `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s44-security-audit-plan.md`
- Scope:
  - run an exhaustive security audit over marketplace routes, detail, public APIs, admin create, purchase APIs, Mapbox/Google Maps surfaces, repositories, CSP, dependencies, and secret patterns
  - document findings with severity, evidence, impact, and solution
  - split remediation into TDD-first follow-up slices so fixes do not land as one large branch
- Completed evidence:
  - `npm run validate:operability` passed.
  - Targeted security-relevant API/unit tests passed.
  - `npm audit --omit=dev --json` reported release-blocking direct dependency findings that are documented in the S44 artifact.
  - Secret-pattern scan found only placeholders and test fixtures, not committed production-looking Mapbox, Google Maps, private key, or webhook secrets.

## Latest Merge Evidence
- `bfc4d8d merge: s12 marketplace pin leader line`
- `61b96ad merge: s13 deferred map camera motion`
- `d7e55fa merge: s14 marketplace clean code formatting`
- `1abf11a merge: s15 marketplace web vitals seo audit`
- `8774866 merge: s16 marketplace clean code refactor audit`
- `399f96e merge: s18 marketplace map client refactor`
- `c5dd9b9 merge: s19 marketplace map marker extraction`
- `e057152 merge: s20 marketplace map view state hook`
- `npm run validate` passed after S20 merge and passed again before S21 documentation work.

## Accepted Follow-Up Backlog
- Performance: evaluate lazy hydration or delayed mobile activation for the Mapbox island while keeping the list usable immediately.
- Performance: audit route-level JavaScript, wallet/modal providers, and Mapbox loading boundaries to reduce TBT/INP risk.
- SEO: align marketplace metadata language with the visible H1 or add an explicit localized metadata strategy.
- SEO: evaluate approved structured data for marketplace inventory after product/legal schema approval.
- Reliability: replace silent data-load fallback paths with observable degraded-state metadata or structured logging.
- API hardening: avoid returning raw internal 500 error messages from admin marketplace entry creation.
- Architecture: split `lib/property-marketplace-server.ts` into focused repository, mapper, selector, and sync modules.
- UI maintainability: split `PropertyDetailContent` into focused detail section components.
- Data quality: validate coordinate ranges at the public map pin projection boundary.

## Files Most Likely to Change
- `app/marketplace/page.tsx`
- `app/marketplace/loading.tsx`
- `components/marketplace/MarketplaceFilters.tsx`
- `components/marketplace/MarketplaceGridClient.tsx`
- new marketplace map and state-switching components under `components/marketplace/`
- new map foundation helpers under `lib/`
- `lib/property-service.ts`
- `lib/property-marketplace-server.ts`
- `package.json`
- `.env.example`
- `tests/lib/property-marketplace-server.test.ts`
- tests for the page, state machine, and map fallback

## Tooling Required
- Mapbox GL JS v3
- React Map GL
- Mapbox DevKit MCP Server for style/tooling assistance where the assistant runtime supports configured MCP servers
- Mapbox Studio published style URL through `NEXT_PUBLIC_MAPBOX_STYLE_URL`
- Motion 12 for the pin and panel feel where appropriate
- Existing Next.js App Router stack
- Vitest for state and component coverage
- Browser-based validation for the marketplace surface

## Test-Plan-First Contract
Before implementation is considered complete:
1. Every slice starts by introducing failing tests for the behavior that slice owns.
2. Add unit tests for the map token helper, location projection, and fallback logic before implementation.
3. Add component tests for the controlled map wrapper, cycle button, and map-ready rendering before implementation.
4. Verify the page still falls back to list-only when map loading fails.
5. Run browser validation for the marketplace surface.
6. Confirm the detail page remains a normal detail entry point.
7. Finish with `npm run validate`.

## Mapbox DevKit MCP Tooling Contract
- Official source: `https://docs.mapbox.com/api/guides/devkit-mcp-server/#installation`
- Hosted endpoint: `https://mcp-devkit.mapbox.com/mcp`
- Codex repo config should register the hosted endpoint in `.codex/config.toml`.
- Cursor repo config should register the hosted endpoint through `npx mcp-remote` in `.cursor/mcp.json`.
- Hosted endpoint authentication is OAuth-driven in the consuming client; do not commit `MAPBOX_ACCESS_TOKEN`.
- If token creation, prompts, or local-only server features become required, use the npm/local setup with `@mapbox/mcp-devkit-server` and provide `MAPBOX_ACCESS_TOKEN` from the local machine or secret manager only.
- Token scopes for local/npm mode depend on tool usage:
  - style operations: `styles:list`, `styles:read`, `styles:download`, `styles:write`
  - token management: `tokens:read`, `tokens:write`
  - feedback access: `user-feedback:read`
  - preview generation: `tokens:read` plus at least one public token with `styles:read`

## Decimal-Inspired BRIDS Style Contract
- Visual reference: Decimal community style by Tristen Brown, adapted to BRIDS colors.
- Runtime env var: `NEXT_PUBLIC_MAPBOX_STYLE_URL`.
- Safe fallback: `mapbox://styles/mapbox/dark-v11`.
- Desired published style name: `BRIDS Marketplace Decimal`.
- Importable style artifact: `docs/mapbox/brids-marketplace-decimal-style.json`.
- Publish runbook: `docs/mapbox/README.md`.
- Desired visual outcome:
  - dark editorial base rather than default navigation map
  - USA landmass reads in cyan like the marketplace chart lines
  - surrounding geography stays darker so the map does not become visually noisy
  - low-noise POIs so marketplace listings become the primary POIs
  - navy/black water and exterior geography with cyan/silver labels
  - violet roads and boundaries for the network/grid feel
  - selected pin/card uses the website cyan-to-violet gradient
- Publish requirement:
  - manual path: import the JSON in Mapbox Studio, publish, then set `NEXT_PUBLIC_MAPBOX_STYLE_URL`
  - API path: use a private `MAPBOX_ACCESS_TOKEN` with `styles:write` and a Mapbox username
  - runtime path: keep using public `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`; never commit private style-write tokens

## Camera Focus Contract
- Helper: `lib/marketplace-map-camera.ts`.
- No selection:
  - derive latitude and longitude from the pin bounds midpoint
  - derive zoom from the geographic span so the grouped inventory remains visible
  - keep default pitch at `45`
- Selected pin:
  - center latitude and longitude on the selected pin
  - use close discovery zoom `7.25`
  - use pitch `52`
- If the selected pin id is stale or missing, fall back to aggregate pin centering.
- If there are no pins, fall back to the default USA camera.

## Guardrails
- Do not replace the traditional list.
- Do not change the detail page behavior.
- Do not expand the map beyond USA.
- Do not overcomplicate the pins with extra metadata.
- Do not let the map block the page when it is slow or unavailable.
- Do not turn the interaction into a noisy dashboard.
- Do not let reduced-motion and mobile users get a broken experience.

## Completion Gates
- The single-button state cycle works as agreed.
- The fallback to list-only is reliable.
- Hovering a pin zooms into the property.
- The marketplace detail page is unchanged.
- Browser validation confirms the surface feels intentional.
- The final clean-code audit slice has no unresolved blocking findings.
- `npm run validate` passes.

## Linear Sync
- After approval of S02, update `BRI-164` with the tooling contract, the canonical location projection plan, and the confirmed slice boundaries.
- After implementation, sync any final changes to the issue so Linear reflects the implemented behavior and validation status.
