---
type: Feature Spec
title: Feature App Create A Marketplace 3d Visual BRI- 164 S34 Detail Hero Section
description: Feature App Create A Marketplace 3d Visual BRI- 164 S34 Detail Hero Section - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s34-detail-hero-section.md
---

# S34 Plan: Detail Hero Section Extraction

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s34-detail-hero-section`.
- Runtime scope when implemented: hero image/title/status/CTA section.
- Tests: focused detail hero component coverage.

## Problem
The detail hero section is embedded inside the large `PropertyDetailContent` component.

## Solution
Extract a `PropertyDetailHero` component that owns only the hero image, status, title, location lead, description, and purchase CTA.

## TDD Contract
1. Add failing tests for hero title/status/CTA rendering.
2. Extract only the hero section.
3. Assert layout props like `imageClassName` and `layoutId` remain respected.

## Out Of Scope
- Investment summary.
- Google Maps card.
- Blockchain/documents cards.

## Acceptance Criteria
- Hero section is isolated.
- Existing detail behavior is unchanged.
- No other detail section moves in this slice.
