---
type: Feature Spec
title: Feature App Create A Marketplace 3d Visual BRI- 164 S32 Detail Formatters Extraction
description: Feature App Create A Marketplace 3d Visual BRI- 164 S32 Detail Formatters Extraction - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s32-detail-formatters-extraction.md
---

# S32 Plan: Detail Formatter Extraction

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s32-detail-formatters-extraction`.
- Runtime scope when implemented: `components/marketplace/PropertyDetailContent.tsx` and a formatter helper.
- Tests: formatter tests plus existing detail component tests.

## Problem
Detail-specific currency, percent, month, date, and location formatting lives inside the large detail component.

## Solution
Move reusable detail formatters into a helper while preserving output for supported locales.

## TDD Contract
1. Add failing tests for each formatter output that will move.
2. Extract formatter logic only.
3. Assert detail rendering remains unchanged.

## Out Of Scope
- Extracting UI cards.
- Google Maps component extraction.
- Layout changes.

## Acceptance Criteria
- Formatters are directly tested.
- `PropertyDetailContent` loses formatting responsibility.
- UI output is unchanged.
