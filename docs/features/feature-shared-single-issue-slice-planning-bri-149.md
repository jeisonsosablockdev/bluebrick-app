# Feature Note: single-issue-slice-planning-bri-149

## Summary
Institutionalize a default planning flow where non-trivial work uses one parent Linear issue with Markdown slices, an integration branch, and small slice branches instead of generating many Linear subissues.

## What Changed
- Updated governance summaries and canonical git policy so the repo now defines:
  - one parent Linear issue as the default planning container for non-trivial work
  - `*-integration` branches as the temporary merge target for slice PRs
  - `-sNN-` slice branches as the execution unit for small, reviewable changes
- Updated documentation policy to prefer one accumulated feature note per parent issue across related slices.
- Added operator guidance and a canonical template:
  - `docs/guides/gitflow-pr-structure.md`
  - `docs/guides/linear-single-issue-slice-planning.md`
  - `docs/templates/linear-single-issue-slices.template.md`
- Added `npm run linear:plan` to generate the parent Linear Markdown body plus suggested branch commands.
- Added integration-target CI so slice PRs into `*-integration` branches run:
  - `npm run validate`
  - required docs sync check

## Why
- Too many Linear subissues add tracking noise without improving implementation quality.
- Large PRs hide review risk; small slice branches improve reviewability and rollback.
- The repo already had `develop` governance, but not a canonical operational path for intermediate integration branches.

## Expected Impact
- Better planning discipline before coding starts.
- Smaller PRs with explicit execution order.
- Stronger traceability between Linear, branches, PRs, and feature notes without exploding the number of Linear entries.
