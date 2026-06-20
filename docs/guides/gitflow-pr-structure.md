# Gitflow PR Structure (Metadata-First)

## Objective
Eliminate PR governance friction by enforcing a deterministic, metadata-first workflow before CI evaluation.

## Source Of Truth (SSOT)
All PR governance rules come from:
- `docs/governance/pr-policy-source-of-truth.json`

This includes:
- allowed labels (`scope:*`, `type:*`, `risk:*`),
- required PR body sections,
- commit-message pattern,
- size/branch-age thresholds and exemption labels.

`AGENTS.md`, local scripts, and CI must reference this file and must not duplicate rule lists.

## Task Bootstrap

When a new task brief is vague or underspecified, start with `npm run task:init` instead of jumping straight to branch creation.

It runs the preflight diagnostics, asks a Socratic clarification pass with `explain-like-socrates` for the problem, outcome, scope, and branch shape, and then delegates to the canonical branch helper once the shape is clear. `preflight:start` itself now fails closed on fresh `develop` startups unless the bootstrap mode is explicit, so the interactive path is the only safe way to begin ambiguous work.

For multi-slice work, the first branch after the Linear initiative branch is the spec/documentation slice. That slice must use `explain-like-socrates` before artifacts, assumptions, and delivery slices are finalized.

## Mandatory Sequence
1. For non-trivial work, create/update one parent Linear issue with a human-first brief and a technical protocol before coding.
2. The issue type selected in the documentation pass determines the parent work branch family.
3. If multiple phases are required, create the parent work branch from `develop` and create SPEC branches from that parent work branch one at a time.
4. Commit in the active working branch (never `develop`/`main`).
5. Push branch to origin.
6. Prepare PR body with required sections:
   - `Issue`
   - `RFC`
   - `Riesgos`
   - `Rollback Plan`
   - `Prueba Devnet`
7. Run local metadata lint.
8. Run lightweight local governance preflight.
9. Open PR in draft mode and apply required labels.
10. Wait for governance gates.
11. Mark PR ready and merge only after checks pass.

## Single-Issue SPEC Planning
- Preferred tracking model: one Linear issue with Markdown slices, not a pile of subissues.
- The parent issue should clearly state the issue type, because the type controls the branch family and the artifact track.
- Detailed planning guide: `docs/guides/linear-single-issue-slice-planning.md`
- Template: `docs/templates/linear-single-issue-slices.template.md`
- Generator: `npm run linear:plan -- ...`

Use the parent issue to store:
- objective, scope, and non-goals
- parent work branch name
- SPEC table with one branch per SPEC
- execution order and completion gate

## Branch And PR Targets
- SPEC branch PRs target the parent work branch.
- Final parent work branch PR targets `develop`.
- SPEC PRs must still pass `npm run validate` and the required docs sync check.
- Final PRs to `develop` continue to use the full governance workflow and metadata policy.
- Final PRs to `develop` cannot be merged until Human Acceptance records explicit user manual-test approval.
- `scripts/git-start.sh`, `scripts/git-flow.sh`, and `scripts/full-cycle.sh` must generate branches that follow this target model.

## Linear Status Automation
- When issue-tracked work starts, the branch helper moves the Linear issue to `In Progress`.
- When the issue enters review, `pr:ready` or `pr:open` moves the Linear issue to `In Review`.
- When the final parent work branch is merged to `develop`, the protected-branch push workflow resolves the merged PR issue key(s) and runs `npm run linear:issue-done` to move the issue to `Done`.
- If the issue key cannot be resolved or the Linear API key is absent, the automation skips safely and prints a note instead of blocking local work.

Example slice PR opener:
```bash
npm run pr:open -- \
  --title "feat(shared): close <issue> SPEC governance policy" \
  --body-file /tmp/pr-s01.md \
  --scope scope:shared \
  --type type:feature \
  --risk risk:low \
  --base feature/<developer>-<issue>-<name>
```

Example parent/SPEC branch creation:
```bash
./scripts/git-start.sh feature shared <slug> --mode parent --owner <developer> --issue <issue> --base develop
./scripts/git-start.sh SPEC governance-policy --mode spec --owner <developer> --issue <issue> --base feature/<developer>-<issue>-<name>
```

Issue-type-driven variants use the same flow, for example `bugfix/<developer>-<issue>-<name>`, `hotfix/<developer>-<issue>-<name>`, or `epic/<developer>-<issue>-<name>` when the issue type demands those families.

