---
type: Feature
title: Brand Visual Identity Redesign
description: Integration of official BlueBrick brand visual elements, vector mark geometry, color tokens, and web discovery graphics across the application.
tags: [brand, ui, design-system, assets, presentation]
timestamp: 2026-09-04T07:00:00Z
resource: local
---

# Problem Spec: Brand Visual Identity Redesign (BBC-019)

## What problem exists

Currently, BlueBrick's visual identity across the Next.js web application relies on temporary CSS gradient approximations and synthetic shapes. Specifically:
1. `apps/web/src/components/dashboard/blue-brick-mark.tsx` simulates the brandmark with CSS `linear-gradient` bars in silver/slate and red with hardcoded approximations.
2. Web discovery cards (`apps/web/src/app/icon.tsx`, `apps/web/src/app/apple-icon.tsx`, `apps/web/src/app/opengraph-image.tsx`, and `apps/web/src/app/twitter-image.tsx`) use inconsistent gradient fills and old typography.
3. The official raster and vector graphics of the brand (full horizontal logo, primary dark navy mark, and negative white mark) were not integrated into the shared public asset root or documented as a canonical Single Source of Truth (SSOT).

## Why it matters

BlueBrick is an institutional real estate tokenization platform targeting private equity, family offices, and accredited investors. A unified, luxury visual identity is essential to establish institutional trust, brand recognition, and aesthetic cohesion. Mismatched or provisional logos degrade platform authority on landing pages, investor portfolios, mobile home screen shortcuts, and social media previews.

## What outcome is expected

1. **Shared Common Assets**: Official raster and transparent PNG files stored in `apps/web/public/brand/` and archived in `knowledge/assets/brand/`.
2. **Precision Vector Brandmark (`BlueBrickMark`)**: The presentation component renders the exact 4-bar capsule geometry with precise proportions, -24° angle of inclination, and theme-adaptive coloring:
   - Light Mode: 3 Deep Navy bars (`#04283C`) + 1 Crimson Red accent bar (`#FC040C`).
   - Dark Mode: 3 Pure White bars (`#FFFFFF`) + 1 Crimson Red accent bar (`#FC040C`).
3. **Hero & Dashboard Alignment**: `LandingHero` and the sticky navigation in `investment-dashboard.tsx` cleanly reflect the new official visual mark and wordmark.
4. **Web Discovery & Favicons**: Next.js App Router dynamic favicon (`icon.tsx`, `apple-icon.tsx`) and social cards (`opengraph-image.tsx`, `twitter-image.tsx`) generate brand imagery matching official color codes.
5. **Tailwind Tokens Alignment**: `tailwind.config.ts` aligns color variables with the official palette.
6. **Zero Regressions & Full Governance**: 100% test coverage with automated unit tests and clean `pnpm validate` execution.

## What gaps exist today

- `apps/web/public/brand/` was missing from the repository.
- `BlueBrickMark` lacked SVG vector precision and theme-awareness (always rendered silver gradients regardless of dark or light mode).
- Existing unit tests (`landing-mock-login.test.tsx`) only check for basic container rendering without verifying brand color invariants or theme adaptation.

## What questions remain open

None. The official image assets have been provided and their color palette sampled directly (`#FC040C` Crimson Red, `#04283C` Deep Navy, `#FFFFFF` White).
