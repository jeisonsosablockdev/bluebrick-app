---
type: Feature Spec
title: Feature App Image Storage Blob Pinata
description: Feature App Image Storage Blob Pinata - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-image-storage-blob-pinata.md
---

# Feature Note: Image Upload Storage Migration (GCS -> Vercel Blob)

## Date
2026-04-06

## Scope
- App upload flow for admin assets.
- Keep Pinata integration for metadata/image pinning.
- Replace direct GCS signed upload dependency with Vercel Blob-backed upload.

## What Changed
- `lib/asset-uploads/gcs.ts` now uses Vercel Blob SDK under the same public API used by existing routes.
- Added authenticated Vercel Blob client-upload endpoint:
  - `POST /api/admin/assets/uploads/client-upload`
  - Validates admin auth, upload contract ownership, object key, content type, exact size limit, expiration, and finalized state before issuing a Blob client token.
- `POST /api/admin/assets/uploads/signed-url` now creates the upload contract and returns the `clientUploadUrl` used by `@vercel/blob/client`.
- `POST /api/admin/assets/uploads/[uploadId]/finalize` now validates object existence/metadata from Blob and persists Blob URL as `cdnUrl`.

## Environment Variables
- Required for new upload flow:
  - `BLOB_READ_WRITE_TOKEN`
- Optional:
  - `BLOB_STORE_ID`
  - `BLOB_CDN_BASE_URL`
- Pinata remains unchanged:
  - `PINATA_JWT`
  - `PINATA_GATEWAY_BASE_URL`

## Compatibility Notes
- Current frontend upload client contract is `signed-url` contract creation -> Vercel Blob client upload -> `finalize`.
- File bytes must not pass through app Functions; this avoids Vercel Function `413` payload failures while keeping app-level policy and finalize validation.
- Legacy GCS env vars are kept as compatibility placeholders in `.env.example`, but are no longer required for the Blob path.
