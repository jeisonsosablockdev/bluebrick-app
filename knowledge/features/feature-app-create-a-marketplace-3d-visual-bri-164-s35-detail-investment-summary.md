---
type: Feature Spec
title: Feature App Create A Marketplace 3d Visual BRI- 164 S35 Detail Investment Summary
description: Feature App Create A Marketplace 3d Visual BRI- 164 S35 Detail Investment Summary - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s35-detail-investment-summary.md
---

# S35 Plan: Detail Investment Summary Extraction

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s35-detail-investment-summary`.
- Runtime scope when implemented: fractional investment summary card.
- Tests: focused investment summary component coverage.

## Problem
The investment summary card is coupled to unrelated detail sections.

## Solution
Extract a `PropertyInvestmentSummaryCard` component.

## TDD Contract
1. Add failing tests for supply, sold, price, ROI, and availability rendering.
2. Extract only the investment summary card.
3. Assert locale labels remain stable.

## Out Of Scope
- Deal economics.
- Fees.
- Hero section.

## Acceptance Criteria
- Investment summary is isolated and tested.
- No visual or copy regressions.
- No other card moves in this slice.
