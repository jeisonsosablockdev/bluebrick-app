---
type: Fix Spec
title: Fix Admin Collections Document Upload Implementation
description: Fix Admin Collections Document Upload Implementation - migrated from knowledge/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-admin-collections-document-upload-implementation.md
---

# Implementation: Admin collections document upload

## Resolution Strategy

Reuse the existing admin upload transport instead of introducing a new storage path.

The collection documents editor will call `uploadAssetFileViaClientBlob` with:

- document category derived from the file/type,
- a stable local `draftId`,
- a stable local `editSessionId`,
- no SEO image context because this slice is document-focused.

The upload result is converted into a document draft row and left unsaved until the admin clicks `Save documents`.

## Slice Plan

### Slice 1: Spec and Tests

- Add the fix problem and implementation artifacts.
- Add tests for the upload draft mapping and upload affordance copy.

### Slice 2: Documents Editor Upload UI

- Add client-side stable IDs for collection document upload sessions.
- Add a drag-and-drop/file-picker upload control inside the documents editor.
- Show the canonical 10 MB document upload limit and iLovePDF compression hint in the upload area before admins select a file.
- Keep controls responsive and touch targets at least `44px`.
- Track upload state separately from save state.

### Slice 3: Canonical Upload Integration

- Reuse `uploadAssetFileViaClientBlob`.
- Convert successful finalized uploads into `AdminCollectionDocumentDraft` rows.
- Preserve manual URL editing and section-scoped save/cancel.
- Surface upload errors without clearing existing drafts.

## Tests First Contract

- `tests/lib/admin-collection-documents-client.test.ts` covers mapping from upload finalize payload to document drafts.
- `tests/components/admin-collection-documents-editor.test.ts` covers the rendered upload affordance and copy.

## Tooling and Gates

- Targeted tests:
  - `npm test -- tests/lib/admin-collection-documents-client.test.ts tests/components/admin-collection-documents-editor.test.ts`
- Quality:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run validate`

## Security and Trust Boundary

- Browser code only requests an upload contract and uploads to Vercel Blob using the existing client helper.
- Admin authorization, upload contract validation, MIME policy, size policy, checksum validation, finalize persistence, and edit-session lifecycle remain server-enforced by the existing upload routes.
- Manual URLs remain editable but do not bypass upload validation for uploaded files.

## Responsive QA Notes

- The upload control must fit at `320px`, `375px`, `768px`, and `1024px`.
- Primary upload and save/cancel controls must remain at least `44px` high.
- No horizontal overflow should be introduced in the document cards or upload area.

## Implementation Evidence

- Added `createUploadedAdminCollectionDocumentDraft` to convert finalized Vercel Blob upload metadata into collection document drafts.
- Added a documents upload dropzone/file picker to `AdminCollectionDocumentsEditor`.
- Added visible 10 MB/iLovePDF guidance to the documents upload affordance while keeping server-side size enforcement authoritative.
- Reused `uploadAssetFileViaClientBlob`, preserving signed upload contracts, Vercel Blob client upload, checksum/finalize validation, and admin auth checks.
- Added stable local `draftId` and `editSessionId` values for the editor upload session.
- Promoted uploaded files after the documents section PATCH succeeds so the orphan reconciler does not purge saved collection documents.
- Kept manual URL editing and section-scoped Save/Cancel behavior.
- Targeted tests passed:
  - `npm test -- tests/lib/admin-collection-documents-client.test.ts tests/components/admin-collection-documents-editor.test.ts`
- Quality gates passed:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run validate`
- Clean-code pass:
  - No duplicate upload transport introduced.
  - Server trust boundary remains in existing upload routes.
  - New UI state is scoped to the documents editor.
