# Solution Spec: idempotent-sync-multi-project-portfolio Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `db` / `api`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`

## 2. Solution Overview & 4-Layer Architecture
- **Layer 1: Presentation Layer** (`apps/web/src/components/dashboard`):
  - Consumes the portfolio items and metrics resolved by the application and infrastructure layer. Displays multi-project portfolio cards (`BUSH GARDEN`, `BROOKSVILLE`, etc.) dynamically.
- **Layer 2: Application / Ingestion Layer** (`apps/web/src/features/ai-ingestion/application/services/dashboard-sync-service.ts`):
  - Extends `DashboardSyncService` to execute transaction-scoped idempotent pruning across all operational tables (`dashboard_investments`, `dashboard_projects`, `dashboard_project_phases`, `dashboard_investor_summaries`, `dashboard_reinvestment_transactions`, and `dashboard_investors`).
  - Guarantees that any record deleted or reallocated in the Google Sheet is pruned from PostgreSQL inside the atomic transaction block (`BEGIN` ... `COMMIT`).
- **Layer 3: Domain Layer** (`apps/web/src/features/ai-ingestion/domain`):
  - Maintains domain models and schemas for canonical dashboard entities without leaking database specifics.
- **Layer 4: Infrastructure Layer** (`apps/web/src/lib/infrastructure/db/repositories/investment-repository.ts`):
  - Refactors `InvestmentRepository.getPortfolioSummary` so that any rows found in `dashboard_investments` are prioritized as the authoritative portfolio items, regardless of whether a row exists in `clients`.
  - Fixes the condition `hasDashboardInvestment && !hasClientContract` to directly evaluate whether active dashboard investment rows exist.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: Multi-Project Portfolio Resolution in `InvestmentRepository` (Branch: `SPEC/jaymusicmachine-BBC-18-s01-multi-project-portfolio-resolution`)
  - Red: Write unit test in `tests/unit/real-investor-portfolio-resolution.test.ts` checking that an investor with both `clients` contract and multiple `dashboard_investments` (like `pazosjp@gmail.com`) resolves all projects (`BUSH GARDEN` and `BROOKSVILLE`).
  - Green: Update `InvestmentRepository.getPortfolioSummary` to map all `dashboard_investments` rows when present.
  - Refactor: Code refactoring audit for clean code and layer annotations.
- **SPEC-2**: Idempotent Ingestion and Stale Record Pruning in `DashboardSyncService` (Branch: `SPEC/jaymusicmachine-BBC-18-s02-idempotent-sync-pruning`)
  - Red: Write unit/integration tests in `tests/unit/dashboard-sync-pruning.test.ts` validating that stale investments, phases, summaries, and projects are deleted atomically during workbook synchronization.
  - Green: Implement scoped transaction pruning in `DashboardSyncService` for all 7 sheets.
  - Refactor: Clean-code audit and `pnpm validate` verification.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `tests/unit/real-investor-portfolio-resolution.test.ts` & `tests/unit/dashboard-sync-pruning.test.ts`
- **Command**: `pnpm vitest run tests/unit/real-investor-portfolio-resolution.test.ts tests/unit/dashboard-sync-pruning.test.ts`
- **Assertion Goals**:
  - `pazosjp@gmail.com` resolves 2 portfolio items (`BUSH GARDEN`, `BROOKSVILLE`) with accurate total invested ($19,860.00) and weighted ROI.
  - `DashboardSyncService` successfully executes `DELETE WHERE id != ALL(...)` for obsolete investments, phases, summaries, and projects inside the transactional client.

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas de regresión pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] La documentación de arquitectura local y de base de datos está actualizada.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [fix-jaymusicmachine-BBC-18-idempotent-sync-multi-project-portfolio.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/fixes/fix-jaymusicmachine-BBC-18-idempotent-sync-multi-project-portfolio.md)
- **Solution Spec**: [fix-jaymusicmachine-BBC-18-idempotent-sync-multi-project-portfolio-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/fixes/fix-jaymusicmachine-BBC-18-idempotent-sync-multi-project-portfolio-implementation.md)
- **Linear Issue**: [Linear Ticket #BBC-18](https://linear.app/brids-app/issue/BBC-18)
