# Solution Spec: Test Suite for Agent Harnessing (BRI-184) Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `qa` & `docs`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture

The harness test suite is an isolated, modular test package located strictly in `/tests/harness/` per `knowledge/governance/git-monorepo-policy.md`. It executes harness verification without modifying existing harness scripts or polluting system directories.

```text
+-----------------------------------------------------------------------------------------+
| Application / Runner Layer                                                             |
| pnpm test:harness (Vitest runner configured in /tests/harness/)                          |
+-----------------------------------------------------------------------------------------+
| Domain / Pipeline Validation Layer                                                      |
| - specs/01-agents-schema.test.ts (YAML agent schema & tools check)                     |
| - specs/02-hooks-mapping.test.ts (hooks.json event & script check)                     |
| - specs/03-lifecycle-state.test.ts (8-phase active_task_state machine & Human Gates)   |
| - specs/04-architecture-linter.test.ts (check-layered-architecture & monorepo rules)   |
| - specs/05-git-workflow.test.ts (task-init & branch preflight checks)                   |
| - specs/06-pr-governance.test.ts (Human Acceptance gate, labels, PR body metadata)     |
| - specs/07-doc-governance.test.ts (check-required-docs, validate-okf & placeholders)   |
| - specs/08-linear-sync.test.ts (linear-status-core & linear-plan-core integration)    |
+-----------------------------------------------------------------------------------------+
| Infrastructure / Execution Sandboxing Layer                                            |
| - runner/sandbox-builder.ts (builds local git repos in .sandbox/)                       |
| - runner/script-executor.ts (isolated subprocess exec & exit codes)                     |
| - .sandbox/ (git-ignored local fixture workspace under /tests/harness/)                  |
+-----------------------------------------------------------------------------------------+
```

## 3. Atomic Slices & Logical Sequence

- **SPEC-1 (TDD)**: Initialize `/tests/harness/` package structure, Vitest configuration, `sandbox-builder.ts`, `script-executor.ts`, and initial failing RED tests for YAML agent schema linter, lifecycle script execution, and PR governance checks. (Branch: `SPEC/jaymusicmachine-BRI-184-s01-tdd`)
- **SPEC-2 (Implementation)**: Implement full test coverage across all 8 harness test specs (`01-agents-schema` through `08-linear-sync`). (Branch: `SPEC/jaymusicmachine-BRI-184-s02-harness-tests`)
- **SPEC-3 (Clean Code & Refactor)**: Execute clean code audit, add `pnpm test:harness` script to main `package.json`, update monorepo documentation, and verify zero warnings/errors. (Branch: `SPEC/jaymusicmachine-BRI-184-s03-refactor-clean`)

## 4. TDD (Test-Driven Development) Strategy

### Unit & Integration Tests (Fase RED)
- **Test Directory**: `tests/harness/specs/`
- **Command**: `pnpm test:harness` (or `npx vitest run --config tests/harness/vitest.config.ts`)
- **Assertion Goals**:
  1. `01-agents-schema.test.ts`: Asserts that all `.agents/agents/*.yaml` files parse cleanly and only reference valid tools.
  2. `02-hooks-mapping.test.ts`: Asserts that every handler script path in `.agents/hooks.json` exists on disk.
  3. `03-lifecycle-state.test.ts`: Asserts that `check-task-lifecycle.sh` enforces state transitions in `.agents/active_task_state.json`, blocking unapproved transitions for Gate 1, Human Design (Phase 4), and Human Merge (Phase 8).
  4. `04-architecture-linter.test.ts`: Asserts that `check-layered-architecture.sh` correctly passes on valid 4-layer structures and fails on invalid root files.
  5. `05-git-workflow.test.ts`: Asserts that `task-init.sh` correctly creates `feature/*` and `SPEC/*` branches in simulated git fixture repos in `.sandbox/`.
  6. `06-pr-governance.test.ts`: Asserts that `pr-metadata-lint.sh`, `pr-governance-lib.sh`, and `generate-pr-body.sh` enforce mandatory PR body sections (specifically `## Human Acceptance\nStatus: approved`), label requirements (`scope:*`, `type:*`, `risk:*`), and Linear issue links.
  7. `07-doc-governance.test.ts`: Asserts that `check-required-docs.sh` and `validate-okf.ts` correctly flag missing docs or unpopulated placeholders (`(describir...)`).
  8. `08-linear-sync.test.ts`: Asserts `linear-status-core.js` and `linear-plan-core.js` payload generation and state synchronization.

## 5. Local Definition of Done (DoD)
- [ ] Active task tracker state reaches `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] `tests/harness/` test suite passes 100% cleanly (`pnpm test:harness`).
- [ ] `pnpm validate` executes with 0 errors and 0 warnings.
- [ ] Zero changes made to existing scripts in `scripts/` or `.agents/`.
- [ ] All fixture files remain strictly inside `tests/harness/.sandbox/` and are ignored by `.gitignore`.
- [ ] Explicit Human Acceptance recorded.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BRI-184-test-suite-for-harnessing.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/features/feature-jaymusicmachine-BRI-184-test-suite-for-harnessing.md)
- **Solution Spec**: [feature-jaymusicmachine-BRI-184-test-suite-for-harnessing-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/features/feature-jaymusicmachine-BRI-184-test-suite-for-harnessing-implementation.md)
- **Linear Issue**: [Linear Ticket #BRI-184](https://linear.app/brids-app/issue/BRI-184/test-suite-for-harnessing)


