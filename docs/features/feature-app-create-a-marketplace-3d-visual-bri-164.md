# Feature Note: Marketplace 3D Visual (BRI-164)

## Status
- Map camera focus slice
- Parent issue: `BRI-164`
- Mother/integration branch: `feature/app-create-a-marketplace-3d-visual-bri-164-integration`
- Current slice: `feature/app-create-a-marketplace-3d-visual-bri-164-s11-map-camera-focus`

## Summary
Create a premium 3D marketplace exploration experience on `/marketplace` that complements the current traditional listing instead of replacing it.

The page should feel like a curated discovery surface for a single property at a time, with a USA-only map, animated pins, and a state-cycling button that lets the user change how the same inventory is viewed.

The detail page stays as it is today.

## Product Intent
- Keep `/marketplace` as the only entry point for the map experience.
- Make the interface feel like discovery first and conversion second.
- Preserve the traditional list as a stable, trustworthy fallback.
- Use the map to create a premium "real estate investment" feeling, not a noisy dashboard feeling.

## Confirmed Interaction Contract
- One button cycles through the screen states.
- The states are:
  - map on top and traditional list below
  - only list
  - only map
  - traditional list on top and map below
- Default intended experience is map on top and list below.
- If the Mapbox token is missing or the map fails to load, the page falls back to list-only.
- When the map becomes available, it should mount without blocking the list.
- The map covers USA only.
- Pins show:
  - property name
  - `% sold`
- Pins render with a subtle leader line and anchor dot pointing from the floating card to the property's map location.
- The leader line uses the same clear cyan as the `Marketplace Map` label (`text-cyan-300`, `#67E8F9`).
- Hovering a pin zooms the map to that property.
- Selecting a marketplace pin from the map panel centers the camera on that property.
- When no property is selected, the map camera centers on the midpoint that keeps the available marketplace pins visually grouped.
- After initial load settles, the map may use a subtle circular camera drift to create depth.
- Camera drift must be deferred and disabled for reduced-motion users so it does not compete with Core Web Vitals or accessibility.
- The map should emphasize the single property being shown so the user feels like they are discovering that location.
- The marketplace detail page remains a normal detail entry point and does not adopt the 3D states.
- S08 exception: the detail page may render the existing Google Maps location preview for the property, using the canonical admin location payload, as long as it does not introduce the Mapbox 3D marketplace state machine into detail.

## Technical Specification
### Mapbox GL JS v3 + React Map GL
This feature should be built on `Mapbox GL JS v3` plus `React Map GL`.

Why this stack:
- `Mapbox GL JS v3` is the rendering engine. It uses WebGL under the hood, so the GPU does the heavy lifting for map rendering, zooming, panning, and 3D camera work.
- That matters here because the marketplace may grow from a small set of listings into a much larger USA-wide inventory, and the surface still needs to feel smooth when the user explores the map.
- `React Map GL` is the React integration layer. It lets the map fit naturally into the existing Next.js / React component model instead of forcing the page into a custom imperative setup.
- The separation of responsibilities stays clean:
  - Mapbox GL JS v3 handles map rendering, camera behavior, and geographic projection.
  - React Map GL handles React state, lifecycle, and component composition.
- The result is a better fit for a state-driven marketplace screen where the list, map, and view-cycle button need to stay coordinated.

Technical implications:
- The map should live in a client-only component or island so the page can keep its server-rendered structure.
- The page must still render the list when the map is unavailable, slow, or misconfigured.
- The map experience should be driven by state and props, not by a large imperative wrapper around the entire marketplace page.
- The map should import the base `mapbox-gl` CSS in the client entrypoint that hosts the map.

## Tooling Considerations
- Use a public client-exposed token, not a secret token, for Mapbox access.
- The expected repo convention is a `NEXT_PUBLIC_*` env var for client-safe configuration.
- Use `NEXT_PUBLIC_MAPBOX_STYLE_URL` for the published BRIDS marketplace style. Fall back to `mapbox://styles/mapbox/dark-v11` until the custom style is published.
- Use the hosted Mapbox DevKit MCP endpoint for assistant-side style/tooling help when available; this is separate from the runtime `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` used by the app.
- Do not commit `MAPBOX_ACCESS_TOKEN`; local/npm MCP mode must source it from the developer machine or secret manager only.
- If the token is missing, the marketplace must stay list-only instead of rendering a broken map shell or a token warning.
- The map should use the `react-map-gl/mapbox` entrypoint and stay controlled by React state so hover focus and camera changes remain predictable.
- The public marketplace map should reuse the canonical location data already captured when an item is created, including `google_maps_place_json` and persisted coordinates (`geoLat`, `geoLng`) when they are available.
- The public marketplace read model may need to project that canonical location contract into the list/map payload, but it should not invent a separate source of truth.
- Entries without canonical US map location data should stay list-only rather than forcing an approximate pin.
- The tooling slice should establish the dependency and environment contract before UI slices depend on it.

