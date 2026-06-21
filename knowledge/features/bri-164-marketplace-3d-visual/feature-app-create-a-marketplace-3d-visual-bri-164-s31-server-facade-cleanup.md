---
type: Feature Spec
title: Feature App Create A Marketplace 3d Visual BRI- 164 S31 Server Facade Cleanup
description: Feature App Create A Marketplace 3d Visual BRI- 164 S31 Server Facade Cleanup - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s31-server-facade-cleanup.md
---

# S31 Plan: Marketplace Server Facade Cleanup

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s31-server-facade-cleanup`.
- Runtime scope when implemented: `lib/property-marketplace-server.ts`.
- Tests: full marketplace server targeted suite.

## Problem
After S26-S30, the original server module should become a thin compatibility facade rather than retaining orphaned implementation details.

## Solution
Remove remaining implementation logic from `lib/property-marketplace-server.ts` after all focused modules exist. Keep current public exports stable.

## TDD Contract
1. Run the targeted server suite before cleanup.
2. Remove only dead/orphaned implementation from the facade.
3. Run the same targeted suite after cleanup.

## Out Of Scope
- New behavior.
- New module extractions beyond cleanup.
- UI changes.

## Acceptance Criteria
- `lib/property-marketplace-server.ts` is a small facade.
- No public import breaks.
- No behavior changes.
