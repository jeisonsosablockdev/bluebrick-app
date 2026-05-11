# Feature Note: Image Upload Storage Migration (GCS -> Vercel Blob)

## Date
2026-04-06

## Scope
- App upload flow for admin assets.
- Keep Pinata integration for metadata/image pinning.
- Replace direct GCS signed upload dependency with Vercel Blob-backed upload.

## What Changed
- `lib/asset-uploads/gcs.ts` now uses Vercel Blob SDK under the same public API used by existing routes.
- Added internal upload endpoint:
  - `PUT /api/admin/assets/uploads/[uploadId]/binary`
  - Validates admin auth, upload contract, content type, size, and MD5 before writing to Blob.
- `POST /api/admin/assets/uploads/signed-url` now returns an internal `uploadUrl` to preserve current frontend flow.
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
- Existing frontend upload client contract remains intact (`signed-url` -> `PUT uploadUrl` -> `finalize`).
- Legacy GCS env vars are kept as compatibility placeholders in `.env.example`, but are no longer required for the Blob path.
