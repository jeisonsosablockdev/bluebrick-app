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
1. Commit in working branch (never `develop`/`main`).
2. Push branch to origin.
3. Prepare PR body with required sections:
   - `Issue`
   - `RFC`
   - `Riesgos`
   - `Rollback Plan`
   - `Prueba Devnet`
4. Run local metadata lint.
5. Run lightweight local governance preflight.
6. Open PR in draft mode and apply required labels.
7. Wait for governance gates.
8. Mark PR ready and merge only after checks pass.

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
  - if CI still fails, confirm the RFC files are actually committed in the branch before pushing.

## Expected Outcomes
- Fewer failures in `PR Policy (labels, size, branch age, commits, template)`.
- Less manual rerun/recovery work in CI.
- Fewer repeated heavy CI jobs after label/body updates.
- Faster and more predictable merge path to `develop`.
