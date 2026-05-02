# Linear Single-Issue Slice Planning

## Objective
Keep work small and reviewable without filling Linear with subissues that only exist to track implementation slices.

## Default Model
Use one parent Linear issue for the initiative and keep the implementation breakdown inside that issue as Markdown.

This model is the default for non-trivial `feature/*`, `fix/*`, `security/*`, `nft/*`, and `refactor/*` work when the change should be split into more than one slice.

## When To Use Real Subissues
Create separate Linear subissues only when at least one of these is true:
- more than one owner is working independently
- cross-team dependencies need separate tracking
- the work spans enough time that one issue becomes operationally unclear

If none of those apply, stay on the single-issue model.

## Required Parent Issue Structure
The parent issue should contain these sections:
- `# Objective`
- `# Scope`
- `# Non-goals`
- `# Integration Branch`
- `# Slice Plan`
- `# Order of Execution`
- `# Risks`
- `# Completion Gate`

Use `docs/templates/linear-single-issue-slices.template.md` as the canonical Markdown skeleton.

## Slice Rules
Each slice should have:
- one dominant responsibility
- one proposed branch
- one validation target
- one reviewable unit of change

Good slices:
- contract and types
- API route or server action
- UI shell
- wallet / auth verification
- docs and QA closeout

Bad slices:
- mixed frontend + backend + docs + QA when they can be separated
- broad "finish feature" branches
- unrelated cleanup folded into a feature slice

## Branch Convention
The parent issue proposes an integration branch:

```text
feature/shared-single-issue-slice-planning-bri-149-integration
```

Each slice uses its own branch from that integration branch:

```text
feature/shared-single-issue-slice-planning-bri-149-s01-governance-policy
feature/shared-single-issue-slice-planning-bri-149-s02-guides-and-template
feature/shared-single-issue-slice-planning-bri-149-s03-tooling-and-ci
```

Rules:
- use the lowercase Linear key in the branch name (`bri-149`)
- use zero-padded slice ids (`s01`, `s02`, `s03`)
- keep the parent slug stable across the integration branch and all slice branches

## PR Flow
1. Create the integration branch from latest `develop`.
2. Create a slice branch from the integration branch.
3. Open a PR from the slice branch into the integration branch.
4. Merge reviewed slices into the integration branch.
5. Open the final PR from the integration branch into `develop`.

## Feature Notes
If the work touches product code and requires `docs/features/*.md`, prefer one accumulated feature-note file for the parent issue and update that same file across slices.

## Generator
Use the generator to produce the parent issue Markdown and the exact branch suggestions:

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
  --scope-item "Tooling and CI support for integration-target PRs" \
  --non-goal "No product UI or blockchain behavior changes" \
  --risk "Over-documenting the flow without enough automation" \
  --slice "S01|Formalize governance and AGENTS summaries|AGENTS.md, docs/governance/git-monorepo-policy.md, docs/governance/documentation-policy.md|npm run validate:docs-governance" \
  --slice "S02|Publish guide and canonical template|docs/guides/gitflow-pr-structure.md, docs/guides/linear-single-issue-slice-planning.md, docs/templates/linear-single-issue-slices.template.md|npm run validate:docs-governance" \
  --slice "S03|Add plan generator and integration-target CI|scripts/linear-plan-core.js, scripts/linear-plan.js, package.json, .github/workflows, tests/lib|npm run validate" \
  --body-file /tmp/bri-149.md
```

The command writes the Markdown body and prints the `git checkout -b ...` commands for the integration branch and each slice branch.
