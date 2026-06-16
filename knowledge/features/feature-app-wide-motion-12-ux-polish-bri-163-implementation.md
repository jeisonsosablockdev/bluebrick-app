---
type: Feature Spec
title: Feature App Wide Motion 12 Ux Polish BRI- 163 Implementation
description: Feature App Wide Motion 12 Ux Polish BRI- 163 Implementation - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-wide-motion-12-ux-polish-bri-163-implementation.md
---

# Implementation Plan: App-wide Motion 12 UX Polish (BRI-163)

## Status
- Solution artifact
- Depends on: `docs/features/feature-app-wide-motion-12-ux-polish-bri-163.md`
- Mother/integration branch: `feature-app-wide-motion-12-ux-polish-bri-163`
- Current slice: `feature-app-wide-motion-12-ux-polish-bri-163-s07-nav-origin-expansion`

## Goal
Implement a shared Motion 12 experience that makes the main user-facing interactions feel like real transitions instead of abrupt state swaps, while keeping the landing page fast and preserving the current auth and session boundaries.

## Decision Summary
1. Use Motion 12 as the shared motion runtime for client-side transitions and interaction feedback.
2. Keep the admin dashboard out of scope.
3. Keep the landing page SSR-first and isolate motion to small client islands so performance stays under control.
4. Use motion to communicate entry, exit, expansion, activation, progression, and opening.
5. Respect reduced-motion preferences everywhere.
6. Do not change auth/session authority, wallet trust, or business rules.
7. Use one shared motion vocabulary so language switching, theme switching, login flow, loading, and property detail transitions feel coordinated instead of unrelated.
8. Use the current Motion 12 syntax only; legacy `framer-motion` imports, examples, or patterns are not acceptable.
9. Make the main navigation routes feel like the destination emerges from the pressed navigation button instead of swapping pages abruptly.

## Tooling And Syntax Discipline
- S02 owns the Motion 12 setup, including `motion.dev`, the shared motion runtime, and the MCP Motion integration with Codex.
- S03 owns syntax discipline, including current `motion` imports only and explicit rejection of legacy `framer-motion` patterns in code, tests, and review.
- All examples, helpers, and generated snippets must use the current Motion 12 naming so the team does not regress to the old package name by habit.

## Performance Guardrails
- Preserve the current Core Web Vitals profile of the landing page.
- Treat the existing pre-render and partial-SSR strategy as intentional infrastructure, not something to replace with a client-heavy motion layer.
- Avoid turning `app/page.tsx` into a broad client component just to host motion.
- Keep motion local to the smallest practical client islands so the landing shell stays fast.
- Any change that measurably regresses the current performance baseline is a blocker, not a polish issue.
- Prefer motion that reuses the current rendering model instead of introducing extra hydration work on the public entry path.

## User-Requested Feel Map
- Language changes should feel like the interface refreshed into the new language.
- Page changes should feel like moving to another place.
- Menus, especially profile subsections, should feel like they are unfolding.
- Light and dark mode should feel like the interface is moving from light to darkness or back again.
- Login should feel like a meaningful event, not a silent state swap.
- Federated login departure and return should feel like leaving one place and coming back into another.
- Loading should feel like progress that advances and approaches completion.
- Button presses should feel like the click was received and the action activated.
- Property opening should feel like the property itself opened.

## Motion Vocabulary
- `pageEnter` and `pageExit` for route changes.
- `navOriginExpand` for the main navigation routes that should feel like they emerge from the pressed button.
- `panelExpand` and `panelCollapse` for menus and profile sections.
- `themeCrossfade` for light and dark changes.
- `authEnter` and `authReturn` for login and federated round-trips.
- `loadingAdvance` for staged loading feedback that feels like progress.
- `pressFeedback` for button activation.
- `detailOpen` for property card to property detail continuity.

## Slice Plan

### S01 - documentation slice
- Branch: `feature-app-wide-motion-12-ux-polish-bri-163-s01-documentation-slice`
- Outcome: create the feature note and implementation note so the rest of the work has a governed source of truth.

### S02 - motion foundation
- Branch: `feature-app-wide-motion-12-ux-polish-bri-163-s02-motion-foundation`
- Scope:
  - add the Motion 12 runtime and `motion.dev` foundation
  - integrate MCP Motion with Codex so the motion workflow has the right tooling from the start
  - create shared motion helpers and variants
  - add reduced-motion handling
  - define route-aware transition primitives without wrapping the entire app shell

### S03 - locale, theme, button feedback, and syntax discipline
- Branch: `feature-app-wide-motion-12-ux-polish-bri-163-s03-locale-theme-button-motion`
- Scope:
  - make `components/i18n/language-switcher.tsx` feel like an interface refresh
  - make `components/theme/theme-toggle.tsx` feel like a light/dark shift
  - add shared press feedback for primary and secondary buttons
  - keep the interaction feedback consistent in the onboarding and wallet modals
  - enforce current Motion 12 syntax across examples, helpers, and tests
  - reject legacy `framer-motion` imports, examples, or snippets in the review path

### S04 - auth, login, and page transitions
- Branch: `feature-app-wide-motion-12-ux-polish-bri-163-s04-auth-navigation-motion`
- Scope:
  - animate auth entry and return around `components/WalletModal.tsx`
  - reinforce the federated login out-and-back flow in `app/auth/link/federated/complete/route.ts`
  - add route transition behavior for public and protected user routes
  - make profile section changes and menu expansion feel like deliberate panel openings

