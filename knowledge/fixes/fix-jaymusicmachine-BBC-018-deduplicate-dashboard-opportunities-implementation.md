# Solution Spec: deduplicate-dashboard-opportunities Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `api` & `db`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security` (validación de inyecciones SQL y parámetros seguros)

## 2. Solution Overview & 4-Layer Architecture
La solución implementa una estrategia de **Defensa en Profundidad (Defense in Depth)** minimalista, aplicando las observaciones de Ponytail Review:

### Capa 2: Aplicación (`apps/web/src/features/ai-ingestion/application/services/dashboard-sync-service.ts`)
- Durante el ciclo de sincronización atómica (`BEGIN` ... `COMMIT`), tras parsear `workbookData.oportunidades`:
  - Se extraen directamente los IDs activos de la hoja usando `resolveOpportunityId`: `const activeOppIds = workbookData.oportunidades.map(resolveOpportunityId);` (con fallback determinista en caso de ID no explícito).
  - Si existen oportunidades activas (`activeOppIds.length > 0`), se ejecutan podas transaccionales parametrizadas:
    1. `DELETE FROM dashboard_opportunities WHERE id_oportunidad != ALL($1::varchar[])`
    2. `DELETE FROM reinvestment_opportunities WHERE id != ALL($1::varchar[])`
  - Esto garantiza que cambios de ID o eliminaciones de filas en Google Drive remuevan de inmediato los registros obsoletos en Neon PostgreSQL sin requerir scripts manuales.

### Capa 4: Infraestructura / Repositorio (`apps/web/src/lib/infrastructure/db/repositories/investment-repository.ts`)
- En el método `getReinvestmentOpportunities()`:
  - Se delega la deduplicación nativa al motor PostgreSQL mediante `DISTINCT ON (LOWER(TRIM(title)))` ordenado por `created_at DESC`.
  - Cero líneas de lógica manual de filtrado o agrupación JS/TS en memoria.
  - La base de datos garantiza entregar exactamente 1 registro por propiedad (el más reciente).

## 3. Atomic Slices & Logical Sequence
- **SPEC-1 (Ingestion Stale Opportunities Pruning & Native DB Deduplication)**:
  - Actualizar `DashboardSyncService` con la poda atómica de oportunidades huérfanas en `dashboard_opportunities` y `reinvestment_opportunities`.
  - Actualizar la consulta SQL en `InvestmentRepository.getReinvestmentOpportunities()` con `DISTINCT ON (LOWER(TRIM(title)))`.
  - Diseñar suite de pruebas unitarias en fallo (RED) con `tdd-primal` y llevarlas a verde (GREEN).
  - Auditoría Gate 2 con `code-refactoring-refactor-clean` y validación completa con `pnpm validate`.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Paths**:
  - `tests/unit/dashboard-sync-service.test.ts`: Verificar que `DashboardSyncService.executeSync()` emite las consultas `DELETE ... != ALL(...)` tanto para `dashboard_opportunities` como para `reinvestment_opportunities`.
  - `tests/unit/reinvestment-opportunities-resolution.test.ts`: Verificar que `InvestmentRepository.getReinvestmentOpportunities()` ejecuta `DISTINCT ON` y retorna exactamente 1 oportunidad por título.
- **Command**: `pnpm test tests/unit/dashboard-sync-service.test.ts tests/unit/reinvestment-opportunities-resolution.test.ts`
- **Assertion Goals**:
  - Poda transaccional verificada en el mock del pool de la base de datos de ingesta.
  - Consulta con deduplicación nativa verificada en el repositorio de inversiones.

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas de regresión pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] La ejecución de `pnpm sync:dashboard` poda de forma atómica los registros huérfanos `opp_mb_05` y `MB-05` de Neon PostgreSQL.
- [ ] La UI móvil y web renderiza exactamente 1 tarjeta para `MULBERRY`.
- [ ] Aprobación explícita del humano registrada antes de merge.

## 6. Spec Artifact Traceability
- **Problem Spec**: [fix-jaymusicmachine-BBC-018-deduplicate-dashboard-opportunities.md](knowledge/fixes/fix-jaymusicmachine-BBC-018-deduplicate-dashboard-opportunities.md)
- **Solution Spec**: [fix-jaymusicmachine-BBC-018-deduplicate-dashboard-opportunities-implementation.md](knowledge/fixes/fix-jaymusicmachine-BBC-018-deduplicate-dashboard-opportunities-implementation.md)
- **Linear Issue**: [Linear Ticket #BBC-018](https://linear.app/brids-app/issue/BBC-018)
