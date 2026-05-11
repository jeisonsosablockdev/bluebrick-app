# STORY-011-06 / BRI-99 / Documents Editor

## Summary
- Adds a dedicated documents editor to `/admin/collections/[id]`.
- Keeps save/cancel scoped to the `documents` section using the existing discriminated `PATCH` contract.
- Preserves inherited upload metadata (`source`, `fileName`, `fileRefId`) while allowing section-local edits to document categories, labels, titles, descriptions, and links.

## Why
- Documents have their own content model and should not be edited through the text-section or gallery flows.
- This slice keeps the document array modular before any future binary-upload refinements are layered in.

## Validation
- `tests/lib/admin-collection-documents-client.test.ts`
- `tests/components/admin-collection-documents-editor.test.ts`
- `tests/app/admin-collection-detail-page.test.ts`
