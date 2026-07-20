---
type: Feature Spec
title: Feature App Wide Motion 12 Ux Polish BRI- 163
description: Feature App Wide Motion 12 Ux Polish BRI- 163 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-app-wide-motion-12-ux-polish-bri-163.md
---

# Feature Note: App-wide Motion 12 UX Polish (BRI-163)

## Status
- Documentation slice
- Parent issue: `BRI-163`
- Mother/integration branch: `feature-app-wide-motion-12-ux-polish-bri-163`
- Current slice: `feature-app-wide-motion-12-ux-polish-bri-163-s01-documentation-slice`

## Summary
Define a shared motion language for the user-facing app so state changes feel legible, directional, and intentional.

The goal is not decoration. The goal is to make the interface communicate when the user is entering, leaving, opening, expanding, switching, or completing something.

## Product Intent
- Locale changes should feel like the interface refreshed into the new language.
- Page changes should feel like movement to a new place.
- Menus and profile sections should feel like unfolding panels.
- Light and dark mode should feel like a real change in light.
- Login and federated return should feel like leaving and coming back through a threshold.
- Loading should feel progressive and like it is nearing completion.
- Button presses should feel acknowledged and activated.
- Opening a property should feel like opening that property.
- The admin dashboard is explicitly out of scope.
- Landing performance is a hard requirement.
- Current landing performance is already a strength and must be preserved.
- Existing pre-rendered and partially SSR strategies are part of that strength and should not be sacrificed for motion.

## Desired Interaction Feel
- When the language changes, the interface should feel like it has refreshed into the new language rather than only swapping text.
- When the user moves from one page to another, the transition should feel like traveling into a new place.
- When the user moves through the main navigation, the destination should feel like it emerges from the pressed button rather than swapping abruptly.
- When a menu opens, especially inside profile navigation, it should feel like a panel unfolding or expanding in place.
- When light mode changes to dark mode, the interface should feel like light giving way to darkness, and the reverse should feel like light returning.
- When login happens, it should feel like a real event is taking place.
- When the user exits toward federated login and then returns, the motion should reinforce leaving and coming back.
- When something is loading, it should feel like it is moving forward and approaching completion instead of sitting in a passive bar.
- When a button is clicked, it should feel like the action was received and activated.
- When a property opens, it should feel like the property itself has been opened.

## Problem Statement
The current app already works functionally, but several everyday interactions do not yet carry enough motion meaning:

- Locale switching updates text, but it does not feel like the interface reloaded into a new language.
- Route changes do not consistently feel spatial.
- Main navigation route changes still feel too much like plain page swaps instead of content emerging from the triggering button.
- Menus and profile sections expand without enough sense of unfolding or anchoring.
- Theme switching does not yet read as a light-to-dark or dark-to-light shift.
- Login and federated return do not yet feel like a deliberate exit and re-entry.
- Loading states rely too much on static placeholders and passive progress cues.
- Buttons do not always give enough feedback that the click was received and acted on.
- Property cards and property detail screens do not yet feel like a single opening motion.
- The landing page must stay fast, so any motion work must preserve the current performance posture.

## Current Gaps
- `components/i18n/language-switcher.tsx` changes locale immediately, but there is no shared transition story around the refresh feeling.
- `components/theme/theme-toggle.tsx` flips theme state, but the change does not yet read as a light shift into darkness or back again.
- `components/WalletModal.tsx`, `app/auth/link/federated/complete/route.ts`, and the protected shell do not yet present auth entry and return as one coherent motion journey.
- `components/dashboard/protected-shell.tsx`, `components/dashboard/quick-tour-overlay.tsx`, and the profile modules have expandable surfaces, but they do not yet feel like intentional panel openings.
- `app/marketplace/loading.tsx` and `app/marketplace/[id]/loading.tsx` still lean on pulse placeholders instead of progressive anticipation.
- `components/marketplace/MarketplaceCard.tsx` and `components/marketplace/PropertyDetailContent.tsx` do not yet provide a strong card-to-detail handoff.
- `app/page.tsx` is the most performance-sensitive public surface and must stay SSR-first while the rest of the motion work lands around it.

## In Scope
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
- `app/layout.tsx`
- `app/page.tsx`
- `app/protected/page.tsx`
- `app/protected/perfil/page.tsx`
- `app/marketplace/page.tsx`
- `app/marketplace/[id]/page.tsx`
- `app/marketplace/loading.tsx`
- `app/marketplace/[id]/loading.tsx`
- `app/auth/link/federated/complete/route.ts`
- `app/sign-out/route.ts`

## Non-Goals
- No motion work for the admin dashboard.
- No change to authentication authority, session policy, or wallet trust boundaries.
- No redesign of the landing page copy or information architecture.
- No motion that depends on a heavy client wrapper around the entire app shell.
- No animation that ignores reduced-motion preferences.
- No tradeoff that degrades current Core Web Vitals on the landing page.

## Success Criteria
- The user can feel language switching, route changes, menu expansion, theme changes, login entry and return, loading progression, button activation, and property opening without needing extra copy to explain the change.
- Motion stays consistent across the main public and authenticated surfaces.
- The landing page remains fast and SSR-first.
- Reduced-motion users still get a clear and usable experience.
- Admin remains untouched.

## Open Questions
- Should the property detail open feel like a card-to-page continuation or a modal-to-page transition?
- Should page-level motion be shared across all public routes or only the main routes listed above?
- What animation duration and easing feel right for the brand without hurting perceived speed?

## Traceability
- Linear issue: `BRI-163`
