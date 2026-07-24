---
type: Fix Spec
title: Fix Admin Collections Document Upload
description: Fix Admin Collections Document Upload - migrated from knowledge/
tags: [fixes]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/fixes/fix-admin-collections-document-upload.md
---

# Fix: Admin collections document upload

## Problem

`/admin/collections/[id]` lets admins edit marketplace collection documents, but the documents editor only supports manually adding a URL.

That creates operational risk:

- admins can paste stale, private, malformed, or non-CDN links,
- document metadata can drift from the upload audit trail,
- the collection editor does not reuse the canonical Vercel Blob upload lifecycle already used by `/admin/assets/new`,
- there is no drag-and-drop path for the document editor, even though file upload is the safer primary workflow.

## Why It Matters

Marketplace documents are public-facing investment materials. They should be uploaded through the controlled admin upload pipeline so size, MIME type, checksum, admin authorization, Vercel Blob storage, file refs, and cleanup lifecycle stay consistent.

Manual URLs should remain available as an escape hatch, but they should not be the only path.

## Expected Outcome

- The collection documents editor exposes a drag-and-drop/file-picker upload area.
- Uploaded documents use the existing `uploadAssetFileViaClientBlob` flow and therefore Vercel Blob client uploads.
- Uploads are associated with a stable collection edit session using `draftId` and `editSessionId`.
- A successful upload adds a document draft row with CDN URL, file name, MIME type, file ref id, category tag, and upload source metadata.
- The upload area warns admins that supported documents are limited to 10 MB and points oversized PDFs to iLovePDF compression guidance before upload.
- The admin still explicitly saves the documents section before the collection PATCH persists the new document list.
- Existing manual URL editing remains available.
- Upload errors are shown in the documents section without mutating unrelated sections.

## Current Gaps

- `components/admin/admin-collection-documents-editor.tsx` has no file input or dropzone.
- New document rows are created only through `createEmptyAdminCollectionDocumentDraft`.
- The document editor does not call `uploadAssetFileViaClientBlob`.
- The editor has no local upload state for in-progress or failed uploads.

## Acceptance Mapping

1. The documents editor renders a drag-and-drop/upload control with a mobile-safe touch target.
2. Dropping or selecting files uploads them through the canonical admin upload client.
3. `application/pdf` uploads map to the `brochure` category by default; other supported document uploads map to `other` unless later categorized manually.
4. Uploaded rows receive `source: "upload"`, `url`, `fileName`, `mimeType`, and `fileRefId`.
5. Upload failures keep existing drafts intact and show an actionable section-level message.
6. Saving remains section-scoped through the existing `PATCH /api/admin/collections/[id]` documents contract.
7. The upload affordance includes the canonical 10 MB document limit and iLovePDF hint.
8. Targeted tests cover the document upload draft mapping and the rendered upload affordance.
