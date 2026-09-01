# Solution Spec: dashboard-microanimations Implementation (BBC-016 / BBC-16)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture
La solución implementa una capa de microanimaciones hápticas y dopamínicas aceleradas por GPU, estrictamente acoplada a las directrices de **Web Core Vitals** (CLS = 0, INP < 50ms, LCP inalterado) y accesibilidad (`prefers-reduced-motion`):

### Capa 1: Presentation Layer (`apps/web/src/components/` & `apps/web/src/app/`)
- `apps/web/src/components/dashboard/dashboard-interactive-card.tsx`:
  Contenedor visual interactivo basado en Motion 12 (`motion/react`) que provee elevación suave (`translateY(-2px)`), escalado sutil (`scale(1.008)`), y halo perimetral suave de acento (#2F8F6B o #C41230) en estado de hover/proximidad sin layout shift.
- `apps/web/src/components/dashboard/stat-chip.tsx`:
  Mejorado con microinteracción de elevación táctil (`whileHover={{ y: -2, scale: 1.02 }}`), resplandor en icono y fondo suave con transición spring.
- `apps/web/src/components/dashboard/investment-dashboard.tsx`:
  Integración de microescalados dopamínicos en:
  - Hero Card 1 (Patrimonio Total) y Hero Card 2 (Distribución) mediante `DashboardInteractiveCard`.
  - Controles de carrusel (botones chevron izquierdo/derecho con escala spring `scale(1.12)` en hover y `scale(0.92)` en tap).
  - Carrusel de inversión con micro-zoom `scale(1.005)` y elevación suave.
  - Tabla de detalle de inversiones con resaltado y microtransición de filas.
  - Oportunidades de reinversión con hover `scale(1.02)` y elevación de tarjeta.
  - Botón CTA de oportunidades con pulso de resplandor sutil, `whileHover={{ scale: 1.03 }}` y `whileTap={{ scale: 0.97 }}`.
  - Avatar y controles del sticky header con microescalados fluidos.
- `apps/web/src/components/dashboard/project-phase-progress.tsx`:
  Ajuste del stepper de hitos con pulso de hover elástico (`scale(1.28)`), resplandor de hito activo y zoom `scale(1.04)` en miniaturas multimedia con aceleración de GPU.
- `apps/web/src/app/globals.css`:
  Clases utilitarias con aceleración por hardware (`will-change: transform`, `transform: translateZ(0)`), transiciones bezier `cubic-bezier(0.16, 1, 0.3, 1)` y reglas estrictas `@media (prefers-reduced-motion: reduce)`.

### Capa 2: Application / Consumption Layer (`apps/web/src/lib/hooks/`)
- `apps/web/src/lib/hooks/use-reduced-motion.ts`:
  Hook cliente para detectar si el usuario tiene activada la preferencia de reducción de movimiento del sistema operativo (`prefers-reduced-motion: reduce`), desactivando transforms físicos y degradando elegantemente a transiciones de opacidad/color.

### Capa 3: Domain / Pipelines Layer (`apps/web/src/lib/pipelines/`)
- `apps/web/src/lib/pipelines/micro-animation-tokens.ts`:
  Tokens de dominio centralizados que definen la física de resortes (springs) de Motion 12 (`stiffness`, `damping`, `mass`), constantes de microescalado (`SCALE_HERO_CARD: 1.008`, `SCALE_CHIP: 1.02`, `SCALE_BUTTON_HOVER: 1.03`, `SCALE_BUTTON_TAP: 0.97`), límites de Web Core Vitals e invariantes de GPU compositing.

### Capa 4: Infrastructure Layer (`apps/web/src/lib/infrastructure/`)
- No requiere migraciones SQL ni cambios de infraestructura externa. La persistencia existente en PostgreSQL y la arquitectura cliente-servidor se mantienen 100% intactas.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: Tokens de Microanimación, Hook de Accesibilidad y Scaffolding de Card Interactivo (Rama: `feature/jaymusicmachine-BBC-16-dashboard-microanimations`).
  - Ciclo Red-Green-Refactor: Creación de test estructural y de tokens de animación (`tests/unit/dashboard-microanimations-structural.test.ts`), implementación de `micro-animation-tokens.ts` y `use-reduced-motion.ts`.
- **SPEC-2**: Microanimaciones del Dashboard, Hero Cards, Carrusel, Stepper y Core Web Vitals (Rama: `feature/jaymusicmachine-BBC-16-dashboard-microanimations`).
  - Ciclo Red-Green-Refactor: Tests de comportamiento UI (`tests/unit/dashboard-microanimations.test.tsx`), integración en `DashboardInteractiveCard`, `stat-chip.tsx`, `investment-dashboard.tsx`, `project-phase-progress.tsx` y `globals.css`.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path 1**: `tests/unit/dashboard-microanimations-structural.test.ts`
  - **Command**: `pnpm test tests/unit/dashboard-microanimations-structural.test.ts`
  - **Assertion Goals**: Verifica la existencia física en disco de todos los archivos proyectados de las 4 capas y exportaciones requeridas (`micro-animation-tokens.ts`, `use-reduced-motion.ts`, `dashboard-interactive-card.tsx`).
- **Test File Path 2**: `tests/unit/dashboard-microanimations.test.tsx`
  - **Command**: `pnpm test tests/unit/dashboard-microanimations.test.tsx`
  - **Assertion Goals**:
    1. Verifica que los tokens de animación respeten invariantes de Core Web Vitals (cero propiedades de layout shift como `width`, `height`, `margin`, `padding`).
    2. Valida que `useReducedMotion` retorne falso por defecto y responda a `matchMedia`.
    3. Verifica que `DashboardInteractiveCard` y `StatChip` rendericen correctamente con atributos de aceleración de hardware.
    4. Valida que el escalado no exceda el umbral institucional estipulado (`<= 1.05` para cards grandes, `<= 1.3` para hitos pequeños).

## 5. Local Definition of Done (DoD)
- [x] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [x] La suite de pruebas de regresión pasa al 100% (verde) con vitest.
- [x] `pnpm validate` se ejecuta con 0 errores y 0 warnings (lint, typecheck, licenses, docs-governance, architecture, lifecycle, harness).
- [x] Las microanimaciones aplican `transform` y `opacity` garantizando CLS = 0 e INP < 50ms.
- [x] Se respeta `prefers-reduced-motion` para accesibilidad.
- [x] In-code commentary obligatorio presente en todos los archivos nuevos/modificados (`// Step N:` y encabezados de capa).
- [x] Aprobación explícita del humano registrada antes de merge.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BBC-16-dashboard-microanimations.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-16-dashboard-microanimations.md)
- **Solution Spec**: [feature-jaymusicmachine-BBC-16-dashboard-microanimations-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-16-dashboard-microanimations-implementation.md)
- **Linear Issue**: N/A (No sincronizar ni crear issues en Linear por instrucción explícita del usuario).