## Map Style Direction
The target style is `Decimal x BRIDS`: a quiet editorial dark map inspired by the Decimal community style by Tristen Brown, adapted to the website palette.

BRIDS palette mapping:
- exterior background: `#02040A`
- dark water / non-focus geography: `#030712`
- panel navy: `#0E1324`
- USA focus fill: `#2FC6FF`
- minor roads: `#4C1D95`
- major roads: `#7C3AED`
- road highlight: `#A78BFA`
- labels primary: `#E2E8F0`
- labels secondary: `#94A3B8`
- BRIDS cyan: `#2FC6FF`
- BRIDS violet: `#7C3AED`

Style rules:
- remove generic noisy POIs
- keep city, state, neighborhood, and major road labels readable
- make the USA landmass a controlled cyan highlight against a darker surrounding map
- use violet for map lines so the pin and property card remain the brightest interaction layer
- avoid a dashboard/heatmap look in the first release

Style artifact:
- importable JSON: `docs/mapbox/brids-marketplace-decimal-style.json`
- publishing notes: `docs/mapbox/README.md`
- runtime env after publish: `NEXT_PUBLIC_MAPBOX_STYLE_URL=mapbox://styles/{username}/{style_id}`
- publishing through the Mapbox Styles API requires a private token with `styles:write`; do not commit that token
- if no published URL is configured, the runtime keeps `mapbox://styles/mapbox/dark-v11` as the safe fallback

## Camera Direction
- The map should not stay on a generic USA center when marketplace entries have coordinates.
- With no selection, camera state should be derived from available pins so the user sees the active inventory as a grouped discovery area.
- With one selected pin, camera state should move to that pin with a closer zoom and slightly higher pitch.
- Selection should not navigate away from `/marketplace`; detail navigation remains available through the traditional list/card path.
- The camera calculation should live in a pure helper so the behavior can be tested outside Mapbox GL.

## Problem Statement
The current marketplace experience is functional, but it is mostly a conventional list-first browsing surface.

That works for clarity, but it does not yet create enough sense of place, rarity, or premium discovery for the marketplace itself.

The new 3D visual is meant to add the missing layer of presence:
- show the user where a property lives
- make the property feel more tangible
- create a stronger first impression on `/marketplace`
- keep the conversion path intact by preserving the list

## Current Gaps
- There is no state-cycling marketplace surface today.
- There is no USA-only 3D map layer for `/marketplace`.
- There is no hover-driven zoom focus on property pins.
- There is no explicit fallback contract for missing Mapbox configuration.
- The public marketplace projection does not yet expose the canonical location payload captured during item creation, so the map cannot consume the same Google Maps-backed location contract that admin uses today.
- The current detail page is separate, but the main marketplace view does not yet create the premium discovery effect described in BRI-164.

## In Scope
- `app/marketplace/page.tsx`
- `app/marketplace/loading.tsx`
- New marketplace map and state-switching components under `components/marketplace/`
- Any small data-shaping helpers needed to feed the map view
- Tests for state cycling, fallback behavior, and map-ready rendering

## Non-Goals
- No redesign of the marketplace detail page.
- No Mapbox 3D state machine on the marketplace detail page; Google Maps location preview restoration is allowed as a focused detail fix.
- No map experience outside the USA.
- No additional pin metadata beyond property name and `% sold` in the map surface.
- No auth, wallet, or on-chain behavior changes.
- No replacement of the traditional list.
- No admin flow changes.

## Success Criteria
- The user can cycle the marketplace through the four agreed states with one button.
- The default experience feels premium and exploratory.
- The page remains usable when Mapbox is unavailable.
- The list remains the reliable fallback and conversion anchor.
- Hovering a pin zooms to the property in a way that feels intentional rather than gimmicky.
- Selecting a pin centers that marketplace entry in the map camera.
- When no pin is selected, the map camera centers the available inventory instead of using an unrelated static center.
- The detail page remains unchanged.

## Open Questions
- Should the map mount into the combined state immediately after it is ready, or should it first appear in the lower slot and then be promoted by the button cycle?
- Should the chosen view state persist across reloads, or reset every time the user returns to `/marketplace`?
- What zoom and easing values best create the "searching the state" feeling without making the motion feel slow?

## Risks
- Mapbox token configuration could be missing in some environments.
- The map could take longer to initialize than the rest of the page.
- The 3D surface could become visually loud if the map competes with the inventory list.
- Mobile and reduced-motion users need a graceful experience that still feels intentional.

## Validation Direction
- Every implementation slice should begin with failing tests for the behavior it owns.
- Add focused unit tests for the state machine and fallback decisions.
- Add component coverage for the marketplace view mode switch and map-ready rendering.
- Verify the detail page stays unchanged.
- Run browser validation after implementation to confirm the visual states and hover behavior.
- Finish with a dedicated clean-code audit slice before closure.

## Traceability
- Linear issue: `BRI-164`
