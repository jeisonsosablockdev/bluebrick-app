# S39 Plan: Detail Execution and Governance Extraction

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s39-detail-execution-governance`.
- Runtime scope when implemented: execution/exit card and governance card.
- Tests: focused execution and governance component coverage.

## Problem
Execution, exit, and governance rendering is embedded in the broad detail component.

## Solution
Extract focused execution and governance cards. This slice may create two small components because they are paired in the same existing grid and share the same project/governance context.

## TDD Contract
1. Add failing tests for project stage, developer, exit strategy, duration, and governance notes.
2. Extract only execution/governance cards.
3. Assert empty optional project fields remain hidden.

## Out Of Scope
- Deal economics.
- Fees.
- Documents/blockchain cards.

## Acceptance Criteria
- Execution and governance cards are isolated.
- Existing optional-field behavior is unchanged.
- No unrelated detail sections move in this slice.
