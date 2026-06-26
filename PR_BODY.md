## Summary
This PR implements the premium mobile initial loading screen (splash screen) for the BRIDS application under the issue key `BRI-178` satisfying all specifications (SPEC 01 through SPEC 07) using Motion 12.

**Key Changes**
- **Premium Loading Screen Centering (SPEC 05 & SPEC 06):** Rendered the full inline SVG logo (B-mark + "BRIDS" wordmark) perfectly centered at the start. On collapse, the wordmark slides left (`x: -70`) and dissolves with a staggered left-to-right fade, using accelerated timings for the last two letters (D and S: 60ms and 45ms duration) to ensure a snappy finish. The slide easing matches the main logo's deceleration (`easeOutQuart`). The B-mark shifts right to its final vertical centered-left position.
- **Drifting Glows & Exit Timing (SPEC 03 & SPEC 04):** Added four breathing background glows. On dark-mode exit, B-mark scales to 70x, and on light-mode exit, it fades with a white burst overlay.
- **Delayed Landing Reveal (SPEC 07):** The landing page layout is initially hidden and performs a quick `110ms` fade-in once the splash screen unmounts, delayed by `350ms`. A `<noscript>` head fallback stylesheet was added for browsers without JS.

---

## Issue
- **Linear:** `BRI-178`

## RFC
- **RFC:** `N/A`

## Risks / Riesgos
- **Risk:** Low. The changes are purely visual and isolated to the initial load and landing page reveal transition. The behavior is fully covered by local unit tests.

## Rollback Plan
- **Rollback:** Revert the merge commit or remove/disable the `<AppSplashScreen />` component in `app/layout.tsx`.

## Devnet Proof / Prueba Devnet
- **Devnet Proof:** `N/A` (No on-chain interactions are performed).

## Feature Flag Strategy
- **Feature Flag:** N/A.

## Human Acceptance
Status: approved
> ✅ Approved and manually verified in the local workspace session.
> **Approved by:** Jay / Jaymusicmachine

## Walkthrough Artifact
- **Path:** [walkthrough.md](file:///Users/jaymusicmachine/.gemini/antigravity/brain/9701bf38-0665-4271-8079-4d6e43362923/walkthrough.md)

## Validation
- Unit tests and project validation completed successfully:
  `npm run validate`

## Required Labels
- [x] `scope:app`
- [x] `type:feature`
- [x] `risk:low`