---
type: Fix Spec
title: Fix BRI- 178 Splash Performance
description: Fix BRI- 178 Splash Performance - migrated from knowledge/
tags: [fixes]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/fixes/fix-bri-178-splash-performance.md
---

# FIX: Splash Screen Performance Optimization (BRI-178)

## 1. Issue Overview
The initial loading screen (`AppSplashScreen`) experiences severe lag on modest hardware such as Samsung A15 and iPhone 13 Pro. The goal is to make the animation fluid without changing the visual design.

## 2. Root Cause Analysis
The current implementation utilizes `framer-motion` (motion/react). The animations run natively, but lack explicit hardware acceleration hints (`will-change: transform, opacity`), causing layout thrashing and forcing the CPU to handle complex SVG and div transforms instead of offloading them to the GPU. In addition, variant objects were instantiated on every render, causing memory churn.

## 3. Scope of Fix
- Enforce GPU hardware acceleration on animating DOM elements (`.app-splash__glow` and SVGs).
- Memoize `framer-motion` variants to avoid recreation.
- Target component: `components/brand/app-splash-screen.tsx`.
- **Visual Animation Refactor**: Mathematically align the B-Mark collapse target to the exact center of the SVG viewbox (`58.185px`). Adjust the letters' collapse timings and Wordmark offset so that 'R' and 'I' fade instantly, 'D' barely moves, and 'S' slides completely to the center to merge/fuse with the 'B' at the center.

## 4. Dependencies
- No new dependencies. Only internal React and `motion/react` updates.

## 5. Security & Risk
- Risk: Low.
- Impact is constrained to the visual UI of the splash screen. No network or data access is modified.
