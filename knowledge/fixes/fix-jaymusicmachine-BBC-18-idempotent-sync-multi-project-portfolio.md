# Problem Spec: idempotent-sync-multi-project-portfolio

## What problem exists
Investors associated with multiple active real estate projects in the BlueBrick ecosystem (such as `pazosjp@gmail.com` / `INV-010`, who participates in both `BG-01` **BUSH GARDEN** and `BK-02` **BROOKSVILLE**) only see one project displayed on their investor dashboard.

This issue stems from two interconnected root causes across persistence and synchronization:
1. **Repository Resolution Bypass**: In [`investment-repository.ts`](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/apps/web/src/lib/infrastructure/db/repositories/investment-repository.ts), when a user has a legacy record in the `clients` table (with `contract_amount`), the query condition `hasDashboardInvestment && !hasClientContract` evaluates to `false`. The repository falls back into legacy mode, reading `metadata.allInvestments`, which contains a stale single-item JSON snapshot, discarding the real relational investments returned from `dashboard_investments`.
2. **Lack of Idempotent Pruning in Ingestion Service**: In [`dashboard-sync-service.ts`](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/apps/web/src/features/ai-ingestion/application/services/dashboard-sync-service.ts), while `syncOpportunities` performs orphan deletion, the methods syncing operational tables (`dashboard_investments`, `dashboard_projects`, `dashboard_project_phases`, `dashboard_investor_summaries`, `dashboard_reinvestment_transactions`, `dashboard_investors`) rely solely on `ON CONFLICT DO UPDATE` without pruning stale or deleted records. When investments, phases, or projects are reallocated or removed in the Excel source of truth, stale entries remain permanently in Neon PostgreSQL.

## Why it matters
- **Financial Transparency & Trust**: Real estate investors must have 100% accurate, real-time visibility into every property asset they have invested in.
- **Idempotency & Data Hygiene**: Synchronizing the Google Sheet dashboard to PostgreSQL must be strictly idempotent and authoritative; deleted, modified, or reallocated rows in the workbook must not leave phantom rows in the relational database.

## What outcome is expected
1. `InvestmentRepository.getPortfolioSummary` resolves all active investments from `dashboard_investments` whenever present, ensuring multi-project investors (including `pazosjp@gmail.com` with `BUSH GARDEN` and `BROOKSVILLE`) see their full portfolio.
2. `DashboardSyncService` performs atomic, idempotent upserting and orphan pruning across operational relational tables (`dashboard_investments`, `dashboard_investors`, `dashboard_projects`, `dashboard_project_phases`, `dashboard_investor_summaries`, `dashboard_reinvestment_transactions`) inside the database transaction boundary.
3. Legacy `clients.metadata.allInvestments` is properly relegated to a secondary fallback when no dashboard investments exist.
4. Comprehensive automated unit and integration tests validate multi-project resolution, metric aggregation (weighted ROI, total invested), and idempotent sync pruning.

## What gaps exist today
- `investment-repository.ts` treats `clients.contract_amount` as a disqualifier for using `dashboard_investments`.
- `dashboard-sync-service.ts` lacks atomic scope-aware deletion/pruning for non-opportunity tables during workbook sync.

## What questions remain open
- None; the requirements and technical design are fully specified.
