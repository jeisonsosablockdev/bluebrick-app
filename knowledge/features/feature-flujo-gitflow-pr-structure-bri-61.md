# Feature: Flujo Gitflow PR Structure (BRI-61)

## Summary
Introduces metadata-first PR automation to reduce governance friction and avoid CI failures caused by incomplete labels/template content at PR creation time.

## What changed
- Added `scripts/ci/pr-metadata-lint.sh` for local governance checks of PR body and required labels.
- Added `scripts/ci/pr-open.sh` to automate:
  - metadata lint,
  - `pr:ready` preflight,
  - branch push,
  - draft PR creation,
  - required label application via `gh api`.
- Added usage guide at `knowledge/guides/gitflow-pr-structure.md`.
- Added npm scripts:
  - `pr:metadata`
  - `pr:open`

## Why
Previous PR closures lost time due to policy gate failures caused by missing metadata/labels and label tooling instability.

## Acceptance
- PR metadata can be validated locally before opening PR.
- Draft PR can be created with required labels in a single command.
- Large PRs enforce explicit `size-exempt` + feature-flag strategy rule.
