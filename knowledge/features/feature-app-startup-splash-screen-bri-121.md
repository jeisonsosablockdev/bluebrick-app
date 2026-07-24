---
type: Feature Spec
title: Feature App Startup Splash Screen BRI- 121
description: Feature App Startup Splash Screen BRI- 121 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-app-startup-splash-screen-bri-121.md
---

# BRI-121 App Startup Splash Screen

## Summary
- Added a global client-side startup splash screen for BRIDS.
- The sequence introduces the app name first, then brings in the `b` mark as the final protagonist element.
- The splash remains visible for at least one second and waits for the browser load event before fading out.

## Behavior
- The app renders normally behind the overlay; the splash does not become an auth/session gate.
- The name fades in first and then dims when the mark enters.
- The mark uses fade-in plus scale-in from `0.95` to `1`.
- Exit uses a smooth opacity transition into the main app.

## Design Notes
- Reuses the existing `/public/brand/brids-mark.svg`, which matches the provided `B.svg` mark.
- Uses a dark neutral premium background with subtle radial light and wide centered spacing.
- Supports `prefers-reduced-motion` by shortening animation/transition durations.

## Validation
- Added a timing contract test for minimum duration and app-load wait behavior.
- Scope is presentation-only and does not alter SIWS, cookies, wallet sessions, RBAC, RPC, or backend routes.
