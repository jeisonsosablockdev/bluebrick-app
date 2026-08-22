# Solution Spec: Admin Distributions UX/UI Fixes & Enhancements (BRI-8)

## 1. 4-Layer Architecture Alignment
- **Layer 1 — Presentation**:
  - `apps/web/src/features/admin/presentation/project-selector-card.tsx`: Visual preview card displaying project thumbnail, title, property ID, and on-chain Notary PDA status badge.
  - `apps/web/src/features/admin/presentation/create-distribution-modal.tsx`: Interactive distribution modal updated with project select dropdown and auto-populated on-chain dates.
  - `apps/web/src/features/admin/presentation/admin-collection-notary-dates-panel.tsx`: On-chain notary dates reference card and date change request modal on `/admin/collections/[id]`.
  - `apps/web/src/features/admin/presentation/treasury-console.tsx`: Treasury console updated with Next.js 16 App Router best practices, dynamic real proposal integration, and comprehensive in-code commentary.
- **Layer 2 — Application / API**:
  - `apps/web/src/features/admin/application/use-admin-project-selector.ts`: Hook loading marketplace collections and resolving on-chain Notary dates.
  - `apps/web/src/app/api/admin/collections/[id]/date-change-request/route.ts`: Endpoint creating and querying auditable date change requests (`PENDING_MULTISIG`).
  - `apps/web/src/app/api/admin/treasury/summary/route.ts`: Endpoint providing real active distribution runs and pending multisig proposals for treasury inspection.
- **Layer 3 — Domain**:
  - `apps/web/src/features/admin/domain/project-distribution-view-model.ts`: Pure domain model merging marketplace entity and on-chain notary dates into a distribution candidate item.
- **Layer 4 — Infrastructure**:
  - `apps/web/src/app/api/admin/collections/route.ts`: Endpoint providing `AdminCollectionReadModel[]`.
  - `apps/web/src/features/admin/infrastructure/date-change-proposal-store.ts`: Server-side store persisting pending date change proposals across page reloads.
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

### `SPEC-05: On-Chain Notary Dates Panel & Change Request Modal in Collection Detail` [COMPLETED]
- Implemented `AdminCollectionNotaryDatesPanel`, date picker (Year/Month/Day), 10s auto-close timer, 3-state pending banner, and server proposal store.

### `SPEC-06: Clean Code Audit & Monorepo Validation (refactor-clean)` [COMPLETED]
- Monorepo clean code pass and develop sync.

### `SPEC-07: Dynamic Treasury Console Integration with Real Proposals & Next.js 16 Best Practices` [ACTIVE]
- **TDD Contract**: Component & unit tests in `tests/features/admin/treasury-console.test.tsx` verifying dynamic proposal loading, real active runs, and Next.js 16 compatibility.
- **Implementation**:
  - `apps/web/src/app/api/admin/treasury/summary/route.ts`: Dynamic API endpoint returning real active runs, pending date proposals, and treasury movements.
  - `apps/web/src/features/admin/presentation/treasury-console.tsx`: Updated Treasury console adhering to Next.js 16 App Router best practices, SSR-friendly data structures, real proposal inspection cards, and mandatory in-code commentary.
  - `apps/web/src/app/admin/treasury/page.tsx`: Server component with proper async metadata and Suspense boundaries.

### `SPEC-08: Final Clean Code Audit & Monorepo Validation (refactor-clean)`
- Final validation pass, English commentary audit, and 100% `pnpm validate` verification.

## 3. Verification Plan
- `pnpm test` (all unit, hook, and component tests passing green).
- `pnpm typecheck`
- `pnpm validate:architecture`
- `pnpm test:harness`
