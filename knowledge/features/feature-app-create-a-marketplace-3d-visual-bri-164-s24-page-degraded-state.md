---
type: Feature Spec
title: Feature App Create A Marketplace 3d Visual BRI- 164 S24 Page Degraded State
description: Feature App Create A Marketplace 3d Visual BRI- 164 S24 Page Degraded State - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s24-page-degraded-state.md
---

# S24 Plan: Marketplace Page Degraded State

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s24-page-degraded-state`.
- Runtime scope when implemented: `app/marketplace/page.tsx`.
- Tests: `tests/app/marketplace-page.test.ts`.

## Problem
The marketplace page cannot currently tell the difference between true empty inventory and a degraded marketplace data source.

## Solution
Consume the S23 read result metadata and render a small user-safe degraded-state signal only when the data source failed and fallback data is being used.

## TDD Contract
1. Add a failing page test for degraded marketplace data.
2. Assert the list remains usable.
3. Assert the degraded message is user-safe and does not expose technical details.
4. Assert normal empty inventory still renders as empty inventory, not degraded.
5. Implement only the page rendering/state handoff.

## Out Of Scope
- Admin API hardening.
- Structured logging.
- Mapbox performance changes.

## Acceptance Criteria
- Degraded data and empty inventory are distinguishable.
- The traditional list remains the stable fallback.
- No Mapbox behavior changes.

## Implementation Evidence
- Added failing page coverage for degraded marketplace data.
- Rendered a user-safe fallback-source notice without exposing internal error codes.
- Kept marketplace content rendering when fallback data is available.
- Targeted test command: `npm run test -- tests/app/marketplace-page.test.ts`.
- Targeted result: `6` tests passed.
