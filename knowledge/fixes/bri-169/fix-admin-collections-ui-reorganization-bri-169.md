---
type: Fix Spec
title: Fix Admin Collections Ui Reorganization BRI- 169
description: Fix Admin Collections Ui Reorganization BRI- 169 - migrated from knowledge/
tags: [fixes]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/fixes/bri-169/fix-admin-collections-ui-reorganization-bri-169.md
---

# Fix: Admin Collections UI Reorganization (BRI-169)

## Status
- Parent Linear issue: `BRI-169`
- Linear URL: `https://linear.app/brids-app/issue/BRI-169/fix-admincollections-ui-reorganization`
- Branch family: `fix/app`
- Initiative branch: `initiative/bri-169-admin-collections-ui-reorganization`
- Spec slice: `fix/app-admin-collections-ui-reorganization-bri-169-s01-spec`
- Current phase: complete, ready for final PR to `develop`

## Problem
The EPIC-011 admin collections console is functionally complete, but the UI still reflects the order in which the story was implemented instead of the operator workflow it now supports. The result is an admin surface that works, but feels redundant and harder to scan than it should.

Current gaps:
- `/admin/collections` stacks a health queue callout, dashboard copy, metric cards, and collection cards before the operator reaches the actual editable projects.
- Collection cards repeat long addresses and section labels in a card-heavy layout, which makes the page slower to scan when several collections exist.
- `/admin/collections/[id]` still contains planning-era copy such as mounted-editor and future-slice language even though summary, property, location, documents, and blockchain panels are live.
- The detail page places immutable blockchain metadata before the editable workspace, so the primary task is visually subordinated to reference data.
- Detail sections repeat scaffold language and descriptions even when the mounted editor already communicates the state.
- The health queue is correct as a read-only operational surface, but it does not visually align with the main collections workspace yet.

## Why It Matters
Collection admins are using this area to triage readiness, edit marketplace-facing content, and recover degraded rows. The UI should help them answer three questions quickly:

1. Which collections are ready to edit?
2. What needs attention before a collection can be edited?
3. Where is the next safe action on a detail page?

The current layout answers those questions, but with extra narration and repeated surfaces. This fix should make the console feel like one coherent operations workspace without changing the server-side authority model.

## Expected Outcome
- `/admin/collections` becomes a compact operations workspace for ready collections, review counts, and direct management actions.
- `/admin/collections/[id]` prioritizes editable sections and moves immutable blockchain/snapshot metadata into a secondary reference lane.
- Section shells use consistent, shorter labels and status affordances instead of planning-era explanatory copy.
- The health queue keeps degraded rows separated, but visually aligns with the redesigned collections workspace.
- The document upload behavior delivered under BRI-165 remains intact, including Vercel Blob upload, drag and drop, 10 MB warning, and LovePDF guidance.

## Slice Progress
- S01 merged the governing artifact pair and fixed the initiative-target preflight false positive that checked GitHub's synthetic merge commit instead of the real slice branch commits.
- S02 reorganizes `/admin/collections` into a compact operations console with summary metrics, ready rows, and an inline health-queue handoff while preserving the existing server-side read model.
- S03 moves `/admin/collections/[id]` into a content-first detail editor: editable sections render before the read-only blockchain reference, and planning-era mounted/future-slice copy is removed.
- S04 removes remaining planning-era copy from mounted editor surfaces, gallery references, fallback sections, loading state, and error state while preserving the same section editors and server-side authority model.
- S05 aligns `/admin/health/collections` with the compact review-queue language, captures responsive evidence across required widths, and performs initiative closeout validation.

## Scope
- Routes:
  - `/admin/collections`
  - `/admin/collections/[id]`
  - `/admin/collections/health`
- Components:
  - `components/admin/admin-collections-*`
  - `components/admin/admin-collection-detail-*`
  - existing collection editor components as needed for visual consistency
- Tests and evidence:
  - targeted Vitest coverage for page/component copy and structure
  - Playwright admin collections flow and responsive QA evidence at 320, 375, 768, and 1024 widths

## Non-Goals
- No database schema changes.
- No API contract changes.
- No changes to SIWS, admin role derivation, cookies, or session resolution.
- No changes to snapshot generation, snapshot evidence, ownership validation, or marketplace handoff persistence.
- No changes to Vercel Blob upload transport or document persistence semantics.
- No global `AdminShell` redesign.
- No gallery mutation feature work beyond preserving or arranging the existing gallery shell.

## UX Direction
Use `ui-ux-pro-max` as a quality gate, but stay inside the existing BRIDS admin visual language. The target style is a data-dense admin dashboard: compact hierarchy, clear status, predictable primary actions, responsive layout, and reduced explanatory text.

Design constraints:
- Preserve the existing dark admin surface and `Card` component language.
- Prefer one primary action per screen region.
- Avoid nested card stacks where a table-like row, panel, or inline group is enough.
- Keep touch targets at least 44px high.
- Do not rely on color alone for readiness or review state.
- Remove stale implementation/planning copy from the product UI.
- Keep responsive behavior mobile-first and no-horizontal-overflow at 320px minimum.

## Open Questions
- Whether the index should remain card-first on desktop or move to a row/list hybrid for better density.
- Whether detail page section navigation should be sticky on desktop or a compact in-page rail.
- Whether health rows should expose a direct "View context" action for every degraded state or only when the read model can guarantee a safe destination.
