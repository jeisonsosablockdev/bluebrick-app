# Solution Spec: Consumo y Renderizado de Imágenes Reales en Avance de Obra (BBC-015 / BBC-15)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend`
- **Architect Gatekeeper**: `architect` (Gate 1 Structural Scaffolding & Gate 2 Diff Audit)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture

### Layer 1: Presentation Layer (`apps/web/src/components/dashboard/`)
- **`apps/web/src/components/dashboard/project-phase-media-card.tsx`** [NEW]:
  - Componente modular de presentación especializado en renderizar la tarjeta multimedia lateral (`Media Preview Card`).
  - Renderiza elemento `<img>` fotográfico cuando `currentPhoto` sea una URL válida, con `object-fit: cover`, bordes redondeados (`borderRadius: 12px`), y animaciones de fade en Motion.
  - Degrado de superposición oscuro (`background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(10,18,32,0.85) 100%)`) para garantizar contraste y legibilidad del texto de la fase y número de imagen.
  - Soporta carrusel automático (4s) y dots interactivos cuando existen múltiples imágenes (`images.length > 1`).
  - Fallback elegante: si no hay fotos (`images` vacío) o ante error de carga (`onError`), muestra el estado degradado esmeralda con `<ImageIcon />`.
- **`apps/web/src/components/dashboard/project-phase-progress.tsx`** [MODIFY]:
  - Integra `<ProjectPhaseMediaCard />` como subcomponente desacoplado dentro de la cuadrícula de información de fase, simplificando la complejidad del componente principal.

### Layer 2: Application/Consumption Layer (`apps/web/src/app/dashboard/` & `apps/web/src/components/dashboard/`)
- **`apps/web/src/app/dashboard/page.tsx`**:
  - Enriquecer `FALLBACK_PROPERTIES` y `DEFAULT_PHASES` con URLs fotográficas de arquitectura/obra verificadas y seguras para que el perfil de demostración de Sofía Martínez también exhiba la funcionalidad de carrusel fotográfico en vivo.

### Layer 3: Domain/Pipelines Layer (`apps/web/src/lib/types/`)
- **`apps/web/src/lib/types/db.ts`**:
  - Validar y mantener los contratos tipados de `DbDashboardProjectPhase` e interfaces de hito donde `images?: readonly string[]` almacena el arreglo de URLs `[imagen_url_1, imagen_url_2, imagen_url_3]`.

### Layer 4: Infrastructure Layer (`apps/web/src/lib/infrastructure/db/repositories/`)
- **`apps/web/src/lib/infrastructure/db/repositories/investment-repository.ts`**:
  - Validar que `enrichItemsWithProjectPhases` continúe leyendo de forma robusta `imagen_url_1`, `imagen_url_2`, `imagen_url_3` desde `dashboard_project_phases` y los asigne como arreglo limpio sin strings vacíos o nulos en `item.phases[].images`.

---

## 3. Atomic Slices & Logical Sequence

- **SPEC-1: Contrato Estructural y Componente Media Preview con Imagen Real**
  - **Rama**: `feature/jaymusicmachine-BBC-15-phase-media-images` (o SPEC secundario derivado)
  - **Fase RED (TDD)**: Diseñar y ejecutar test estructural y de renderizado en fallo en `tests/unit/project-phase-media-images.test.tsx` que verifique que cuando una fase tiene `images: ["https://..."]`, el componente `ProjectPhaseProgress` renderiza un tag `img` con el atributo `src` correspondiente, `alt` accesible y la paginación activa.
  - **Fase GREEN**: Implementar la tarjeta multimedia en `project-phase-progress.tsx` con soporte para imagen real, animaciones Motion, overlay de contraste y fallback `onError`.
  - **Fase REFACTOR**: Limpieza de código, verificación de rendimiento, eliminación de deuda y validación de Core Web Vitals (CLS = 0).

---

## 4. TDD (Test-Driven Development) Strategy

### Structural RED & Behavioral RED (Fase RED)
- **Test File Path**: `tests/unit/project-phase-media-images.test.tsx`
- **Command**: `pnpm vitest run tests/unit/project-phase-media-images.test.tsx`
- **Assertion Goals**:
  1. `renders real <img> tag with correct src and alt when current phase has images`: Verifica que la imagen provista en `currentPhase.images[0]` sea renderizada con su `src` exacto y atributos de accesibilidad.
  2. `transitions image src when carousel pagination dot is clicked`: Valida que al hacer clic en el dot de paginación de la segunda imagen, el `src` del elemento `<img>` se actualice adecuadamente a `images[1]`.
  3. `renders fallback icon and phase title when phase has empty images array`: Asegura que fases sin imágenes sigan mostrando el icono `<ImageIcon />` y el texto de fase sin errores de renderizado.
  4. `handles image error gracefully by falling back to placeholder`: Simula evento `error` en el tag `<img>` y valida que se active el renderizado de fallback visual sin romper el componente.

---

## 5. Local Definition of Done (DoD)
- [ ] Documentos duales de requerimientos (`knowledge/features/`) completados sin placeholders.
- [ ] Architect Gate 1 completado con aprobación del diseño de 4 capas.
- [ ] 🛑 Human Design Approval otorgado por el usuario.
- [ ] Tests estructurales y de comportamiento en fallo (RED) escritos previamente con `tdd-primal`.
- [ ] Implementación de `ProjectPhaseProgress.tsx` con comentarios obligatorios paso a paso (`// Step N:`).
- [ ] Tests unitarios pasando al 100% (GREEN).
- [ ] Auditoría de clean code y Architect Gate 2 aprobada.
- [ ] Suite completa de validación (`pnpm validate`) pasando con 0 errores y 0 warnings.
- [ ] 🛑 Human Merge Acceptance otorgado antes de cualquier fusión o PR.

---

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BBC-15-phase-media-images.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-15-phase-media-images.md)
- **Solution Spec**: [feature-jaymusicmachine-BBC-15-phase-media-images-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-15-phase-media-images-implementation.md)
- **Linear Issue**: [Linear Ticket BBC-15](https://linear.app/brids-app/issue/BBC-15)
