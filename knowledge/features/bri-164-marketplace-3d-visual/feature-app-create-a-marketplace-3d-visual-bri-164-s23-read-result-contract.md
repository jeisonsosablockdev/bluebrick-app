---
type: Feature Spec
title: Feature App Create A Marketplace 3d Visual BRI- 164 S23 Read Result Contract
description: Feature App Create A Marketplace 3d Visual BRI- 164 S23 Read Result Contract - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s23-read-result-contract.md
---

# S23 Plan: Marketplace Read Result Contract

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s23-read-result-contract`.
- Runtime scope when implemented: `lib/property-marketplace-server.ts`.
- Tests: `tests/lib/property-marketplace-server.test.ts`.

## Problem
Marketplace persisted-read failures can currently collapse into a normal empty array path. The server layer needs a typed way to distinguish successful reads from degraded reads before the page can display or log that state.

## Solution
Introduce a minimal internal read result contract that can represent:
- successful persisted read
- successful snapshot fallback
- degraded persisted read with fallback
- empty configured source

The public list/detail functions should keep their current return shape unless this slice explicitly introduces a backward-compatible metadata helper.

## TDD Contract
1. Add a failing server test that simulates persisted read failure.
2. Assert the new internal/helper contract returns degraded metadata.
3. Assert existing `listMarketplaceProperties` behavior remains backward-compatible.
4. Implement only the read result contract.

## Out Of Scope
- Rendering degraded UI on `/marketplace`.
- Structured logging.
- Refactoring repository modules.

## Acceptance Criteria
- Degraded read state is representable in tests.
- Existing callers are not broken.
- No UI behavior changes.

## Implementation Evidence
- Added failing coverage for a persisted marketplace read failure.
- Introduced `readMarketplaceRecordsResultForServer` as a backward-compatible result helper.
- Existing list callers continue to receive the same records-only shape through the current public list API.
- Targeted test command: `npm run test -- tests/lib/property-marketplace-server.test.ts`.
- Targeted result: `4` tests passed.
