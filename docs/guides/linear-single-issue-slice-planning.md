# Linear Single-Issue Feature + SPEC Planning

## Purpose

Use this guide as the shared repo reference for planning non-trivial work with:

- one parent Linear issue
- one parent work branch from the parent issue `git branch name`
- one SPEC branch per phase, created one at a time from the parent work branch

This guide is intentionally short. The detailed operating heuristics can live in local tooling or local skills, but the repo keeps the canonical policy, template, and generator in version control.

## Canonical Sources

- Policy: `docs/governance/git-monorepo-policy.md`
- Template: `docs/templates/linear-single-issue-slices.template.md`
- Generator: `npm run linear:plan -- ...`

If any explanation in this guide conflicts with governance, governance wins.

## When To Use This Model

Use the single-issue model for non-trivial issue-type-driven work when the task:

- needs more than one logical phase
- needs more than one PR before `develop`
- touches more than one technical area

Before implementation starts, the initiative must also have:

- a parent Linear issue
- an issue type decided in the human-plus-agent documentation pass
- a governing local artifact
- for feature, security, nft, refactor, and epic work, the feature-note track and any required RFC traceability
- for fix, bugfix, and hotfix work, a problem artifact plus a solution artifact
- a SPEC plan with the first SPEC identified before any later SPECs open

## When To Use Real Subissues

Create separate Linear subissues only when at least one is true:

- more than one owner is working independently
- cross-team dependencies need separate tracking
- the initiative is long enough that one issue becomes operationally unclear

If none apply, keep planning inside the parent issue.

## Required Parent Issue Structure

The parent issue must contain a human-first section followed by a technical section. At minimum, include:

- `# Human Brief`
- `# Objective`
- `# Scope`
- `# Non-goals`
- `# Acceptance Criteria`
- `# Risks`
- `# Open Questions`
- `# Technical Protocol for Agents`
- `# Artifact Pair`
- `# Parent Work Branch`
- `# SPEC Plan`
- `# Order of Execution`
- `# Test Plan First`
- `# Completion Gate`

Use `docs/templates/linear-single-issue-slices.template.md` as the Markdown skeleton.

## Minimum Branch Rules

- The parent work branch starts from latest `develop`.
- The parent work branch name must match the parent issue `git branch name` field.
- SPEC branches start from the parent work branch, not from `develop`.
- The first SPEC is the planning SPEC.
- SPEC PRs target the parent work branch.
- The final parent work branch PR targets `develop`.
- Create only one SPEC at a time; do not pre-create the whole sequence.
- Use the canonical Linear issue key exactly as Linear exposes it, for example `BRI-149`.
- Use a lowercase developer handle in the branch prefix, for example `czambrano`.

See `docs/governance/git-monorepo-policy.md` for the canonical naming rules.

## Feature And Fix Artifacts

If the initiative touches product code, prefer one accumulated artifact pair for the full parent issue and update those same files across SPECs.

For features:

- `docs/features/feature-<slug>.md`
- `docs/features/feature-<slug>-implementation.md`

For fixes:

- `docs/fixes/fix-<slug>.md`
- `docs/fixes/fix-<slug>-implementation.md`

The solution artifact should be decision-complete before the first SPEC opens.

## Generator

Use the generator to produce:

- the parent issue Markdown body
- the proposed parent work branch
- the proposed SPEC branches

```bash
npm run linear:plan -- --issue <issue> --type <type> --scope shared --owner <developer> --slug <slug> --title "<issue title>" --goal "<goal>" --spec "S01|<spec-slug>|<spec objective>|<paths>|<validation>" --body-file /tmp/<issue>.md
```

## Preferred Planning Path

If your Codex environment has a Linear planner, use it as the default operator for planning non-trivial single-issue work.

It should:

- decide whether the task stays in one parent issue or needs real subissues
- split the initiative into atomic, reviewable SPECs
- order SPECs by technical dependency
- produce the Linear-ready Markdown body
- propose the parent work branch and every SPEC branch
- map the primary validation target for each SPEC

The full worked example belongs to the skill references, not this repo guide.

If the skill is unavailable, use the template plus `npm run linear:plan -- ...` and apply the same policy manually.
