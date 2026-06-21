---
type: Feature Spec
title: Feature App Create A Marketplace 3d Visual BRI- 164 S33 Detail Google Maps Card
description: Feature App Create A Marketplace 3d Visual BRI- 164 S33 Detail Google Maps Card - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s33-detail-google-maps-card.md
---

# S33 Plan: Detail Google Maps Card Extraction

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s33-detail-google-maps-card`.
- Runtime scope when implemented: Google Maps section of `PropertyDetailContent`.
- Tests: focused component tests for embed and fallback link.

## Problem
Google Maps iframe/link rendering is coupled to all other detail sections.

## Solution
Extract a `PropertyGoogleMapsCard` component that owns only detail map preview rendering.

## TDD Contract
1. Add failing tests for iframe rendering when the public embed key exists.
2. Add failing tests for fallback copy/link when the key is missing.
3. Extract only the Google Maps card.
4. Assert the detail page remains visually and behaviorally unchanged.

## Out Of Scope
- Mapbox marketplace map behavior.
- Other detail cards.
- Formatting helper extraction unless S32 is already complete.

## Acceptance Criteria
- Google Maps detail behavior remains unchanged.
- The card is testable in isolation.
- No other detail sections are moved in this slice.
