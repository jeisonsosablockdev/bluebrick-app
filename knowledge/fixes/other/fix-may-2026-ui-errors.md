---
type: Fix Spec
title: Fix May 2026 Ui Errors
description: Fix May 2026 Ui Errors - migrated from knowledge/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-may-2026-ui-errors.md
---

# Fix: May 2026 UI Errors (BRI-166)

## Problem

BRI-166 groups several public app UI regressions reported on mobile and shared public surfaces. The main blocking issue is the deployed marketplace on Safari iPhone: marketplace entry cover imagery appears on desktop, Android, and Chrome on iOS, but did not appear on Safari iPhone until Safari history/site data for BRIDS was cleared.

- Marketplace entry cards show the cover image on desktop, Android, and Chrome on iOS, but Safari iPhone can keep a stale deployed state where the cover image is missing until browser history/site data is cleared.
- Marketplace does not render the expected footer.
- Profile does not render the expected footer.
- After login on mobile, the connected-wallet prompt and marketplace content overlap, creating an unreadable first screen.
- PageSpeed Insights mobile for `https://brids.io` reports performance `83`, so the mobile closeout also needs a Core Web Vitals optimization slice instead of only visual QA.

The current evidence points away from a generic responsive image bug and toward cache/page-update freshness: clearing Safari history removed the marketplace image failure.

The reported mobile screenshot also shows the marketplace hero, filter panel, connected-wallet prompt, and onboarding reward content stacking over one another instead of respecting a readable vertical layout.

## Why It Matters

- Safari iPhone users can remain stuck on stale marketplace assets or page state where deployed cover imagery disappears.
- Missing footers create inconsistent navigation and trust cues across public routes.
- The connected-wallet state blocks the marketplace experience because the modal and page content collide.
- Weak mobile Core Web Vitals can hurt perceived quality, conversion, and search quality signals even when the UI is visually correct.
- These regressions affect conversion-critical routes and must be verified against Safari iPhone cache/update behavior in the deployed or deployment-equivalent environment before completion.

## Expected Outcome

The affected routes should render cleanly on mobile and remain stable on desktop:

- Marketplace entry cards show cover imagery on Safari iPhone after normal page revisit/refresh/update flows, matching desktop, Android, and Chrome on iOS behavior without requiring users to clear history.
- Marketplace and profile include the expected footer.
- The mobile connected-wallet/login prompt no longer overlaps page headings, filters, cards, or reward content.
- Mobile Core Web Vitals are baselined from the provided PageSpeed report and improved or consciously documented with remaining tradeoffs.
- No horizontal overflow appears at the responsive QA widths.
- Desktop marketplace and profile layouts remain visually consistent after the mobile fixes.

## Current Gaps

- The exact cache/update boundary for the deployed Safari iPhone marketplace cover image regression still needs code inspection in the implementation slice.
- The implementation slice must compare Safari iPhone behavior before and after normal refresh/revisit flows with desktop, Android, and Chrome on iOS so the fix targets the actual production/Safari stale-state failure mode rather than a generic mobile state.
- Initial repository inspection found a PWA service worker at `public/sw.js`, but it does not currently intercept `fetch`; S02 should still confirm service worker registration/update behavior, Next.js cache headers, ISR, image optimization, CDN freshness, and Safari page cache behavior.
- Mobile Core Web Vitals diagnostics still need to identify the specific Lighthouse opportunities behind the reported `83` score, especially LCP, INP/TBT, and CLS contributors.
- Footer ownership needs confirmation from existing app layout patterns before implementation.
- The login overlap likely involves modal sizing, stacking, page scroll locking, or responsive spacing, but the exact source must be proven in the code before changing behavior.
- Browser evidence must cover the logged-in/connected-wallet mobile state shown in the Linear screenshot.

## Non-Goals

- No redesign of marketplace, profile, wallet auth, or onboarding reward flows.
- No auth/session, wallet signing, SIWS, or account-linking behavior changes.
- No copy, localization, or content model changes beyond what is necessary to prevent overlap.
- No marketplace data model changes unless S02 proves stale API payload caching is the source.
- No blockchain, NFT, mint, metadata, or royalty changes.

## Scope

Primary scope:

- `/app` browser-facing marketplace, profile, and login/connected-wallet surfaces.
- Shared components used by those surfaces only when required by the regression.
- Deployed marketplace cache/update behavior on Safari iPhone or a Safari-equivalent iPhone target.
- Responsive QA artifacts for mobile and desktop breakpoints.
- Mobile Core Web Vitals baseline and follow-up evidence for `https://brids.io`.

Workflow scope:

- `.codex/workflows/frontend-cycle.md`
- `.codex/workflows/responsive-qa.md`

Required policies:

- `.codex/policies/frontend-policy.md`
- `.codex/policies/testing-policy.md`
- `.codex/policies/docs-policy.md`
- `.codex/policies/security-policy.md` for trust-boundary confirmation, even though this fix should not alter auth/session behavior.

## Linear

- Issue: `BRI-166`
- Title: `Fix May 2026 UI errors`
- URL: `https://linear.app/brids-app/issue/BRI-166/fix-may-2026-ui-errors`

## External Evidence

- PageSpeed Insights mobile report: `https://pagespeed.web.dev/analysis/https-brids-io/nvj0gnc6r8?form_factor=mobile`
- Reported performance score: `83`, used as a signal rather than the primary success metric
- Report date shown by PageSpeed: `May 30, 2026, 11:13:58 AM`
- Field data note: PageSpeed reports no sufficient Chrome UX Report field data for this page, so Core Web Vitals decisions should use lab diagnostics plus direct browser evidence until field data is available.

## Acceptance Criteria

- Deployed or deployment-equivalent Safari iPhone marketplace entry/card cover imagery remains visible after normal refresh/revisit/update flows where desktop, Android, and Chrome on iOS currently show it.
- Marketplace renders the expected footer.
- Profile renders the expected footer.
- Mobile connected-wallet/login state is readable and does not overlap marketplace content.
- Mobile Core Web Vitals have a documented baseline, targeted improvements, and final evidence. Target good-threshold outcomes where practical: LCP <= `2.5s`, INP <= `200ms` when field data is available or TBT as the lab proxy, and CLS <= `0.1`; document any blocker that remains.
- Responsive QA covers `320`, `375`, `768`, and `1024` widths for the affected surfaces.
- Browser evidence includes the connected-wallet modal/state from the Linear screenshot.
- `npm run validate` passes before completion.
- The final reviewer clean-code pass has no unresolved blocking findings.
