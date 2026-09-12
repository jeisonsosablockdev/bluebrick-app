# Solution Spec: Splash Screen Performance Optimization Implementation (BBC-22)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture

### Layer 1: Presentation (`apps/web/src/components/splash/*`, `apps/web/src/app/providers.tsx`)
- **`apps/web/src/app/providers.tsx`**:
  - Desacoplar `BrandSplashScreen` del chunk crítico de `Providers` utilizando `next/dynamic` con `{ ssr: false }`.
- **`apps/web/src/components/splash/animated-isotype-vector.tsx`**:
  - Envolver el SVG en un contenedor `div` acelerado por hardware GPU (`transformStyle: "preserve-3d"`, `perspective: 800`, `willChange: "transform"`, `backfaceVisibility: "hidden"`).
  - Mover la rotación 3D (`rotateY: 180deg`) al `div` exterior compuesto por hardware, eliminando re-rasterización en CPU de los elementos vectoriales `<path>` y `<svg>`.
- **`apps/web/src/components/splash/splash-portal.tsx`**:
  - Optimizar el portal para montar limpiamente y permitir el relevo fluido entre el shell estático y la animación de Motion.

### Layer 2: Application / Consumption (`apps/web/src/components/splash/use-splash-screen.ts`, `splash-provider.tsx`)
- **`apps/web/src/components/splash/use-splash-screen.ts`**:
  - Inicialización síncrona en cliente de `isVisible` y `phase`: si `splashStorage.hasViewed()` es `true` y `forceShow` es `false`, inicializar directamente en `phase: "completed"` e `isVisible: false`. Evita el montaje fantasma y re-renderizado en visitas repetidas.
  - Gestión optimizada de timers y sincronización de ciclo de vida sin drift.

### Layer 3: Domain / Pipelines (`apps/web/src/lib/splash/load-optimizer.ts`, `types.ts`, `isotype-geometry.ts`)
- **`apps/web/src/lib/splash/load-optimizer.ts`**:
  - Actualizar `prefetchCriticalRoutes` para usar `requestIdleCallback` (con fallback a `setTimeout(..., 200)` si no está soportado), asegurando que la precarga de rutas críticas ocurra en momentos de inactividad de la red y CPU.
- **`apps/web/src/lib/splash/types.ts`**:
  - Contratos de tipos estrictos para configuraciones de renderizado y opciones de optimización GPU.

### Layer 4: Infrastructure (`apps/web/src/lib/splash/splash-storage.ts`)
- Preservar el adapter de `sessionStorage` con memoria segura para SSR y navegación privada.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: **Splash Performance Optimization & GPU Acceleration** (Rama: `SPEC/jaymusicmachine-BBC-22-s01-splash-performance`)
  - Red-Green-Refactor completo:
    1. **RED**: Diseñar y escribir tests exhaustivos en `tests/unit/splash-screen.test.tsx` y `tests/unit/splash-load-optimization.test.tsx` cubriendo inicialización sin montaje fantasma, desacoplamiento dinámico, y precarga en reposo con `requestIdleCallback`.
    2. **GREEN**: Implementar optimizaciones en Capas 1, 2 y 3.
    3. **REFACTOR**: Auditoría Clean Code y verificación de Gate 2 con `architect`.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Paths**:
  - `tests/unit/splash-screen.test.tsx`
  - `tests/unit/splash-load-optimization.test.tsx`
- **Command**: `pnpm test tests/unit/splash-screen.test.tsx tests/unit/splash-load-optimization.test.tsx`
- **Assertion Goals**:
  - Validar que en visitas repetidas no hay montaje fantasma (inicia en completed/invisible).
  - Validar que `prefetchCriticalRoutes` utiliza `requestIdleCallback` cuando está disponible.
  - Validar que la rotación 3D delega en contenedor GPU compuesto.

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite completa de pruebas unitarias pasa al 100% (574+ tests pasando).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings (16 de 16 gates).
- [ ] Documentación en `knowledge/fixes/` sin placeholders.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [fix-jaymusicmachine-BBC-22-splash-performance-optimization.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/fixes/fix-jaymusicmachine-BBC-22-splash-performance-optimization.md)
- **Solution Spec**: [fix-jaymusicmachine-BBC-22-splash-performance-optimization-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/fixes/fix-jaymusicmachine-BBC-22-splash-performance-optimization-implementation.md)
- **Linear Issue**: [Linear Ticket BBC-22](https://linear.app/brids-app/issue/BBC-22)
