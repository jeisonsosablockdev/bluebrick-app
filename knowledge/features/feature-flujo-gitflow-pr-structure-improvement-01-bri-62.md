# Feature Note: flujo-gitflow-pr-structure-improvement-01 (BRI-62)

## Summary
Unifica la gobernanza de PR en una fuente única de verdad para eliminar divergencias entre `AGENTS.md`, scripts locales y CI.

## What Changed
- Added SSOT policy file:
  - `knowledge/governance/pr-policy-source-of-truth.json`
- Refactored local tooling to consume SSOT:
  - `scripts/ci/pr-metadata-lint.sh`
  - `scripts/ci/pr-ready.sh`
  - `scripts/ci/pr-open.sh`
- Refactored CI governance workflow to consume SSOT:
  - `.github/workflows/pr-governance-develop.yml`
- Updated governance/docs references:
  - `AGENTS.md`
  - `knowledge/guides/gitflow-pr-structure.md`

## Why
- Reduce CI rework caused by policy duplication.
- Prevent local-vs-CI validation drift.
- Lower context/token overhead by centralizing policy definitions.

## Expected Impact
- Faster PR open/merge cycle.
- Fewer failures in PR governance checks.
- Deterministic behavior across local and CI validations.
