---
type: Feature Spec
title: Feature Shared Knowledge Promotion System BRI- 143
description: Feature Shared Knowledge Promotion System BRI- 143 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-shared-knowledge-promotion-system-bri-143.md
---

# Feature Note: shared-knowledge-promotion-system (BRI-143)

Introduce a concrete shared system so development knowledge can accumulate with promotion gates instead of remaining scattered across feature notes, RFCs, and ad-hoc memory.

## Added
- `knowledge/*` structure for:
  - inbox observations
  - promotion proposals
  - reports
  - archive
  - templates
- `scripts/knowledge/*` commands for:
  - building the repo knowledge index
  - scanning recent branch changes for reusable workflow signals
  - generating governance drift reports
- `knowledge/guides/knowledge-promotion-gitflow.md` to explain the operational loop.

## Gitflow Integration
- Added package commands:
  - `knowledge:scan`
  - `knowledge:index`
  - `knowledge:drift`
  - `validate:knowledge`
- Extended the shared validation chain so the knowledge index must stay in sync.
- Kept the knowledge system below canonical governance:
  - `AGENTS.md` remains a summary,
  - `knowledge/governance/*` remains canonical,
  - promotion to governance or automation requires human review.

## Seeded Observation
- Added `KNOW-2026-05-001` to capture the reusable lesson that governance summaries must defer to canonical policy and executable enforcement.
