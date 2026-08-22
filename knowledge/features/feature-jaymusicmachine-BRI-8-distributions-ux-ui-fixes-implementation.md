# Solution Spec: Admin Distributions UX/UI Fixes & Enhancements (BRI-8)

## 1. 4-Layer Architecture Alignment
- **Layer 1 — Presentation**:
  - `apps/web/src/features/admin/presentation/project-selector-card.tsx`: Visual preview card displaying project thumbnail, title, property ID, and on-chain Notary PDA status badge.
  - `apps/web/src/features/admin/presentation/create-distribution-modal.tsx`: Interactive distribution modal updated with project select dropdown and auto-populated on-chain dates.
  - `apps/web/src/features/admin/presentation/admin-collection-notary-dates-panel.tsx`: On-chain notary dates reference card and date change request modal on `/admin/collections/[id]`.
- **Layer 2 — Application**:
  - `apps/web/src/features/admin/application/use-admin-project-selector.ts`: Hook loading marketplace collections and resolving on-chain Notary dates.
  - `apps/web/src/app/api/admin/collections/[id]/date-change-request/route.ts`: Existing endpoint creating auditable date change request (`PENDING_MULTISIG`).
- **Layer 3 — Domain**:
  - `apps/web/src/features/admin/domain/project-distribution-view-model.ts`: Pure domain model merging marketplace entity and on-chain notary dates into a distribution candidate item.
- **Layer 4 — Infrastructure**:
  - `apps/web/src/app/api/admin/collections/route.ts`: Existing endpoint providing `AdminCollectionReadModel[]`.
  - `apps/web/src/lib/solana-kit/pda/project-config-reader.ts`: Solana RPC Notary PDA reader.

## 2. Multi-SPEC Decomposition Plan (Logic & UI Separation with Strict TDD)

### `SPEC-01: Logic & Application Resolver (Domain & Application Layers)` [COMPLETED]
- Pure domain mapper `project-distribution-view-model.ts` and hook `use-admin-project-selector.ts`.

### `SPEC-02: Presentation Atom — Visual Project Card & Thumbnail (Presentation Layer)` [COMPLETED]
- Component `project-selector-card.tsx` with thumbnail and on-chain notary badges.

### `SPEC-03: Modal Container & Auto-Filled Distribution Flow (Presentation Layer)` [COMPLETED]
- Integrated `create-distribution-modal.tsx` with project selection and auto-populated dates.

### `SPEC-04: Clean Code Audit & Refactoring (refactor-clean)` [COMPLETED]
- Refactored and validated initial distribution modal enhancements.

### `SPEC-05: On-Chain Notary Dates Panel & Change Request Modal in Collection Detail` [ACTIVE]
- **TDD Contract**: Component tests in `tests/features/admin/admin-collection-notary-dates-panel.test.tsx` verifying RPC notary date display, version counter, and proposal dispatch via `POST /api/admin/collections/[id]/date-change-request`.
- **Implementation**:
  - `apps/web/src/features/admin/presentation/admin-collection-notary-dates-panel.tsx`: Visual panel showing on-chain notarized dates (`start_at` ➔ `end_at`), version badge (`v1`), Squads Vault governance label, and "Solicitar Cambio de Fechas" modal.
  - Integrated into `apps/web/src/features/admin/presentation/admin-collection-detail-shell.tsx`.

### `SPEC-06: Final Clean Code Audit & Monorepo Validation (refactor-clean)`
- Final validation pass, English commentary audit, and 100% `pnpm validate` verification.

## 3. Verification Plan
- `pnpm test` (all unit, hook, and component tests passing green).
- `pnpm typecheck`
- `pnpm validate:architecture`
- `pnpm test:harness`