### S05 - loading and property detail motion
- Branch: `feature-app-wide-motion-12-ux-polish-bri-163-s05-loading-property-motion`
- Scope:
  - upgrade loading states in `app/marketplace/loading.tsx` and `app/marketplace/[id]/loading.tsx`
  - turn passive progress into staged progress with a near-complete feeling
  - make `components/marketplace/MarketplaceCard.tsx` and `components/marketplace/PropertyDetailContent.tsx` feel like one continuous open action
  - keep loading and open-state motion lightweight enough for the landing and marketplace surfaces

### S06 - performance, responsive QA, and docs sync
- Branch: `feature-app-wide-motion-12-ux-polish-bri-163-s06-qa-performance-docs`
- Scope:
  - run responsive QA on the public and protected user surfaces
  - validate auth/login flows with browser evidence
  - verify the landing page remains performant after motion changes
  - update any docs that need follow-through from the implementation

### S07 - navigation origin expansion fixfix
- Branch: `feature-app-wide-motion-12-ux-polish-bri-163-s07-nav-origin-expansion`
- Scope:
  - replace the current main-route page transition with a soft expansion that appears to emerge from the pressed primary navigation button
  - keep the navigation bar visually stable so button size, position, and color do not change when the transition runs
  - apply the behavior only to the primary navigation buttons that move between the main, marketplace, protected, and admin destinations
  - keep the effect fintech-modern, premium, and restrained instead of flashy or distracting
  - preserve the existing performance posture of the landing and avoid introducing a heavy client wrapper just to support the effect

### S07 fixup - quick tour scope tightening
- Keep `components/dashboard/quick-tour-overlay.tsx` scoped to `/protected/perfil` so the protected overview shell stays clean and the profile tour only appears where the anchor fields exist.
- Preserve the existing profile onboarding guidance on the profile page while preventing the tour backdrop from competing with the overview sidebar.

## Files Most Likely to Change
- `components/i18n/language-switcher.tsx`
- `components/theme/theme-toggle.tsx`
- `components/WalletModal.tsx`
- `components/onboarding/onboarding-reward-decision-modal.tsx`
- `components/dashboard/protected-shell.tsx`
- `components/dashboard/quick-tour-overlay.tsx`
- `components/dashboard/onboarding-reward-reminder.tsx`
- `components/dashboard/auth-link-status-banner.tsx`
- `components/marketplace/MarketplaceCard.tsx`
- `components/marketplace/PropertyDetailContent.tsx`
- `components/motion/path-route-transition.tsx`
- `components/motion/route-transition.tsx`
- `components/WalletModal.tsx`
- `components/ui/button.tsx`
- `app/layout.tsx`
- `app/page.tsx`
- `app/protected/page.tsx`
- `app/protected/perfil/page.tsx`
- `app/marketplace/page.tsx`
- `app/marketplace/[id]/page.tsx`
- `app/admin/page.tsx`
- `app/marketplace/loading.tsx`
- `app/marketplace/[id]/loading.tsx`
- `app/auth/link/federated/complete/route.ts`
- `app/sign-out/route.ts`

## Test-Plan-First Contract
Run and update tests before closing the implementation slices:

1. Add or update focused unit tests for motion helpers, reduced-motion fallback, and transition state derivation.
2. Add or update component tests for language switching, theme switching, button feedback, and menu expansion behavior where the repo already has coverage patterns.
3. Run Playwright smoke coverage for the main routes:
   - `/`
   - `/marketplace`
   - `/marketplace/[id]`
   - `/protected`
   - `/protected/perfil`
4. Run Synpress coverage for the login and federated return path when auth surfaces change.
5. Run responsive QA evidence for the public and protected surfaces.
6. Finish with `npm run validate`.

## Tooling Required
- Motion 12 / `motion.dev`
- MCP Motion integration with Codex
- OpenAI Developers docs-first workflow for UX/UI slices that need current tooling or bridge guidance
- Existing Next.js App Router stack
- Playwright
- Synpress
- Responsive QA browser evidence
- Existing CSS theme variable system

## Guardrails
- Do not introduce a client wrapper around `app/page.tsx` that would turn the landing page into a heavy client page.
- Do not move authority or session decisions into the client.
- Do not apply the same motion intensity to every surface; the admin dashboard stays excluded.
- Do not ship motion that ignores reduced-motion users.
- Do not let loading animation regress into a passive bar with no sense of progression.
- Do not let property detail open feel detached from the card that launched it.
- Do not sacrifice the landing page's current performance profile to make motion more visible.
- Do not reintroduce legacy `framer-motion` imports, examples, or syntax.

## Completion Gates
- Motion helpers are shared instead of duplicated per page.
- Route, auth, loading, button, locale, theme, and property-open interactions all follow the agreed motion vocabulary.
- Browser evidence exists for the user-facing flows.
- Responsive QA passes for the public and protected surfaces.
- Landing performance remains acceptable.
- `npm run validate` passes.

## Final Validation Summary
- `npm run validate` passed after the Motion 12 rollout across locale, theme, auth, route, loading, and property-open surfaces.
- Playwright smoke evidence passed for:
  - `/`
  - wallet modal direct auth entry
  - critical path responsive evidence
  - protected profile push/readiness controls
- The protected profile responsive spec was kept aligned with the actual PWA copy surfaced by the install / notification card.
- The landing page retained its existing performance-first shell strategy while motion remained isolated to small client islands.

## Linear Sync
- After S02 is approved, add a Linear comment to `BRI-163` with the motion vocabulary, the final in-scope surfaces, and the explicit admin-dashboard exclusion.
- After S06, sync the final test results and any scope adjustments back to `BRI-163` so the issue reflects the implemented motion language.
