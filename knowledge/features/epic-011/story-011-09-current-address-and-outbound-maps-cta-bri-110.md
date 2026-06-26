---
type: Feature Spec
title: STORY- 011 09 Current Address And Outbound Maps Cta BRI- 110
description: STORY- 011 09 Current Address And Outbound Maps Cta BRI- 110 - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/story-011-09-current-address-and-outbound-maps-cta-bri-110.md
---

# STORY-011-09 / BRI-110

## Summary
- added a dedicated read-only location section to the admin collection detail view
- exposed current location context from `marketplace_entries`
- rendered a visible Google Maps preview plus outbound `Open in Google Maps` CTA

## Why
- `STORY-011-09` needed immediate location value before autocomplete and section-level persistence landed
- the admin now sees address context and can jump directly to Google Maps without waiting for later slices

## Scope
- `lib/admin/collection-content-repository.ts`
- `lib/admin/admin-collection-location-view.ts`
- `components/admin/admin-collection-location-shell.tsx`
- `components/admin/admin-collection-detail-sections.tsx`
- related fixtures/tests for admin collection detail

## Notes
- the preview uses a lightweight Google Maps embed URL derived from either the persisted reduced place payload or existing location text fields
- this slice stays read-only on purpose; autocomplete and manual save/cancel remain for later `STORY-011-09` slices

## Validation
- `npx vitest run tests/lib/admin-collection-location-view.test.ts tests/lib/collection-content-repository.test.ts tests/app/admin-collection-detail-page.test.ts tests/api/admin-collection-detail-route.test.ts tests/components/admin-collection-gallery-shell.test.ts tests/lib/admin-collection-text-section-client.test.ts tests/lib/admin-collection-documents-client.test.ts`
- `npm run typecheck`
- `npx playwright test e2e/admin-collections-flow.pw.spec.ts --project=playwright-smoke`
