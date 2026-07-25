---
type: Feature Spec
title: Feature Admin Collection Documents Ui Remake Implementation
description: Feature Admin Collection Documents Ui Remake Implementation - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/other/feature-admin-collection-documents-ui-remake-implementation.md
---

# Implementation: Admin collection documents UI remake

## Resolution Strategy

Keep the existing document editor behavior and reshape only the presentation layer.

The implementation will:

- keep `uploadAssetFileViaClientBlob` and edit-session promotion untouched,
- keep manual URL rows available through `createEmptyAdminCollectionDocumentDraft`,
- derive summary counts from the current draft rows,
- replace redundant copy with a compact document workspace,
- restyle document rows so metadata and actions are visible before the editable fields.

## UI/UX Pro Max Guidance

Design-system query:

```bash
python3 /Users/jaymusicmachine/.codex/skills/ui-ux-pro-max/scripts/search.py "admin marketplace collection document editor professional dense" --design-system -p "BRIDS Admin Collections" -f markdown
```

Selected direction:

- Style: Data-Dense Dashboard
- Typography: Inter / neutral admin rhythm
- UX priorities: visible labels, loading feedback, compact touch-safe controls, clear error recovery
- Avoid: ornamental UI and long redundant explanation blocks

## Test Plan

- Update the documents editor render test to assert the new workspace copy and summary counts.
- Keep upload affordance assertions for drag-and-drop, Vercel Blob, 10 MB, and iLovePDF guidance.
- Keep jsdom upload test to protect the canonical upload behavior.

## Non-Goals

- No database changes.
- No upload policy changes.
- No marketplace public-detail changes.
- No reorder/delete undo behavior in this slice.

## Implementation Evidence

- Added a compact document workspace with document/upload/manual-link summary metrics.
- Grouped canonical upload and manual link fallback into one creation area.
- Reduced repeated explanatory copy in the shell and empty state.
- Restyled document rows to lead with identity, source metadata, and row actions before editable fields.
- Preserved Vercel Blob upload behavior, 10 MB/iLovePDF guidance, manual URL fallback, and section-scoped save/cancel behavior.
- Targeted tests passed:
  - `npm test -- tests/components/admin-collection-documents-editor.test.ts tests/lib/admin-collection-documents-client.test.ts tests/app/admin-collection-detail-page.test.ts`
- Quality checks passed:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run validate`
  - `npm run validate:docs-governance`
  - `git diff --check`
- Browser/Playwright fixture verification:
  - Authenticated admin fixture loaded `/admin/collections/entry-bri-101-primary`.
  - `375px` and `1440px` checks reported no horizontal overflow.
  - Manual fallback, choose files, and save buttons measured at least `44px` high.
- Known unrelated suite status:
  - Full `npm test` still fails in pre-existing marketplace motion and location contract tests (`galleryImages` fixture missing, `postalCode: null` expectations). The admin detail-page assertion touched by this remake was updated and now passes in the targeted set.
