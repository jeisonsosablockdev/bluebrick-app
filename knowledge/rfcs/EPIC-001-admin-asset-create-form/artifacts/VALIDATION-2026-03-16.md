# EPIC-001 Validation Evidence (2026-03-16)

## Run Metadata
- Date (UTC): `2026-03-16T14:49:26.687Z`
- Environment: `staging-local` (Next.js en `http://127.0.0.1:3001`)
- Cloud project: `metaplex-nft-dev`
- GCS bucket: `metaplex-nft-dev-admin-assets-1773651938`
- URL Map (Cloud CDN): `metaplex-admin-assets-map`
- Backend Bucket (Cloud CDN): `metaplex-admin-assets-bb`
- Full artifact JSON: `knowledge/rfcs/EPIC-001-admin-asset-create-form/artifacts/latest-validation.json`

## 1) Signed URL + Finalize (Real Upload)
- `POST /api/admin/assets/uploads/signed-url` => `200`
- Real `PUT` to signed GCS URL => `200`
- `POST /api/admin/assets/uploads/:uploadId/finalize` => `200`
- Evidence:
  - First upload `uploadId`: `b8cf643d-5d17-4b4f-85ef-e2409e29219f`
  - First `fileRefId`: `e97ecba1-8ae4-4281-a3f9-fdd60b7f9d0d`

## 2) Replace + CDN Invalidation
- Second finalize with `previousCdnUrl` => `200`
- Response contains: `cdnInvalidationStatus: success`
- Invalidated path recorded:
  - `/metaplex-nft-dev-admin-assets-1773651938/admin-assets/galleryImage/fa3abe34-43a2-4f03-a189-6f94077a5b5a/20260316144913-429d8749-validation-1-8i61rf4yyqvi.png`

### Cloud CDN operation confirmation
- `operation-1773672560083-64d2552e44147-0b4fb362-d16fd746` => `status: DONE`
- `operation-1773672561491-64d2552f9bd26-66530611-deb3215d` => `status: DONE`

## 3) Manual Purge Fallback (RBAC)
- `POST /api/admin/cdn/purge` => `200`
- Response:
  - `status: success`
  - `providerRequestId: aa049478-58a9-4422-830f-7df5ec0e169a`

## 4) Orphan Lifecycle (Stateful)
- Dry-run request:
  - `POST /api/admin/assets/uploads/orphan-reconciler`
  - Payload: `{ dryRun: true, temporaryRetentionDays: 36500, abandonedRetentionDays: 36500 }`
- Dry-run result:
  - `candidates: 2`
  - `byReason.temporary: 1`
  - `byReason.abandoned: 1`
- Execute result:
  - `deleted: 2`

## 5) CSV Async Pipeline
- `POST /api/admin/assets/import-jobs` => `202`, state `queued`
- Worker processing => terminal state `completed_with_errors`
- Job status summary:
  - `totalRows: 2`
  - `processedRows: 2`
  - `failedRows: 1`
- `GET /api/admin/assets/import-jobs/:id/errors?limit=50` => `200`
- Error sample:
  - `code: EXIT_STRATEGY_INVALID`
  - `row: 2`
  - `column: buildingExitStrategy`

## 6) Open Items After Validation
- Responsive QA formal (320/375/768/1024) no quedó adjunta en este run.
- Validación dedicada de `retry -> DLQ` para import jobs sigue pendiente como cierre de STORY-001-03.

## 7) Follow-up (2026-03-26)
- Responsive QA formal y validación dedicada `retry -> failed -> DLQ` quedaron cerradas en:
  - `knowledge/rfcs/EPIC-001-admin-asset-create-form/artifacts/VALIDATION-2026-03-26.md`
- Nota de gobierno actual:
  - El gate adicional de validación fue retirado del cierre del epic por decisión de producto (2026-03-27).
