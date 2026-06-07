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
- Developer identity and documentation protocol: `docs/guides/linear-developer-identity-and-documentation-protocol.md`
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

- confirmed developer ownership
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

Product and SPEC documentation must be bilingual from now on:

- `VERSION ESPAÑOL`
- `ENGLISH VERSION`

The Spanish version must come first and must use correct tildes, punctuation, and Spanish orthography. Linear remains the primary source, and the local `.md` artifacts must mirror the issue body.

SPEC definitions must use a numbered-list format for readability: `1. **SPEC01 - <title>**`, `2. **SPEC02 - <title>**`, `3. **SPEC03 - <title>**`, and so on. Branch, objective, scope, and criteria must be indented under each numbered SPEC item. Leave two normal line breaks between SPEC items so Linear renders visual spacing. The numeric prefix is a documentation ordering aid and does not override the stability-first execution rule.

Every completed SPEC must add to `SPEC DEVELOPMENT HISTORY` at the end of the parent Feature documentation and the SPEC documentation. This history records stable outcomes, reusable decisions, and implementation patterns that were validated during the SPEC. In the main issue body, it lives after `VERSION ESPAÑOL` and `ENGLISH VERSION`.

For BRIDS SPEC branches, the internal completion protocol is called `SPEC MERGE`. Before merging a `SPEC/*` branch back into the main `Feature` branch, the developer must update `SPEC DEVELOPMENT HISTORY`, sync Linear, run scope-appropriate validation, review the worktree, and then merge into the `Feature` branch. No PR is required for this internal SPEC-to-Feature merge; the PR belongs to the final Feature branch integration.

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

For BRIDS feature issues where the team explicitly uses a main `Feature` branch divided into multiple SPECS, use SPEC branches with this naming convention:

```text
SPEC/<developer>-bri<issue-number>-specNN-<slug>
```

Example:

```text
SPEC/czambrano-bri168-spec01-landing-dark-hero-look-and-feel
```

In that model, the main `Feature` branch acts as the integration branch for the issue, and each `SPEC` branch starts from it and targets it back for review. `SPEC01`, `SPEC02`, and later numbers organize scope but do not force delivery order when stability, technical dependencies, or integration risk require a different sequence.

Before each `SPEC` branch returns to the main `Feature` branch, run `SPEC MERGE`: document `SPEC DEVELOPMENT HISTORY`, sync Linear as the source of truth, validate the touched scope, inspect `git status`, and merge at the responsible developer's discretion without an intermediate PR.

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

If the initiative touches product code, prefer one accumulated artifact pair for the full parent issue and update those same files across SPECs.

For features:

- `docs/features/feature-<slug>.md`
- `docs/features/feature-<slug>-implementation.md`

For fixes:

- `docs/fixes/fix-<slug>.md`
- `docs/fixes/fix-<slug>-implementation.md`

The solution artifact should be decision-complete before the first SPEC opens.

The solution artifact should also record the Socratic documentation result, the clean-code design contract per delivery slice, and the Human Acceptance gate for the final `develop` merge.

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
