---
type: Feature Spec
title: STORY- 011 08 Read Only Blockchain Panel Ui BRI- 108
description: STORY- 011 08 Read Only Blockchain Panel Ui BRI- 108 - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/story-011-08-read-only-blockchain-panel-ui-bri-108.md
---

# Feature: STORY-011-08 read-only blockchain panel UI (BRI-108)

## Summary
- Refined the minimal blockchain section into a dedicated read-only panel inside collection detail.
- Rendered separate blocks for base addresses, authorities, guard fields, and AppData economic fields.
- Added explicit read-only visual treatment so blockchain state stays clearly separated from editable marketplace sections.

## Scope
- `components/admin/admin-collection-blockchain-base-panel.tsx`
- `tests/app/admin-collection-detail-page.test.ts`
- `docs/rfcs/EPIC-011-admin-collections-console/STORY-011-08-blockchain-readonly-panel.md`
- `docs/rfcs/EPIC-011-admin-collections-console/README.md`

## Validation
- `npx vitest run tests/app/admin-collection-detail-page.test.ts tests/api/admin-collection-detail-route.test.ts tests/lib/admin-collection-blockchain-panel.test.ts`
- `npm run validate`
- `npx playwright test e2e/admin-collections-flow.pw.spec.ts e2e/admin-collections.responsive.pw.spec.ts --project=playwright-smoke`
