---
type: Fix Spec
title: Fix BRI- 6 Admin Distributions Production Visibility Implementation
description: Fix BRI- 6 Admin Distributions Production Visibility Implementation - migrated from knowledge/
tags: [fixes]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/fixes/fix-bri-6-admin-distributions-production-visibility-implementation.md
---

# implementation(fix): BRI-6 admin distributions production visibility

## Summary

This fix makes the BRI-6 admin distribution console reachable in deployed environments without requiring the dev-only module flag.

## Changes

- `lib/release-module-visibility.ts`
  - Removed `/admin/distributions` from `ADMIN_RELEASE_CONTROLLED_ROUTES`.
- `components/admin/admin-shell-navigation.tsx`
  - Removed `releaseControlled` from the Distribution navigation item.
- Tests
  - Updated release-control route expectations.
  - Updated admin navigation expectations for production-like builds.
  - Aligned protected overview and portfolio route tests with their current zero-argument `GET` handlers so global typecheck remains clean.

## Security

This does not weaken data access. The page can render in production, but the backing API routes still require an authenticated admin wallet session through `getRequestRole`.

## Verification

- `npm test -- tests/lib/release-module-visibility.test.ts tests/components/admin-shell-navigation.test.ts tests/app/release-controlled-routes.test.ts tests/api/admin-distribution-runs-route.test.ts tests/api/admin-distribution-run-finalize-route.test.ts tests/components/admin-distributions-console.test.ts tests/api/protected-overview-route.test.ts tests/api/protected-portfolio-route.test.ts` - passed.
- `npm run typecheck` - passed.
- `npm run validate` - passed.
