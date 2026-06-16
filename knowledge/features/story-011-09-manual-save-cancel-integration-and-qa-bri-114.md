---
type: Feature Spec
title: STORY- 011 09 Manual Save Cancel Integration And Qa BRI- 114
description: STORY- 011 09 Manual Save Cancel Integration And Qa BRI- 114 - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/story-011-09-manual-save-cancel-integration-and-qa-bri-114.md
---

# STORY-011-09 / BRI-114

## Summary
- connected the location section to manual `Save` / `Cancel`
- kept the section on-page after search, selection, save, and cancel
- extended Playwright flow and responsive QA evidence to cover the location editor

## Why
- `STORY-011-09` needed to close with the same modular manual-save behavior used by the other collection sections
- the final QA pass had to prove the location workflow remained usable at the required responsive breakpoints

## Scope
- `components/admin/admin-collection-location-editor.tsx`
- `e2e/admin-collections-flow.pw.spec.ts`
- `e2e/admin-collections.responsive.pw.spec.ts`
- focused component/page/client tests and story RFC sync

## Validation
- `npx vitest run tests/components/admin-collection-location-editor.test.ts tests/app/admin-collection-detail-page.test.ts tests/lib/admin-collection-location-client.test.ts tests/api/admin-collection-detail-route.test.ts`
- `npm run typecheck`
- `npx playwright test e2e/admin-collections-flow.pw.spec.ts e2e/admin-collections.responsive.pw.spec.ts --project=playwright-smoke`
