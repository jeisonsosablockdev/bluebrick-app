# Solution Spec: digest-implementation-fixes Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `db` (for DB issues) and `api` / `ai-architect` (for digest pipeline issues)
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security` (where applicable)

## 2. Solution Overview & 4-Layer Architecture
1. **Presentation Layer**: 
   - `apps/web/src/app/dashboard/page.tsx`: Server Component that passes user email as the primary lookup parameter to `InvestmentRepository` and renders the real portfolio data abstracted from Excel.
2. **Application/Consumption Layer**: 
   - Ensure DTO projections and portfolio calculations accurately handle client records from the Excel ingestion pipeline (`clients` table).
3. **Domain/Pipelines/Services Layer**: 
   - Map `clients` records (project, city, ROI, contractAmount) to `PortfolioItem` domain contracts.
4. **Infrastructure Layer**: 
   - `apps/web/src/lib/infrastructure/db/repositories/investment-repository.ts`: Update `getPortfolioSummary` so that `clients` is the primary source of truth by user email. If no client record is found (or no email is provided), fall back to `user_investments` (demo portfolio).

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: Fix Database Name Resolution and WorkOS Middleware Session Handling in `UserRepository` & `DashboardPage` (Rama: `SPEC/jeisonsosa-BBC-008-s01-fix-login-db`)
- **SPEC-2**: Remove Solana Wallet Adapters and Clean Up Presentation / Hook Dependencies (Rama: `SPEC/jeisonsosa-BBC-008-s02-remove-solana-adapters`)
- **SPEC-3**: Migrate `middleware.ts` to `proxy.ts` conforming to Next.js 16 conventions (Rama: `SPEC/jeisonsosa-BBC-008-s03-migrate-middleware-to-proxy`)
- **SPEC-4**: Connect Ingested Excel Clients to Dashboard Portfolio Resolution (Rama: `SPEC/jeisonsosa-BBC-008-s04-connect-clients-ingestion-to-dashboard`)

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `tests/unit/client-portfolio-resolution.test.ts`
- **Command**: `pnpm test`
- **Assertion Goals**: Verify `InvestmentRepository.getPortfolioSummary` prioritizes the `clients` table by email (e.g. `jeisonjsosar@gmail.com` -> `$50,000 USD`, `CARROLLWOOD`, `15.0% ROI`, `TAMPA`). Verify that if email is missing or not found in `clients`, it falls back cleanly to `user_investments`.

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas de regresión pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] La documentación de arquitectura local y de base de datos está actualizada.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [fix-jeisonsosa-BBC-008-digest-implementation-fixes.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/fixes/fix-jeisonsosa-BBC-008-digest-implementation-fixes.md)
- **Solution Spec**: [fix-jeisonsosa-BBC-008-digest-implementation-fixes-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/fixes/fix-jeisonsosa-BBC-008-digest-implementation-fixes-implementation.md)
- **Linear Issue**: Omitido por solicitud (BBC-008)
