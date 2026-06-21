---
type: Feature Spec
title: STORY- 011 10 Collections Health And Manual Review Queue BRI- 79
description: STORY- 011 10 Collections Health And Manual Review Queue BRI- 79 - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/story-011-10-collections-health-and-manual-review-queue-bri-79.md
---

# STORY-011-10 Collections health and manual review queue

## Summary
- Added the read-only admin health queue at `/admin/health/collections`.
- Unified consistency failures and bootstrap/manual-review degradations into one actor-scoped health read model.
- Moved degraded collection rows out of the main `/admin/collections` happy path and linked the main workspace to the new health queue.

## Scope delivered
- Health state vocabulary locked to:
  - `missing_snapshot`
  - `inconsistent`
  - `bootstrap_failed`
  - `manual_review_required`
- `orphaned_uploads_detected` stays out of v1 because no canonical repository-level source exists yet.
- Added `GET /api/admin/health/collections`.
- Added SSR page-state loading and the admin route `/admin/health/collections`.
- Added deterministic E2E fixture support for the health queue.
- Main collections workspace now exposes only ready/editable rows and routes degraded visibility to the health queue.

## Validation
- `npx vitest run tests/lib/collections-page-state.test.ts tests/lib/admin-collection-health-read-model.test.ts tests/lib/admin-collection-health-queue.test.ts tests/api/admin-collections-health-route.test.ts tests/app/admin-collections-page.test.ts tests/app/admin-collections-health-page.test.ts`
- `npx playwright test e2e/admin-collections-flow.pw.spec.ts e2e/admin-collections-health.pw.spec.ts e2e/admin-collections.responsive.pw.spec.ts --project=playwright-smoke`
- `npm run validate`

## Responsive QA checklist
- 320px: health queue and main collections workspace render without horizontal overflow.
- 375px: primary actions stay at or above 44px.
- 768px: health cards and CTA rows remain readable.
- 1024px: health queue and detail route continue to render without overflow.
