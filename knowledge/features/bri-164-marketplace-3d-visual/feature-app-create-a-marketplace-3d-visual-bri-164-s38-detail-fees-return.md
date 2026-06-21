---
type: Feature Spec
title: Feature App Create A Marketplace 3d Visual BRI- 164 S38 Detail Fees Return
description: Feature App Create A Marketplace 3d Visual BRI- 164 S38 Detail Fees Return - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s38-detail-fees-return.md
---

# S38 Plan: Detail Fees and Return Extraction

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s38-detail-fees-return`.
- Runtime scope when implemented: fees and projected return card.
- Tests: focused fees/return component coverage.

## Problem
Fees and projected return rendering is mixed into the broad detail component.

## Solution
Extract a `PropertyFeesAndReturnCard` component.

## TDD Contract
1. Add failing tests for fee metrics and projected ROI rendering.
2. Add failing tests for hidden missing metrics.
3. Extract only the fees and return card.

## Out Of Scope
- Deal economics card.
- Execution/governance cards.
- Documents/blockchain cards.

## Acceptance Criteria
- Fees and return rendering is isolated.
- Conditional metric behavior is unchanged.
- No other card moves in this slice.
