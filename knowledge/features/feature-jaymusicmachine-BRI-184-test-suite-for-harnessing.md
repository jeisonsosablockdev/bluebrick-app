# Problem Spec: Test Suite for Agent Harnessing (BRI-184)

## What problem exists
Currently, the agent harness scripts (`scripts/task-init.sh`, `scripts/git-start.sh`, `scripts/ci/check-task-lifecycle.sh`, `scripts/ci/check-layered-architecture.sh`, `graphify-sync.js`, `validate-okf.ts`), `.agents/hooks.json`, and `.agents/agents/*.yaml` run without an isolated, dedicated test suite. Changes to harness scripts, lifecycle hooks, or specialist agent definitions are tested manually or during active workflow execution. This lack of automated test coverage risks silent regressions in preflight checks, state machine transitions, or monorepo governance enforcement.

## Why it matters
The agent harness is the central nervous system governing repository compliance, git branch workflows, architectural layer verification, and Linear issue synchronization. A regression in any harness component can break developer preflight, allow invalid code placement outside defined layers, or corrupt `.agents/active_task_state.json`. Having an automated, fast, and repeatable test suite ensures that the harness remains robust, deterministic, and easily portable to other repositories.

## What outcome is expected
An isolated, modular test suite located strictly under `/tests/harness/` (in compliance with `knowledge/governance/git-monorepo-policy.md`) that provides 100% automated regression verification for:
1. **Agent Definition Schema & Tooling**: Validates that all `.agents/agents/*.yaml` specialist agent files have valid syntax and allowed tool mappings.
2. **Hooks & Graph Mapping**: Validates that `.agents/hooks.json` references existing script paths, subagents, and workflows.
3. **Lifecycle State Machine**: Validates that `.agents/active_task_state.json` phase transitions (`PHASE_1_BOOTSTRAP` to `PHASE_8_HUMAN_MERGE_APPROVED`) are correctly checked and enforced by `check-task-lifecycle.sh`.
4. **Script Execution Sandboxing**: Executes `task-init.sh`, `preflight-start.sh`, `check-layered-architecture.sh`, and `validate-okf.ts` within an isolated, git-ignored local directory (`tests/harness/.sandbox/`), preventing any pollution of system `/tmp` or active git history.

## What gaps exist today
1. Zero automated test coverage for shell scripts under `scripts/` and `scripts/ci/`.
2. No linter or schema validator for agent `.yaml` files or `.agents/hooks.json`.
3. No sandbox fixture runner to test git workflow scripts (`git-start.sh`, `task-init.sh`) against simulated dirty, unmerged, or invalid branch states.

## What questions remain open
- All design decisions resolved: User approved `/tests/harness/` monorepo location with local `.sandbox/` execution environment.

