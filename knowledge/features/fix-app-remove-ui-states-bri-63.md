---
type: Feature Spec
title: Fix App Remove Ui States BRI- 63
description: Fix App Remove Ui States BRI- 63 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/fix-app-remove-ui-states-bri-63.md
---

# Fix: Remove UI States section from landing (BRI-63)

## Summary
The `UI States` block (Loading/Empty/Error cards) was removed from the public landing page.

## Scope
- Removed `UiStatesSection` import and render call from `app/page.tsx`.
- Deleted unused component `components/sections/ui-states.tsx` to avoid dead code.

## Motivation
The section was placeholder UI and should not be exposed on the landing experience.

## Validation
- `npm run validate`

## Related
- Linear: BRI-63