Example final PR opener:
```bash
npm run pr:open -- \
  --title "feat(shared): institutionalize single-issue SPEC planning" \
  --body-file /tmp/pr-final.md \
  --scope scope:shared \
  --type type:feature \
  --risk risk:low \
  --base develop
```

## Shared Learning Loop
If a branch discovers a reusable workflow, command, anti-pattern, or repeated source of friction:
- capture it under `docs/knowledge/inbox/*`,
- refresh the shared index with `npm run knowledge:index`,
- and keep promotion to `guide`, `governance`, or `automation` behind human review.

Supporting commands:
- `npm run knowledge:scan -- --base develop`
- `npm run knowledge:index`
- `npm run knowledge:drift`
- `npm run validate:knowledge`

## New Automation Commands
### `npm run pr:metadata -- ...`
Local metadata lint for PR body and labels.

Example:
```bash
npm run pr:metadata -- \
  --body-file /tmp/pr.md \
  --scope scope:app \
  --type type:feature \
  --risk risk:medium
```

### `npm run pr:open -- ...`
End-to-end PR opener (metadata lint + lightweight governance preflight + push + draft PR + labels).

Example:
```bash
npm run pr:open -- \
  --title "feat(app): improve pr workflow" \
  --body-file /tmp/pr.md \
  --scope scope:app \
  --type type:feature \
  --risk risk:medium
```

By default, `pr:open` runs `pr:ready` in `governance-only` mode so authors fail fast on:
- docs governance
- commit convention
- PR size
- branch age

Full `npm run validate` remains mandatory in CI after the PR is opened. If needed, force the old local behavior:

```bash
npm run pr:open -- \
  --title "feat(app): improve pr workflow" \
  --body-file /tmp/pr.md \
  --scope scope:app \
  --type type:feature \
  --risk risk:medium \
  --validate-mode full
```

## Large PR Handling
- If diff adds more than 400 lines, `pr:open` auto-enables `size-exempt`.
- PR body must include a **feature-flag strategy** phrase (`feature-flag` or `feature flag`).

## Label Application Strategy
Labels are applied through `gh api` instead of `gh pr edit` to avoid GraphQL instability observed in some environments.

## CI Event Strategy
- Full governance validation (`validate` + `required docs`) runs only on events that can change code state:
  - `opened`
  - `synchronize`
  - `reopened`
  - `ready_for_review`
- PR metadata policy runs in conservative mode on state changes that justify a re-check without fan-out from label churn:
  - `opened`
  - `edited`
  - `synchronize`
  - `reopened`
  - `ready_for_review`
- For final PRs to `develop`, metadata policy can fail while Human Acceptance is pending; the check becomes green only after the PR body records `Status: approved`.
- The policy job re-fetches the current PR body and labels from the live pull-request API instead of trusting the original event payload.
- Workflow concurrency cancels superseded runs by PR number and event category (`full` vs `policy-lite`) so metadata-only churn does not fan out into redundant CI.
- Release drafter stays on minimum-noise mode:
  - `push` to `develop`
  - optional manual `workflow_dispatch`
  - no PR-event trigger churn while the branch is still under review

## Story Branch RFC Detection
Docs governance accepts both story-branch naming styles:
- `epic-011-story-02-...`
- `epic-011-story-011-02-...`

This keeps the RFC sync gate compatible with branches that include the full story identifier.

## Troubleshooting
- `unknown flag: --head` with `gh pr view`:
  - use `gh pr list --head <branch>` to discover PR number/url.
  - `pr:open` already uses `gh pr list` for compatibility across `gh` versions.
- Local/CI mismatch on labels or sections:
  - check `docs/governance/pr-policy-source-of-truth.json`,
  - rerun `npm run pr:metadata` before opening or updating PR.
- Docs gate says RFC files are missing even though you already edited them locally:
  - rerun with the current working tree; local preflight now includes uncommitted and untracked changes,
  - local docs output suppresses known operational-noise paths such as `.npm-cache/*`, `.env.vercel`, and `docs/linear-context.md`,
  - if CI still fails, confirm the RFC files are actually committed in the branch before pushing.

## Expected Outcomes
- Fewer failures in `PR Policy (labels, size, branch age, commits, template)`.
- Less manual rerun/recovery work in CI.
- Fewer repeated heavy CI jobs after label/body updates.
- Faster and more predictable merge path to `develop`.
