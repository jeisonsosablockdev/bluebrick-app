# Gitflow PR Structure (Metadata-First)

## Objective
Eliminate PR governance friction by enforcing a deterministic, metadata-first workflow before CI evaluation.

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
5. Open PR in draft mode and apply required labels.
6. Wait for governance gates.
7. Mark PR ready and merge only after checks pass.

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
End-to-end PR opener (preflight + push + draft PR + labels).

Example:
```bash
npm run pr:open -- \
  --title "feat(app): improve pr workflow" \
  --body-file /tmp/pr.md \
  --scope scope:app \
  --type type:feature \
  --risk risk:medium
```

## Large PR Handling
- If diff adds more than 400 lines, `pr:open` auto-enables `size-exempt`.
- PR body must include a **feature-flag strategy** phrase (`feature-flag` or `feature flag`).

## Label Application Strategy
Labels are applied through `gh api` instead of `gh pr edit` to avoid GraphQL instability observed in some environments.

## Expected Outcomes
- Fewer failures in `PR Policy (labels, size, branch age, commits, template)`.
- Less manual rerun/recovery work in CI.
- Faster and more predictable merge path to `develop`.
