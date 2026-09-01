# Solution Spec: Multi-Sheet Excel Dashboard Ingestion & Project Phases Sync (BBC-14)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `db` / `ai-architect` / `frontend`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security` (CSV / Formula Injection Sanitizer & Foreign Key Constraints)

## 2. Solution Overview & 4-Layer Architecture
La solución establece la sincronización relacional de todas las hojas del libro operativo `DASH-BOARD-Blue-Brick-Panel-Administracion.xlsx` hacia Neon PostgreSQL y su proyección fluida en la interfaz gráfica del Dashboard.

```mermaid
flowchart TD
    GExcel[Google Drive XLSX\nDASH-BOARD-Blue-Brick-Panel-Administracion] --> Parser[Layer 4: StreamingSpreadsheetAdapter\nMulti-Sheet Parser & Sanitizer]
    Parser --> Schemas[Layer 3: Canonical Dashboard Schemas\nZod Contracts]
    Schemas --> DB[(Layer 4: Neon PostgreSQL\nproperties, project_phases, reinvestment_opportunities)]
    DB --> Repo[Layer 4: InvestmentRepository\nTyped Queries & Phase Aggregation]
    Repo --> ServerPage[Layer 1: DashboardPage (RSC)\nServer-Side Data Resolution]
    ServerPage --> UI[Layer 1: ProjectPhaseProgress (Client)\nAnimated Milestone Stepper with Real Phases]
```

### Layer 1: Presentation (UI & Client-Side Rendering)
- `apps/web/src/components/dashboard/project-phase-progress.tsx`: Adaptado para recibir `phases?: ProjectPhase[]` dinámicas de la propiedad activa.
  - Si existen fases reales (ej. las 14 fases de Bush Garden), las renderiza dinámicamente con su orden, nombre, fotos de avance y porcentaje exacto (`57.14%`).
  - **Invariante solicitada por el usuario**: Si la propiedad **NO trae fases**, se renderiza como **completamente lleno (100% completado)**, mostrando la barra de progreso al 100% y los hitos en verde completado.
- `apps/web/src/components/dashboard/investment-dashboard.tsx`: Propaga la propiedad con su colección de fases al componente de progreso.
- `apps/web/src/app/dashboard/page.tsx`: Consulta y agrega las fases del proyecto en la resolución de cada `PortfolioItem`.

### Layer 2: Application / Consumption (Types & ViewModels)
- `apps/web/src/lib/types/db.ts`: Incorpora el contrato de datos `ProjectPhase`:
  ```ts
  export interface ProjectPhase {
    id: string;
    projectId: string;
    order: number;
    name: string;
    status: "Completada" | "En curso" | "Pendiente" | "No aplica";
    startDate?: string | null;
    endDate?: string | null;
    images: string[];
  }
  ```
  Extiende `PortfolioItem` con `currentPhase?: string`, `phaseProgressPct?: number`, `phases?: ProjectPhase[]`.
- `apps/web/src/features/ai-ingestion/domain/ports/spreadsheet-parser-port.ts`: Extiende el puerto para soportar extracción de entidades multi-hoja (`ParsedDashboardResult`).

### Layer 3: Domain / Pipelines / Contracts (Zod & Security Invariants)
- `apps/web/src/features/ai-ingestion/domain/schemas/canonical-dashboard-schema.ts`:
  - `CanonicalProjectPhaseSchema`: Valida `idFase`, `idInversion`, `orden` (1..14), `nombreFase`, `estado` (`Completada`, `En curso`, `Pendiente`), fechas ISO y URLs de imágenes.
  - `CanonicalProjectSchema`: Valida `idInversion` (ej. `BG-01`), `nombre`, `tipoProyecto`, `duracionMeses`, `driveUrl`.
  - `CanonicalDashboardWorkbookSchema`: Valida el paquete estructurado de todas las hojas.
- Sanitización obligatoria de inyecciones de fórmulas CSV/DDE en todas las celdas de texto.
- Conversión determinista de números seriales de Excel a fechas ISO-8601.

### Layer 4: Infrastructure (Neon DB & Spreadsheets Adapter)
- `apps/web/src/features/shared/infrastructure/db/migrations/004_dashboard_excel_entities.sql`:
  - Modifica / asegura tabla `properties` para incluir `id_inversion` (SKU ej. `BG-01`), `fase_actual`, `avance_fase_pct`, `drive_url`.
  - Crea tabla `project_phases` (`id VARCHAR(64) PRIMARY KEY`, `project_id VARCHAR(64) REFERENCES properties(id)`, `orden INTEGER`, `nombre_fase VARCHAR(255)`, `estado VARCHAR(32)`, `fecha_inicio DATE`, `fecha_fin DATE`, `imagenes TEXT[]`).
  - Tabla `reinvestment_opportunities` sincronizable desde la pestaña `Oportunidades`.
- `apps/web/src/features/ai-ingestion/infrastructure/streaming-spreadsheet-adapter.ts`: Implementa `parseDashboardWorkbook()` para extraer simultáneamente `Proyectos`, `Inversiones`, `Fases_Proyecto`, `Oportunidades` e `Inversionistas`.
- `apps/web/src/lib/infrastructure/db/repositories/investment-repository.ts`: Actualizado para incluir la carga de fases en `getPortfolioSummary()`.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1 (Database Migration & Domain Contracts)**: DDL SQL migration 004 en Neon, tipos TypeScript en `db.ts`, y esquemas Zod en capa de dominio.
- **SPEC-2 (Multi-Sheet Excel Ingestion Adapter)**: Extensión de `StreamingSpreadsheetAdapter` para digerir todas las hojas del Excel operativo de Drive (`DASH-BOARD-Blue-Brick-Panel-Administracion.xlsx`).
- **SPEC-3 (Repository Queries & UI Dynamic Phases Binding)**: `InvestmentRepository` resuelve fases reales desde PostgreSQL y `ProjectPhaseProgress` renderiza el avance interactivo verídico con fotos.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Paths**:
  - `tests/unit/canonical-dashboard-schema.test.ts` (Validación Zod y sanitización)
  - `tests/unit/multi-sheet-spreadsheet-adapter.test.ts` (Digestión del libro multi-hoja)
  - `tests/unit/project-phase-progress.test.tsx` (Comprobación de renderizado de fases dinámicas e imágenes)
- **Commands**: `pnpm test`
- **Assertion Goals**:
  - Validar que las 14 fases de `BG-01` son extraídas fielmente con fotos y estados.
  - Comprobar que `ProjectPhaseProgress` renderiza las fases pasadas por prop y calcula el porcentaje exacto (57.14%).

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] Migración DDL 004 ejecutada y verificada contra Neon PostgreSQL.
- [ ] Todas las pruebas unitarias y de integración pasan al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] Aprobación explícita del humano registrada antes de merge a develop.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BBC-14-excel-dashboard-ingestion-phases.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-14-excel-dashboard-ingestion-phases.md)
- **Solution Spec**: [feature-jaymusicmachine-BBC-14-excel-dashboard-ingestion-phases-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-14-excel-dashboard-ingestion-phases-implementation.md)
- **Linear Issue**: [BBC-14](https://linear.app/brids-app/issue/BBC-14)

