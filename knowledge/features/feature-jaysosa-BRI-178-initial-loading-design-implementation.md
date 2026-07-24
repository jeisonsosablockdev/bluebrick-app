---
type: Feature Spec
title: Feature Jaysosa BRI- 178 Initial Loading Design Implementation
description: Feature Jaysosa BRI- 178 Initial Loading Design Implementation - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-jaysosa-BRI-178-initial-loading-design-implementation.md
---

# Solution Artifact: Initial Loading Screen Design Implementation

This document outlines the step-by-step engineering plan for implementing the premium initial loading screen under the issue key `BRI-178` and developer handle `jaysosa`.

## How the work will be resolved

The feature will be implemented in sequential **SPEC** stages, ensuring high-quality verification and clean code practices at each step.

### SPEC Plan Table
| SPEC | Target Branch | Responsibility | Scope | Out of Scope |
| --- | --- | --- | --- | --- |
| **SPEC 01** | `SPEC/jaysosa-bri178-spec01-documentation` | Freeze the problem/solution implementation plan and specify the unit tests. | Documentation & Test Plan | Code implementation changes. |
| **SPEC 02** | `SPEC/jaysosa-bri178-spec02-loading-screen-layout` | Restore `<AppSplashScreen />` in `app/layout.tsx`. Remove the "BRIDS" text and center the logo vertically, shifting it slightly to the left. | JSX Structure, Layout Integration & Mobile Layout | Ambient/Logo Animations. |
| **SPEC 03** | `SPEC/jaysosa-bri178-spec03-ambient-glow-animation` | Add the three drifting, breathing radial glow light components to the background. | Motion 12 Ambient Glow Animations | Logo Exit Scale Animations. |
| **SPEC 04** | `SPEC/jaysosa-bri178-spec04-logo-zoom-exit-animation` | Implement the immersive scaling transition (scale to 70x for dark mode) on the logo wrapper during the splash exit phase. | Motion 12 Logo Zoom Transition & Exit Timing | Other page styles or layouts. |
| **SPEC 05** | `SPEC/jaysosa-bri178-spec05-full-centered-logo` | Ensure that initially the entire logo (B-mark + "BRIDS" wordmark) is displayed completely centered on the screen. | Initial Layout Centering | Animations or exits. |
| **SPEC 06** | `SPEC/jaysosa-bri178-spec06-logo-collapse-animation` | Animate the wordmark sliding left into the B-mark and fading out, while the B-mark shifts to its final position with a smooth easing. | Motion 12 Collapse Animations & Easing | Delay transitions after exit. |
| **SPEC 07** | `SPEC/jaysosa-bri178-spec07-delayed-landing-reveal` | Implement a 350ms transition delay when the splash screen unmounts, fading the landing page elements in from an empty background. | CSS/JS Landing Page Delayed Reveal | Core layout or logo assets. |

---

## User Review Required

> [!IMPORTANT]
> The animations must be implemented strictly using **Motion 12** (`motion/react`) API and syntax. We will not use CSS `@keyframes` animations for either the ambient background glows or the logo collapse/zoom-exit animations.
> We are also restoring the `<AppSplashScreen />` component inside `app/layout.tsx` (wrapped by `AppProviders`), as it was previously deactivated.

## Open Questions

None. The collapse animations, target positioning, timing delays, and landing page delayed reveal are fully defined.

## Proposed Changes

### Component: brand/app-splash-screen

#### [MODIFY] [app-splash-screen.tsx](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/components/brand/app-splash-screen.tsx)
- **SPEC 05 & SPEC 06**: Set up the inline SVG containing the B-Mark and the Wordmark.
- Ensure the SVG is centered in the screen initially (`phase === "visible"`).
- Implement `wordmarkVariants` where the wordmark slides left (`x: -30`) and fades (`opacity: 0`) in `phase === "collapsed"`.
- Implement `bMarkVariants` where the B-mark shifts right (`x: 32`) in `phase === "collapsed"` to reach its final layout position, using a premium easing `cubic-bezier(0.16, 1, 0.3, 1)`.

### Component: styles

#### [MODIFY] [globals.css](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/app/globals.css)
- **SPEC 07**: Add CSS styles to delay the transition of the `main` layout by 350ms when `body.app-splash-cleared` is active:
  ```css
  main {
    opacity: 0;
    transition: opacity 450ms cubic-bezier(0.16, 1, 0.3, 1) 350ms;
  }
  body.app-splash-cleared main {
    opacity: 1;
  }
  ```
- Ensure this transition does not break existing layouts or interact negatively with other pages.

### Component: tests

#### [MODIFY] [app-splash.test.ts](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/tests/lib/app-splash.test.ts)
- Update or adapt unit tests to align with timing constants if they change.
- Verify that the tests do not fail on `container.textContent` constraints when SVG elements are present.

---

## Focus on Clean Code
* **Reusability:** Avoid duplicating properties by utilizing CSS variables and gradients defined in `globals.css`.
* **Accessibility:** Honor the `@media (prefers-reduced-motion: reduce)` query to disable or slow down animations for users who prefer reduced motion.
* **TDD (Test-First):** Adapt unit tests in `tests/lib/app-splash.test.ts` first.

## Verification Plan

### Automated Tests
- Run unit tests:
  ```bash
  npx vitest run tests/lib/app-splash.test.ts
  ```
- Run local validation task:
  ```bash
  npm run validate
  ```

### Responsive QA Verification (`@responsive-qa`)
- Synchronize verification with the responsive cycle:
  - Emulate and verify UI layout rendering at **320px**, **375px**, **768px**, and **1024px** widths using Chrome DevTools MCP.
  - Verify zero horizontal overflow at all widths.
  - Document findings and attach responsive screenshots in `walkthrough.md`.
