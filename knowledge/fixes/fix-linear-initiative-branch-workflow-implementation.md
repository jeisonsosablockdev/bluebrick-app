# Fix Implementation: Linear Initiative Branch Workflow

Last Updated: 2026-05-30 UTC
Status: implemented
Owner: shared workflow
Artifact Type: solution

## Decision

Replace the canonical `integration branch` concept with `Linear initiative branch`.

The branch name must come from the parent Linear issue and use:

```text
initiative/<issue>-<slug>
```

Slice branches keep the branch family and scope because they describe the delivery unit:

```text
<type>/<scope>-<slug>-<issue>-sNN-<slice-slug>
```

## Scope

- `docs/governance/git-monorepo-policy.md`
- `docs/guides/linear-single-issue-slice-planning.md`
- `docs/guides/gitflow-pr-structure.md`
- `docs/templates/linear-single-issue-slices.template.md`
- `AGENTS.md`
- `.codex` workflow/policy summaries that name the old parent branch concept
- `scripts/git-start.sh`
- `scripts/task-init.sh`
- `scripts/git-push.sh`
- `scripts/ci/preflight-start.sh`
- `scripts/linear-plan-core.js`
- `.github/workflows/pr-validate-initiative-targets.yml`
- focused workflow tests under `tests/lib`

## Non-goals

- No product UI changes.
- No database changes.
- No migration of historical branch names already present in old feature/fix notes.
- No change to `main`/`develop` release policy.

## Slice Plan

| Slice | Status | Branch | Objective | Validation |
| --- | --- | --- | --- | --- |
| S01 | complete | current branch | Create artifacts and update workflow docs/scripts/tests in one small governance fix. | Focused Vitest workflow tests, docs governance validation, and full repo validation. |

## Test Plan First

- Update tests for Linear plan branch generation before treating scripts as complete.
- Update git workflow script tests to assert `initiative/*` parent branches.
- Update task bootstrap tests to assert `initiative` mode.
- Update PR target workflow tests to assert initiative branch targets.

## Completion Gate

- [x] Focused workflow tests pass.
- [x] `npm run validate:docs-governance` passes.
- [x] `npm run validate` passes.
- [x] Diff review confirms no remaining canonical `integration branch` wording in active governance/tooling paths.
