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

### `SPEC-07: Dynamic Treasury Console Integration with Real Proposals & Next.js 16 Best Practices` [COMPLETED]
- Implemented `GET /api/admin/treasury/summary` and `POST /api/admin/treasury/circuit-breaker`.
- Modernized `TreasuryConsole` and `AdminTreasuryPage` with Next.js 16 best practices, mandatory in-code commentary, and wallet modal auto-trigger.

### `SPEC-08: Dynamic Squads Multisig Console Integration & Zero Mock Data` [COMPLETED]
- **TDD Contract**: Component & unit tests in `tests/components/squads-multisig-console.test.ts` and `tests/features/admin/squads-multisig-console.test.tsx` verifying dynamic proposal loading, empty state rendering, real on-chain date comparison, and wallet vote integration without mock fixtures.
- **Layer 1 — Presentation**:
  - `apps/web/src/features/admin/presentation/squads-multisig-console.tsx`: Eliminated `DEFAULT_MOCK_PROPOSAL` and fake fallback public keys. Connected dynamic fetcher to live runs/proposals API (`/api/admin/distributions/runs/[id]` and `/api/admin/treasury/squads/proposals`). Provided sober empty state and automatic wallet modal connection.
- **Layer 2 — Application / API**:
  - `apps/web/src/app/api/admin/treasury/squads/proposals/route.ts`: Endpoint returning real Squads v4 multisig proposals and active distribution run batches.
- **Layer 3 — Domain**:
  - `apps/web/src/features/admin/domain/squads-multisig-types.ts`: Pure domain entities (`SquadsProposalDTO`) and pure evaluators (`evaluateDateAuditWarning`, `evaluateQuorumStatus`, `evaluateUnifiedMultisigAction`).

### `SPEC-09: Real Solana Devnet On-Chain Voting & Notary Transaction Execution` [COMPLETED]
- **TDD Contract**: Unit and integration tests for transaction assembly, client-side Phantom wallet signing, Devnet RPC submission, and Solscan transaction link rendering in `tests/features/admin/squads-multisig-console.test.tsx` and `tests/lib/squads-vote-transaction.test.ts`.
- **Layer 4 — Infrastructure**:
  - `apps/web/src/lib/solana-kit/compat/squads-vote-transaction.ts`: Constructs `VersionedTransaction` for Solana Devnet with recent blockhash and PDA derivation.
- **Layer 2 — Application / API**:
  - `apps/web/src/app/api/admin/treasury/squads/prepare-vote/route.ts`: Prepares unsigned base64 `VersionedTransaction` with live Devnet blockhash.
  - `apps/web/src/app/api/admin/treasury/squads/vote/route.ts`: Receives signed transaction, broadcasts to Solana Devnet RPC via `sendRawTransaction`, confirms transaction on-chain, and records audit proof.
- **Layer 3 — Domain**:
  - `apps/web/src/features/admin/domain/squads-multisig-types.ts`: Typed domain definitions for on-chain transaction signatures, slot numbers, and Solscan URLs.
- **Layer 1 — Presentation**:
  - `apps/web/src/features/admin/presentation/squads-multisig-console.tsx`: Integrated with `signTransaction` from wallet adapter, triggering Phantom signature popup, Devnet gas payment, and rendering green success banner with direct Solscan Devnet transaction link.

