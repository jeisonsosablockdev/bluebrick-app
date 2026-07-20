---
type: Policy
title: Iconography Rules
description: Iconography Rules - migrated from knowledge/
tags: [governance]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/governance/iconography-rules.md
---

# Iconography Rules & Governance

This document establishes the canonical design rules for iconography used across BRIDS public and private surfaces. Following the shift away from emojis and generic flat icons (SPEC 02), we enforce a custom minimalist SVG approach that aligns with our Glassmorphism and Dark Mode identity.

## 1. Core Principles
* **Minimalism first**: Icons must be constructed with clean, unbroken strokes. Avoid unnecessary complexity, fills, or intricate details.
* **No containment**: Icons float freely. Do not wrap them in solid circles, gradient squares, or opaque bounding boxes unless functionally necessary for a specific UI component (like an active toggle).
* **Semantic accuracy**: Use metaphors that represent our brand. Tokenization is represented by floating prisms/blocks, not puzzle pieces. Growth is represented by sharp, minimalist scaling charts. Flexibility/Speed by lightning bolts.

## 2. Visual Weights & Stroke
* **Standard Stroke**: All primary icons must use `stroke-width="1.5"`.
* **Caps and Joins**: Always use `stroke-linecap="round"` and `stroke-linejoin="round"` to maintain a soft, friendly tech aesthetic.
* **Fill**: The base shape should almost always be `fill="none"`.

## 3. Contrast, Glow & Colors
We use the BRIDS cyan-purple neon aesthetic to make icons pop against dark `landing-depth-card` or glassmorphic backgrounds.

* **Base Color**: `text-cyan-400` (equivalent to `rgba(34, 211, 238, 1)`).
* **Glow Effect (Drop Shadow)**: Icons must emit a subtle glow to feel "alive". Apply the following class: `drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]`.
* **Dark/Light Mode**: 
  * In Dark Mode (default), the cyan glow provides high contrast against slate/blue-gray dark backgrounds.
  * In Light Mode, fall back to `text-cyan-700` with a reduced or removed drop shadow to maintain accessibility and contrast ratios.

## 4. Code Implementation Example
Always implement icons as inline SVGs or dedicated React components to maintain control over the `currentColor` and tailwind classes.

```tsx
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="currentColor" 
  strokeWidth="1.5" 
  strokeLinecap="round" 
  strokeLinejoin="round" 
  className="h-8 w-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"
>
  <path d="..." />
</svg>
```

## 5. Excluded Patterns
* 🚫 **No emojis** (`🧩`, `📈`, `⚡`) acting as primary UI indicators.
* 🚫 **No solid colored background wrappers** (`bg-gradientPrimary` behind the icon), let the icon glow in the negative space.
* 🚫 **No heavy strokes** (`strokeWidth="2"` or `"3"`) that look bulky.
