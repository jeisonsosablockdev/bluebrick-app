---
type: Feature Spec
title: Feature App Create A Marketplace 3d Visual BRI- 164 S40 Detail Documents Blockchain
description: Feature App Create A Marketplace 3d Visual BRI- 164 S40 Detail Documents Blockchain - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s40-detail-documents-blockchain.md
---

# S40 Plan: Detail Documents and Blockchain Extraction

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s40-detail-documents-blockchain`.
- Runtime scope when implemented: documents card and blockchain info card.
- Tests: focused documents/blockchain component coverage.

## Problem
Documents and blockchain information rendering is embedded in the broad detail component.

## Solution
Extract focused documents and blockchain cards. This slice may create two small components because they are paired in the same existing grid and represent the final detail-page metadata section.

## TDD Contract
1. Add failing tests for document links.
2. Add failing tests for blockchain network, collection, mint, explorer link, last update, and unavailable state.
3. Extract only documents/blockchain cards.

## Out Of Scope
- Earlier detail cards.
- Solana sync status server logic.
- Marketplace map behavior.

## Acceptance Criteria
- Documents and blockchain cards are isolated.
- Link/security attributes remain unchanged.
- No unrelated detail sections move in this slice.
