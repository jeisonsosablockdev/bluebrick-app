# Linear Single-Issue Slice Planning

## Purpose

Use this guide as the shared repo reference for planning non-trivial work with:

- one parent Linear issue
- one Linear initiative branch from the parent issue `git branch name`
- one reviewable branch per slice

This guide is intentionally short. The detailed operating heuristics can live in local tooling or local skills, but the repo keeps the canonical policy, template, and generator in version control.

## Canonical Sources

- Policy: `docs/governance/git-monorepo-policy.md`
- Template: `docs/templates/linear-single-issue-slices.template.md`
- Developer identity and documentation protocol: `docs/guides/linear-developer-identity-and-documentation-protocol.md`
- Generator: `npm run linear:plan -- ...`

If any explanation in this guide conflicts with governance, governance wins.

## When To Use This Model

Use the single-issue model for non-trivial `feature/*`, `fix/*`, `security/*`, `nft/*`, and `refactor/*` work when the task:

- needs more than one logical slice
- needs more than one PR before `develop`
- touches more than one technical area

Before implementation starts, the initiative must also have:

- a parent Linear issue
- a governing local artifact
- for features and fixes, a problem artifact plus a solution artifact
- a spec/documentation slice as the first slice when the work is multi-slice
- an `explain-like-socrates` conversation in that documentation slice before delivery slices open

## When To Use Real Subissues

Create separate Linear subissues only when at least one is true:

- more than one owner is working independently
- cross-team dependencies need separate tracking
- the initiative is long enough that one issue becomes operationally unclear

If none apply, keep planning inside the parent issue.

## Required Parent Issue Structure

The parent issue must contain:

- confirmed developer ownership
- `# Objective`
- `# Scope`
- `# Non-goals`
- `# Artifact Pair`
- `# Linear Initiative Branch`
- `# Spec Slice`
- `# Slice Plan`
- `# Order of Execution`
- `# Risks`
- `# Test Plan First`
- `# Completion Gate`

Product and SPEC documentation must be bilingual from now on:

- `VERSION ESPAÑOL`
- `ENGLISH VERSION`

The Spanish version must come first and must use correct tildes, punctuation, and Spanish orthography. Linear remains the primary source, and the local `.md` artifacts must mirror the issue body.

Every completed SPEC must add a `SPEC HISTORY` block in the parent Feature documentation and the SPEC documentation. This history records stable outcomes, reusable decisions, and implementation patterns that were validated during the SPEC.

For BRIDS SPEC branches, the internal completion protocol is called `SPEC MERGE`. Before merging a `SPEC/*` branch back into the main `Feature` branch, the developer must update `SPEC HISTORY`, sync Linear, run scope-appropriate validation, review the worktree, and then merge into the `Feature` branch. No PR is required for this internal SPEC-to-Feature merge; the PR belongs to the final Feature branch integration.

Use `docs/templates/linear-single-issue-slices.template.md` as the Markdown skeleton.

## Minimum Branch Rules

- The Linear initiative branch starts from latest `develop`.
- The Linear initiative branch name must match the parent issue `git branch name` field.
- Slice branches start from the Linear initiative branch, not from `develop`.
- The first slice is the spec/documentation slice and must use `explain-like-socrates`.
- Slice PRs target the Linear initiative branch.
- The final initiative PR targets `develop`.
- The final initiative PR pauses before merge until the user manually tests and approves Human Acceptance.
- Slice ids must be zero-padded: `s01`, `s02`, `s03`.
- Use the lowercase Linear key in the branch name, for example `bri-149`.

For BRIDS feature issues where the team explicitly uses a main `Feature` branch divided into multiple SPECS, use SPEC branches with this naming convention:

```text
SPEC/<developer>-bri<issue-number>-specNN-<slug>
```

Example:

```text
SPEC/czambrano-bri168-spec01-landing-dark-hero-look-and-feel
```

In that model, the main `Feature` branch acts as the integration branch for the issue, and each `SPEC` branch starts from it and targets it back for review. `SPEC01`, `SPEC02`, and later numbers organize scope but do not force delivery order when stability, technical dependencies, or integration risk require a different sequence.

Before each `SPEC` branch returns to the main `Feature` branch, run `SPEC MERGE`: document `SPEC HISTORY`, sync Linear as the source of truth, validate the touched scope, inspect `git status`, and merge at the responsible developer's discretion without an intermediate PR.

See `docs/governance/git-monorepo-policy.md` for the canonical naming rules.

## Feature And Fix Artifacts

If the initiative touches product code, prefer one accumulated artifact pair for the full parent issue and update those same files across slices.

For features:

- `docs/features/feature-<slug>.md`
- `docs/features/feature-<slug>-implementation.md`

For fixes:

- `docs/fixes/fix-<slug>.md`
- `docs/fixes/fix-<slug>-implementation.md`

The solution artifact should be decision-complete before delivery slices open.

The solution artifact should also record the Socratic documentation result, the clean-code design contract per delivery slice, and the Human Acceptance gate for the final `develop` merge.

## Generator

Use the generator to produce:

- the parent issue Markdown body
- the proposed Linear initiative branch
- the proposed slice branches

```bash
npm run linear:plan -- --issue BRI-149 --type feature --scope shared --slug <slug> --title "<title>" --goal "<goal>" --body-file /tmp/bri-149.md
```

## Preferred Planning Path

If your Codex environment has a Linear initiative slice planner, use it as the default operator for planning non-trivial single-issue slice work.

It should:

- decide whether the task stays in one parent issue or needs real subissues
- split the initiative into atomic, reviewable slices
- order slices by technical dependency
- produce the Linear-ready Markdown body
- propose the Linear initiative branch and every slice branch
- map the primary validation target for each slice
- keep final merge to `develop` blocked until Human Acceptance is explicitly approved

The full worked example belongs to the skill references, not this repo guide.

If the skill is unavailable, use the template plus `npm run linear:plan -- ...` and apply the same policy manually.
