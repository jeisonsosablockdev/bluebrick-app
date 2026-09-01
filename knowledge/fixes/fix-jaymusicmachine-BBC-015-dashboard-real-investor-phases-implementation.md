# Solution Spec: dashboard-real-investor-phases Implementation (BBC-015)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend` & `db`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`

## 2. Solution Overview & 4-Layer Architecture

### Layer 1: Presentation
- **`apps/web/src/components/dashboard/project-phase-progress.tsx`**:
  - Incorpora `useEffect` reactivo vinculado a `[defaultActiveIndex, property.id, property.propertyId]` para re-sincronizar el hito seleccionado al navegar entre tarjetas en el carrusel.
  - Vincula la anchura animada de la barra de progreso directamente al valor `completionPercentage%` proveniente de la tabla (`phaseProgressPct`), desacoplándola de la selección manual de hitos.
  - Asegura que los hitos reflejen estrictamente el estado del hito en la base de datos (`Completada` = verde esmeralda con check, `En curso` = carmesí con pulso activo, `Pendiente` = gris neutro).
- **`apps/web/src/app/dashboard/page.tsx`**:
  - Mantiene el fallback intacto para `user_sofia_martinez` como perfil de demo.
  - Permite la resolución de usuarios reales autenticados mediante `getAuthenticatedInvestor` o parámetro de consulta opcional `searchParams.email`, reflejando su nombre real e inversiones de Florida.

### Layer 2: Application
- **`apps/web/src/lib/types/db.ts`**:
  - Tipos existentes de `PortfolioItem`, `ProjectPhase`, `DbDashboardInvestment` y `DbDashboardInvestor` reutilizados sin regresiones.

### Layer 3: Domain
- **`apps/web/src/features/ai-ingestion/domain/schemas/canonical-dashboard-schema.ts`**:
  - Mantiene las reglas de validación canónica de fases y porcentajes de avance de obra.

### Layer 4: Infrastructure
- **`apps/web/src/lib/infrastructure/db/repositories/investment-repository.ts`**:
  - Actualiza `getPortfolioSummary(userEmailOrId, fallbackUserId)` para consultar prioritariamente las tablas `dashboard_investors` y `dashboard_investments` cuando se provee un email de inversionista real.
  - Transforma las filas de `dashboard_investments` a `PortfolioItem[]` preservando los campos `currentPhase`, `phaseProgressPct`, `id_inversion` y monto invertido.
  - Ejecuta `enrichItemsWithProjectPhases()` para vincular las 14 fases de obra de `dashboard_project_phases`.
  - Mantiene fallback a `clients` y fallback secundario a `user_investments` (Sofia Martinez) si el usuario no es un inversionista real registrado en el dashboard.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: TDD RED y Refactor de `InvestmentRepository` para consultar prioritariamente `dashboard_investors` y `dashboard_investments`, y enriquecer las fases de obra para inversionistas reales.
- **SPEC-2**: TDD RED y Refactor de `ProjectPhaseProgress` para sincronizar reactivamente con el carrusel y vincular la barra al porcentaje real de avance de obra de la tabla.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `tests/unit/real-investor-portfolio-resolution.test.ts`
  - Valida que al consultar por el email de un inversionista real (ej. `pacogarzonn@hotmail.com` o `jeisonjsosar@gmail.com`), se obtienen las inversiones de `dashboard_investments` con sus 14 fases y `phaseProgressPct` real.
  - Valida que para `sofia.martinez@bluebrick.investments` se preserva el fallback de demo.
- **Test File Path**: `tests/unit/project-phase-progress.test.tsx`
  - Valida que al cambiar las propiedades de entrada, el estado de la fase activa se actualiza automáticamente.
  - Valida que el ancho de la barra refleja el `phaseProgressPct` provisto.
- **Command**: `pnpm test`

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas de regresión pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] La documentación de arquitectura local y de base de datos está actualizada.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [fix-jaymusicmachine-BBC-015-dashboard-real-investor-phases.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/fixes/fix-jaymusicmachine-BBC-015-dashboard-real-investor-phases.md)
- **Solution Spec**: [fix-jaymusicmachine-BBC-015-dashboard-real-investor-phases-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/fixes/fix-jaymusicmachine-BBC-015-dashboard-real-investor-phases-implementation.md)
- **Issue Reference**: BBC-015
