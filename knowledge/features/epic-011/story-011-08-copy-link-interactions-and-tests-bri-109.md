---
type: Feature Spec
title: STORY- 011 08 Copy Link Interactions And Tests BRI- 109
description: STORY- 011 08 Copy Link Interactions And Tests BRI- 109 - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/story-011-08-copy-link-interactions-and-tests-bri-109.md
---

# Feature: STORY-011-08 copy/link interactions and tests (BRI-109)

## Summary
- Added client-side copy-to-clipboard and outbound Solscan interactions for blockchain address cards.
- Kept the blockchain panel SSR-first by isolating interactivity inside a small client component.
- Added a focused DOM test for copy/link behavior and installed `jsdom` so the test runs under the repo's Vitest pattern.

## Scope
- `components/admin/admin-collection-blockchain-address-card.tsx`
- `components/admin/admin-collection-blockchain-base-panel.tsx`
- `tests/components/admin-collection-blockchain-address-card.test.ts`
- `tests/app/admin-collection-detail-page.test.ts`
- `package.json`
- `package-lock.json`

## Validation
- `npx vitest run tests/components/admin-collection-blockchain-address-card.test.ts tests/app/admin-collection-detail-page.test.ts tests/api/admin-collection-detail-route.test.ts tests/lib/admin-collection-blockchain-panel.test.ts`
- `npm run validate`
- `npx playwright test e2e/admin-collections-flow.pw.spec.ts e2e/admin-collections.responsive.pw.spec.ts --project=playwright-smoke`
