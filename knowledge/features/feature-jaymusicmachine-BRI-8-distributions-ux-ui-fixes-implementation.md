# Solution Spec: Admin Distributions UX/UI Fixes & Enhancements (BRI-8)

## 1. 4-Layer Architecture Alignment
- **Layer 1 — Presentation**:
  - `apps/web/src/features/admin/presentation/project-selector-card.tsx`: Visual preview card displaying project thumbnail, title, property ID, and on-chain Notary PDA status badge.
  - `apps/web/src/features/admin/presentation/create-distribution-modal.tsx`: Interactive distribution modal updated with project select dropdown and auto-populated on-chain dates.
- **Layer 2 — Application**:
  - `apps/web/src/features/admin/application/use-admin-project-selector.ts`: Hook loading marketplace collections and resolving on-chain Notary dates.
- **Layer 3 — Domain**:
  - `apps/web/src/features/admin/domain/project-distribution-view-model.ts`: Pure domain model merging marketplace entity and on-chain notary dates into a distribution candidate item.
- **Layer 4 — Infrastructure**:
  - `apps/web/src/app/api/admin/collections/route.ts`: Existing endpoint providing `AdminCollectionReadModel[]`.
  - `apps/web/src/lib/solana-kit/pda/project-config-reader.ts`: Solana RPC Notary PDA reader.

## 2. Multi-SPEC Decomposition Plan (Logic & UI Separation with Strict TDD)

### `SPEC-01: Logic & Application Resolver (Domain & Application Layers)`
- **TDD Contract**: Write unit tests in `tests/features/admin/project-distribution-view-model.test.ts` and `tests/features/admin/use-admin-project-selector.test.ts` (RED phase).
- **Implementation**:
  - Pure domain mapper `apps/web/src/features/admin/domain/project-distribution-view-model.ts`.
  - Application hook `apps/web/src/features/admin/application/use-admin-project-selector.ts` loading collections, deriving PDA, and mapping dates.

### `SPEC-02: Presentation Atom — Visual Project Card & Thumbnail (Presentation Layer)`
- **TDD Contract**: Component tests in `tests/features/admin/project-selector-card.test.tsx` verifying thumbnail image rendering, fallback placeholder, title, location, and on-chain Notary badge (RED phase).
- **Implementation**:
  - `apps/web/src/features/admin/presentation/project-selector-card.tsx`.

### `SPEC-03: Modal Container & Auto-Filled Distribution Flow (Presentation Layer)`
- **TDD Contract**: Integration tests in `tests/features/admin/create-distribution-modal.test.tsx` verifying selection change, auto-filling period dates from on-chain Notary PDA, and form submission (RED phase).
- **Implementation**:
  - Update `apps/web/src/features/admin/presentation/create-distribution-modal.tsx`.

### `SPEC-04: Clean Code Audit & Refactoring (refactor-clean)`
- **Scope**:
  - Explicit Clean Code audit, concise English in-code commentary (`What:` and `How:`).
  - 100% monorepo validation pass (`pnpm validate`).

## 3. Verification Plan
- `pnpm test` (all unit, hook, and component tests passing green).
- `pnpm typecheck`
- `pnpm validate:architecture`
- `pnpm test:harness`
