---
type: Guide
title: Knowledge Promotion Gitflow
description: Knowledge Promotion Gitflow - migrated from knowledge/
tags: [guides]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/guides/knowledge-promotion-gitflow.md
---

# Knowledge Promotion Gitflow

## Objective
Capture reusable development knowledge without turning every local observation into governance noise.

## Promotion Ladder
1. Delivery evidence lives in `knowledge/features/*.md` and RFCs.
2. Reusable observations live in `knowledge/inbox/*`.
3. Promotion candidates live in `knowledge/proposals/*`.
4. Approved reusable guidance lives in `knowledge/guides/*`.
5. Stable mandatory rules live in `knowledge/governance/*` and executable enforcement.

## Human Checkpoints
- Agents may capture observations and generate reports.
- Promotion to `guide`, `governance`, or `automation` requires human review.
- `AGENTS.md` updates happen only after canonical docs or enforcement change.

## Commands
```bash
npm run knowledge:scan -- --base develop
npm run knowledge:index
npm run knowledge:drift
npm run validate:knowledge
```

## Gitflow Integration
Use this loop on shared workflow work:
1. Implement the shared fix or improvement on the issue-type-driven parent work branch.
2. Update the required documentation note track (`knowledge/features/*.md` or `knowledge/fixes/*.md` as appropriate).
3. If the branch discovered a reusable workflow or anti-pattern, add or update one inbox item under `knowledge/inbox/*`.
4. Run `npm run knowledge:index` so the repo-level index stays current.
5. Optionally run `npm run knowledge:scan -- --base develop` to generate a branch report.
6. Run `npm run knowledge:drift` when governance summaries, CI checks, or operational docs changed.
7. Continue with `npm run pr:ready` / `npm run pr:metadata` / `npm run pr:open`.

## What Not To Do
- Do not write raw observations directly into `AGENTS.md`.
- Do not promote a one-off fix straight into canonical governance.
- Do not automate a workflow until the team has reviewed the tradeoffs.
