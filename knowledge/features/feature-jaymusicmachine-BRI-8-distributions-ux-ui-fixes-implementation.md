# Solution Spec: Admin Distributions UX/UI Fixes & Enhancements (BRI-8)

## 1. 4-Layer Architecture Alignment
- **Layer 1 — Presentation**:
  - `apps/web/src/features/admin/presentation/create-distribution-modal.tsx`: Update to integrate project selector with thumbnails, metadata summary, and auto-populated addresses.
  - `apps/web/src/features/admin/presentation/distributions-console.tsx`: Pass or fetch available collection options from `/api/admin/collections`.
- **Layer 2 — Application**:
  - `apps/web/src/features/admin/application/use-admin-collections.ts`: Hook for loading active marketplace collections.
- **Layer 3 — Domain**:
  - Unchanged (validates `DistributionRun` creation payload).
- **Layer 4 — Infrastructure**:
  - `apps/web/src/app/api/admin/collections/route.ts`: Existing endpoint providing `AdminCollectionReadModel[]`.

## 2. Multi-SPEC Decomposition Plan
- **`SPEC-01: TDD & Project Selector with Thumbnails in CreateDistributionModal`**:
  - Write unit/integration tests verifying project selection, thumbnail rendering, and auto-population of `collectionAddress` and `propertyId`.
  - Implement project dropdown selector with cover image thumbnail, title, and property ID in `CreateDistributionModal`.
- **`SPEC-02: Clean Code Audit & Refactoring`**:
  - Verify concise English commentary, zero dead code, and full validation pass.

## 3. Verification Plan
- Unit & component tests in `tests/features/admin/create-distribution-modal.test.tsx`.
- `pnpm typecheck`
- `pnpm validate:architecture`
- `pnpm test:harness`
