---
type: Feature Spec
title: Feature Admin Collection Documents Ui Remake
description: Feature Admin Collection Documents Ui Remake - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-admin-collection-documents-ui-remake.md
---

# Feature: Admin collection documents UI remake

## Problem

The `/admin/collections/[id]` documents editor works functionally, but the interface is too verbose for an admin workflow:

- section, list, upload, and footer copy repeat the same section-scoped save model,
- upload and manual-link creation are visually separated even though both create document rows,
- the document cards make operators scan the form before they can identify the document,
- status is spread across multiple messages instead of summarized in one compact work area.

## Design Direction

Use a data-dense admin pattern for this section:

- compact hierarchy,
- visible counts for documents/uploads/link rows,
- one creation workspace for upload and manual URL fallback,
- document rows that show identity, source, and actions before editable fields,
- keep 44px minimum targets, visible labels, inline feedback, and responsive stacking.

## Expected Outcome

- The editor reads as a document workspace, not a tutorial.
- Admins can quickly choose between canonical upload and manual link fallback.
- Uploaded/manual document counts are visible without reading row metadata.
- Existing save/cancel semantics, upload pipeline, iLovePDF guidance, and file metadata remain intact.
- The layout remains usable at mobile and desktop breakpoints.

## Acceptance Mapping

1. Header copy is shorter and removes redundant explanatory text.
2. Upload and manual link actions are grouped in one compact creation panel.
3. The panel surfaces document count, uploaded count, and manual-link count.
4. Document rows lead with document identity and actions before fields.
5. Tests assert the new workspace affordance and keep upload behavior covered.
6. No storage, persistence, or upload transport contracts change.
