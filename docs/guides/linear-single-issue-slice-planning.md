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

Example:

```bash
npm run linear:plan -- \
  --issue BRI-149 \
  --type feature \
  --scope shared \
  --slug single-issue-slice-planning \
  --title "Single-issue slice planning with integration branches" \
  --goal "Institutionalize issue-only slice planning without Linear subissue noise." \
  --scope-item "Governance summaries and canonical git policy" \
  --scope-item "Operator guides and Linear issue template" \
  --non-goal "No product UI or blockchain behavior changes" \
  --risk "Over-documenting the flow without enough automation" \
  --slice "S01|Formalize governance and AGENTS summaries|AGENTS.md, docs/governance/git-monorepo-policy.md|npm run validate:docs-governance" \
  --slice "S02|Publish guide and canonical template|docs/guides, docs/templates|npm run validate:docs-governance" \
  --body-file /tmp/bri-149.md
```

## Optional Local Skill

If your Codex environment has the local skill `@jsbd-linear-integration-slice-planner`, use it to:

- split the initiative into atomic slices
- order slices by technical dependency
- produce Linear-ready Markdown
- propose integration and slice branch names

That skill is an execution aid, not the policy source of truth.
