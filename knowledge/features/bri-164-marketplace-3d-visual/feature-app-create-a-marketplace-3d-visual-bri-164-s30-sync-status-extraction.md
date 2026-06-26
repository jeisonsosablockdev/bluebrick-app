---
type: Feature Spec
title: Feature App Create A Marketplace 3d Visual BRI- 164 S30 Sync Status Extraction
description: Feature App Create A Marketplace 3d Visual BRI- 164 S30 Sync Status Extraction - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s30-sync-status-extraction.md
---

# S30 Plan: Marketplace Sync Status Extraction

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s30-sync-status-extraction`.
- Runtime scope when implemented: Solana realtime sync status and sync metadata persistence.
- Tests: `tests/lib/property-marketplace-server.test.ts` or a new sync-status test.

## Problem
Solana realtime sync status logic is coupled to marketplace persistence and projection logic.

## Solution
Extract sync status resolution and best-effort sync metadata persistence into a focused module.

## TDD Contract
1. Add or preserve tests for available, unavailable, and rpc-error states.
2. Extract sync logic only.
3. Assert `getMarketplacePropertyDetailOrThrowRpc` behavior remains unchanged.

## Out Of Scope
- DB read/write extraction.
- Admin route behavior.
- UI detail rendering.

## Acceptance Criteria
- Sync status logic is isolated.
- RPC error behavior is unchanged.
- No marketplace list/map behavior changes.
