# Linear Single-Issue Slice Planning

## Purpose

Use this guide as the shared repo reference for planning non-trivial work with:

- one parent Linear issue
- one `*-integration` branch
- one reviewable branch per slice

This guide is intentionally short. The detailed operating heuristics can live in local tooling or local skills, but the repo keeps the canonical policy, template, and generator in version control.

## Canonical Sources

- Policy: `docs/governance/git-monorepo-policy.md`
- Template: `docs/templates/linear-single-issue-slices.template.md`
- Generator: `npm run linear:plan -- ...`

If any explanation in this guide conflicts with governance, governance wins.

## When To Use This Model

Use the single-issue model for non-trivial `feature/*`, `fix/*`, `security/*`, `nft/*`, and `refactor/*` work when the task:

- needs more than one logical slice
- needs more than one PR before `develop`
- touches more than one technical area

## When To Use Real Subissues

Create separate Linear subissues only when at least one is true:

- more than one owner is working independently
- cross-team dependencies need separate tracking
- the initiative is long enough that one issue becomes operationally unclear

If none apply, keep planning inside the parent issue.

## Required Parent Issue Structure

The parent issue must contain:

- `# Objective`
- `# Scope`
- `# Non-goals`
- `# Integration Branch`
- `# Slice Plan`
- `# Order of Execution`
- `# Risks`
- `# Completion Gate`

Use `docs/templates/linear-single-issue-slices.template.md` as the Markdown skeleton.

## Minimum Branch Rules

- The integration branch starts from latest `develop`.
- Slice branches start from the integration branch, not from `develop`.
- Slice PRs target the integration branch.
- The final integration PR targets `develop`.
- Slice ids must be zero-padded: `s01`, `s02`, `s03`.
- Use the lowercase Linear key in the branch name, for example `bri-149`.

See `docs/governance/git-monorepo-policy.md` for the canonical naming rules.

## Feature Notes

If the initiative touches product code and requires `docs/features/*.md`, prefer one accumulated feature note for the full parent issue and update that same file across slices.

## Generator

Use the generator to produce:

- the parent issue Markdown body
- the proposed integration branch
- the proposed slice branches

```bash
npm run linear:plan -- --issue BRI-149 --type feature --scope shared --slug <slug> --title "<title>" --goal "<goal>" --body-file /tmp/bri-149.md
```

## Preferred Planning Path

If your Codex environment has `@jsbd-linear-integration-slice-planner`, use it as the default operator for planning non-trivial single-issue slice work.

It should:

- decide whether the task stays in one parent issue or needs real subissues
- split the initiative into atomic, reviewable slices
- order slices by technical dependency
- produce the Linear-ready Markdown body
- propose the integration branch and every slice branch
- map the primary validation target for each slice

The full worked example belongs to the skill references, not this repo guide.

If the skill is unavailable, use the template plus `npm run linear:plan -- ...` and apply the same policy manually.
