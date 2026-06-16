---
type: Feature Spec
title: Feature App Create A Marketplace 3d Visual BRI- 164 S22 Admin Safe Create Errors
description: Feature App Create A Marketplace 3d Visual BRI- 164 S22 Admin Safe Create Errors - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s22-admin-safe-create-errors.md
---

# S22 Plan: Admin Safe Create Errors

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s22-admin-safe-create-errors`.
- Runtime scope when implemented: `app/api/admin/marketplace/entries/route.ts`.
- Tests: `tests/api/admin-marketplace-entries-route.test.ts`.

## Problem
The admin marketplace entry create endpoint can return `error.message` for 500 responses. That can leak internal database or infrastructure details to the client.

## Solution
Return a stable public 500 response with code `MARKETPLACE_ENTRY_CREATE_FAILED` and a generic message. Preserve the current explicit conflict response for duplicate entries.

## TDD Contract
1. Add a failing API test where `createMarketplacePropertyEntryPersistent` throws an internal error.
2. Assert the response status is `500`.
3. Assert the response code is stable.
4. Assert the raw internal error text is not present in the response body.
5. Implement only the safe response change.

## Out Of Scope
- Marketplace read fallback behavior.
- Server module refactors.
- New logging infrastructure unless the existing test requires a minimal stub.

## Acceptance Criteria
- Admin 500 responses do not expose raw internal error messages.
- Existing 400 and 409 behavior remains unchanged.
- Targeted API tests pass before full validation.

## Implementation Evidence
- Added failing coverage for an internal `createMarketplacePropertyEntryPersistent` error.
- Confirmed the failing state exposed the internal error message before implementation.
- Updated the route to keep duplicate-entry conflicts specific while returning a generic message for 500 responses.
- Targeted test command: `npm run test -- tests/api/admin-marketplace-entries-route.test.ts`.
- Targeted result: `6` tests passed.
