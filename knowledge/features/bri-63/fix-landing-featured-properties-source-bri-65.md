---
type: Feature Spec
title: Fix Landing Featured Properties Source BRI- 65
description: Fix Landing Featured Properties Source BRI- 65 - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/fix-landing-featured-properties-source-bri-65.md
---

# Fix: landing Featured Properties now uses landing content source (BRI-65)

## Summary
`Featured Properties` in the landing no longer reads marketplace/fallback records. It now renders from localized landing content files (`app/data/home*.json`).

## Scope
- Updated `components/sections/properties.tsx`:
  - removed dependency on `listProperties()` from marketplace service.
  - removed listing status badge rendering from marketplace status helpers.
  - wired cards to `getHomeContent(locale).properties`.
  - keeps first 3 records as featured cards.

## Why
The landing section must reflect editorial landing data, not marketplace fallback entries.

## Validation
- `npm run validate`

## Related
- Linear: BRI-65
