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

## Mandatory Sequence
1. For non-trivial work, create/update one parent Linear issue with a Markdown slice plan before coding.
2. If slices are required, create an `*-integration` branch from `develop` and create slice branches from that integration branch.
3. Commit in the active working branch (never `develop`/`main`).
4. Push branch to origin.
5. Prepare PR body with required sections:
   - `Issue`
   - `RFC`
   - `Riesgos`
   - `Rollback Plan`
   - `Prueba Devnet`
6. Run local metadata lint.
7. Run lightweight local governance preflight.
8. Open PR in draft mode and apply required labels.
9. Wait for governance gates.
10. Mark PR ready and merge only after checks pass.

## Single-Issue Slice Planning
- Preferred tracking model: one Linear issue with Markdown slices, not a pile of subissues.
- Detailed planning guide: `docs/guides/linear-single-issue-slice-planning.md`
- Template: `docs/templates/linear-single-issue-slices.template.md`
- Generator: `npm run linear:plan -- ...`

Use the parent issue to store:
- objective, scope, and non-goals
- integration branch name
- slice table with one branch per slice
- execution order and completion gate

## Branch And PR Targets
- Slice branch PRs target the parent `*-integration` branch.
- Final integration PR targets `develop`.
- Slice PRs must still pass `npm run validate` and the required docs sync check.
- Final PRs to `develop` continue to use the full governance workflow and metadata policy.
- `scripts/git-start.sh`, `scripts/git-flow.sh`, and `scripts/full-cycle.sh` must generate branches that follow this target model.

Example slice PR opener:
```bash
npm run pr:open -- \
  --title "feat(shared): close BRI-149 S01 governance policy" \
  --body-file /tmp/pr-s01.md \
  --scope scope:shared \
  --type type:feature \
  --risk risk:low \
  --base feature/shared-single-issue-slice-planning-bri-149-integration
```

Example integration/slice branch creation:
```bash
./scripts/git-start.sh feature shared single-issue-slice-planning --mode integration --issue BRI-149
./scripts/git-start.sh feature shared single-issue-slice-planning --mode slice --issue BRI-149 --slice-id S01 --slice-slug governance-policy
```

Example final PR opener:
```bash
npm run pr:open -- \
  --title "feat(shared): institutionalize single-issue slice planning" \
  --body-file /tmp/pr-final.md \
  --scope scope:shared \
  --type type:feature \
  --risk risk:low \
  --base develop
```

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
  - `opened` returns a lightweight success message so the PR surface stays explicit without running full metadata enforcement too early
  - `edited`
  - `synchronize`
  - `reopened`
  - `ready_for_review`
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