### `SPEC-10: 100% Native Squads Protocol v4 Governance, Notary PDA CPI & On-Chain Proposal Tracking` [COMPLETED]
- **Elimination of Artificial Quorum Memos**: Completely removed legacy memo vote builders and migrated to 100% native `@sqds/multisig` (Squads Protocol v4) on Solana Devnet (`rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD`).
- **Atomic Proposal Creation**: In `/admin/collections/[id]` (`AdminCollectionNotaryDatesPanel`), proposing a date change compiles an atomic `VersionedTransaction` combining `vaultTransactionCreate` + `proposalCreate` with 0.10 USDC platform governance fee, signed cryptographically with Phantom/Solflare and broadcasted to Devnet.
- **Deterministic Proposal Hash & Real-Time Tracking**: Captured and persisted the on-chain Proposal PDA Hash (`squadsProposalPda`), Creation TX Hash (`txSignature`), and `transactionIndex`. Rendered direct Solscan Devnet links and a 1-click action button `[Ir a Votar en Consola Squads ➔]` in the collection pending banner.
- **Two-Phase Governance Execution**:
  1. `proposalApprove`: Members vote until reaching threshold (2/2), transitioning status from `Active` to `Approved`.
  2. `vaultTransactionExecute`: Prepares and executes the CPI from the Squads Vault (`D9i1XNft...`) directly to the Notary Program (`HLp7YXKZZ8uPuzwN3CtuDxtgYoWhc5Fb1FHj5bHEe9zE`), updating on-chain operating dates and transitioning status to `Executed`.
- **Interactive Multi-Proposal Switcher**: Modernized `SquadsMultisigConsole` (`/admin/treasury/squads`) with interactive tabs for all on-chain proposals, prioritizing active/approved proposals over past executed ones.
- **Strict Clean Code & Test Governance**: Audited and eliminated all forbidden `export` statements in test suites across `tests/`.

### `SPEC-11: Unified Anchor Program Architecture & On-Chain Notary PDA Upgrade` [COMPLETED]
- Canonical Program ID: `HLp7YXKZZ8uPuzwN3CtuDxtgYoWhc5Fb1FHj5bHEe9zE` on Solana Devnet.
- Integrated `initialize_project_config` and `update_project_dates` instructions into unified Anchor program with `settle_claim`, `seal_run`, and `initialize_policy`.
- Added 3-layer Squads Vault authentication and 134-byte Notary PDA on-chain account structure.
- Verified on Devnet with live CLI tooling (`scripts/solana-squads-notary-cli.ts`).

### `SPEC-12: Clean Code Audit, SOLID Refactoring & Canonical Documentation (refactor-clean)` [IN_PROGRESS]
- **SOLID & Clean Code Principles (`code-refactoring-refactor-clean`)**:
  - **Single Responsibility Principle (SRP)**: Extract long, multi-concern handlers (e.g. `handleProposalSubmit` and `handleUnifiedAction`) into dedicated, testable domain/application helpers.
  - **Explicit Abstraction & Meaningful Names**: Replace cryptic variables and inline type assertions with self-documenting, strongly-typed domain primitives.
  - **Zero Dead Code & Import Sanitization**: Clean up obsolete imports, test residue, leftover route files, and non-whitelisted artifacts.
- **Mandatory In-Code Commentary Governance**:
  - Verify that every `.ts`, `.tsx`, `.rs`, `.sql` file modified under BRI-8 includes:
    1. Layer Role Header comment (`Layer 1: Presentation`, `Layer 2: Application`, etc.).
    2. JSDoc/TSDoc blocks on all exported functions, types, and constants.
    3. Step-by-step logic indicators (`// Step N: ...`).
    4. Invariant and cryptographic security explanations (zero magic code).
- **Canonical Architecture Documentation**:
  - Write the canonical end-to-end integration manual for Squads Protocol v4 + Notary PDA in `knowledge/features/feature-jaymusicmachine-BRI-8-squads-notary-architecture.md`, detailing:
    - 2-Phase multisig lifecycle (`proposalCreate` -> `proposalApprove` -> `vaultTransactionExecute`).
    - Deterministic Proposal PDA derivation and Solscan Devnet audit traceability.
    - CPI execution directly to Anchor Notary Program (`HLp7YXKZZ8uPuzwN3CtuDxtgYoWhc5Fb1FHj5bHEe9zE`).
- **Full CI & Harness Verification**:
  - Run all unit tests, typechecks, architecture linters, and harness suites (`pnpm validate`) to guarantee 100% clean pass.

## 3. Verification Plan
- `pnpm test` (all unit, hook, and component tests passing green).
- `pnpm typecheck`
- `pnpm validate:architecture`
- `pnpm test:harness`
