---
type: Feature Spec
title: Fix Landing Featured Properties Db Source BRI- 65
description: Fix Landing Featured Properties Db Source BRI- 65 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/fix-landing-featured-properties-db-source-bri-65.md
---

# fix-landing-featured-properties-db-source-bri-65

## Summary
- Landing `Featured Properties` now reads entries from the server marketplace source (`listMarketplaceProperties`) as primary source.
- The home page fetches up to 3 real marketplace items and injects them into `PropertiesSection`.
- `PropertiesSection` keeps hardcoded home content as fallback only when marketplace data is empty/unavailable.

## Scope
- `app/page.tsx`
- `components/sections/properties.tsx`
- `tests/lib/home-featured-properties-source.test.ts`

## Behavior Changes
- Previous behavior:
  - Landing cards displayed static hardcoded examples regardless of DB/marketplace state.
- New behavior:
  - Landing cards reflect current marketplace data source when records exist.
  - If no properties are available, the section falls back to hardcoded home cards to keep UX stable.

## Regression Guard
- Added test contract to ensure:
  - Home page wiring keeps `listMarketplaceProperties` as featured primary data source.
  - `PropertiesSection` can use fallback home content when primary list is empty.
