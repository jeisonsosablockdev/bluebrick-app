# Solution Spec: Detalle y Experiencia de Visualización de Imágenes en Dashboard (BBC-020)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend`
- **Architect Gatekeeper**: `architect` (Gate 1 Structural Scaffolding & Gate 2 Diff Audit)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

---

## 2. Solution Overview & 4-Layer Architecture

### Layer 1: Presentation Layer (`apps/web/src/components/dashboard/`)
- **`apps/web/src/components/dashboard/project-phase-media-card.tsx`** [MODIFY]:
  - Añade flechas laterales de navegación en los bordes izquierdo y derecho que abarcan toda la altura del contenedor (`top: 0, bottom: 0`).
  - Base estilizada en glassmorphism (`backdrop-filter: blur(8px)`, fondo semi-transparente `rgba(10, 18, 32, 0.45)` y borde translúcido `rgba(237, 241, 245, 0.1)`).
  - Revelación suave controlada por hover (`opacity: 0` a `opacity: 1`) con Motion.
  - Clics en flechas ejecutan `e.stopPropagation()` para cambiar de imagen sin abrir el modal.
  - Al hacer clic en el cuerpo de la miniatura de la imagen real, activa `isModalOpen = true` con cursor `zoom-in`.
- **`apps/web/src/components/dashboard/project-phase-progress.tsx`** [MODIFY]:
  - Los hitos de fases completadas con fotografías (`images.length > 0`) incrementan su diámetro de `10px` a `15px`, con icono de check proporcional (`9px`), destacándose nítidamente sobre las fases sin fotos.
  - En hover, el tooltip existente despliega la insignia `📷 X fotos de avance` en las fases con fotografías.
  - Las fases en curso mantienen su indicador y pulso característico.
- **`apps/web/src/components/dashboard/project-phase-media-modal.tsx`** [NEW]:
  - Modal lightbox de alta fidelidad y peso pluma montado mediante Motion `AnimatePresence`.
  - Backdrop con desenfoque de cristal (`backdrop-filter: blur(16px)`) y cierre mediante tecla `Escape`, botón `(X)` o clic en backdrop.
  - Controles flotantes superiores/inferiores: `(+)`, `(-)`, `(1:1 / Reset)`, `(X)`.
  - **Zoom Guard (Invariante)**: Carga `naturalWidth` y `naturalHeight` de la imagen en memoria y calcula dinámicamente el `maxScale` para que el zoom jamás supere la resolución nativa 1:1, impidiendo cualquier pixelación.
  - Soporte de rueda del mouse (wheel zoom), doble clic para alternar fit/1:1, y arrastre (drag/pan) con bordes suaves cuando esté ampliada.
  - Flechas de navegación previa/siguiente y soporte de teclado (`ArrowLeft`, `ArrowRight`).

### Layer 2: Application/Consumption Layer
- Gestión de estado del modal, índice activo sincronizado con el carrusel de la fase, y listeners de teclado para accesibilidad (`Escape`, `ArrowLeft`, `ArrowRight`).
- Manejo de ciclo de vida del zoom y contención de transformaciones CSS sin dependencias externas pesadas.

### Layer 3: Domain/Pipelines Layer
- Tipado estricto e invariantes para los límites de escala de imagen:
  - `interface ZoomBoundaryContract`: `{ naturalWidth: number; naturalHeight: number; fitScale: number; maxScale: number }`.
- Validación de que las URLs de las fotos sean seguras (HTTPS) y no vacías.

### Layer 4: Infrastructure Layer
- Acceso a las dimensiones nativas de la imagen del navegador (`HTMLImageElement.naturalWidth` y `HTMLImageElement.naturalHeight`) en el evento de carga (`onLoad`), garantizando ligereza absoluta y latencia cero.

---

## 3. Atomic Slices & Logical Sequence

- **SPEC-1: Flechas Laterales de Navegación Glassmorphic en Miniatura**
  - **Rama**: `SPEC/jaymusicmachine-BBC-020-s01-glassmorphic-corner-arrows`
  - **Fase RED (TDD)**: Diseñar tests en `tests/unit/project-phase-media-card-arrows.test.tsx` verificando renderizado de flechas de esquina a esquina, revelación en hover, alternancia de imágenes con `stopPropagation()`, y ocultamiento cuando hay 1 o 0 imágenes.
  - **Fase GREEN**: Implementar las franjas laterales glassmorphic en `project-phase-media-card.tsx` con Motion y Lucide icons.
  - **Fase REFACTOR**: Limpieza de código, verificación de estándares y comentarios paso a paso (`// Step N:`).

- **SPEC-2: Hitos de Fase Agrandados con Fotos y Tooltip Informativo**
  - **Rama**: `SPEC/jaymusicmachine-BBC-020-s02-milestone-photo-indicators`
  - **Fase RED (TDD)**: Diseñar tests en `tests/unit/project-phase-progress-dots.test.tsx` validando que las fases completadas con imágenes tengan diámetro agrandado (15px), las fases sin imágenes mantengan 10px, y el tooltip muestre el conteo de fotos sólo en hover.
  - **Fase GREEN**: Actualizar el renderizado del stepper y tooltip en `project-phase-progress.tsx`.
  - **Fase REFACTOR**: Limpieza de estilos en línea, tipado estricto y auditoría clean code.

- **SPEC-3: Modal Lightbox Ligero con Zoom Guard y Navegación de Obra**
  - **Rama**: `SPEC/jaymusicmachine-BBC-020-s03-lightweight-zoom-modal-lightbox`
  - **Fase RED (TDD)**: Diseñar tests en `tests/unit/project-phase-media-modal.test.tsx` verificando apertura/cierre, cálculo de `maxScale` (zoom guard 1:1), controles de zoom (+, -, reset), arrastre/pan, y navegación con flechas/teclado.
  - **Fase GREEN**: Implementar `project-phase-media-modal.tsx` y conectarlo a `project-phase-media-card.tsx`.
  - **Fase REFACTOR**: Limpieza, optimización de rendimiento (GPU acceleration `translateZ(0)`) y validación integral de la suite (`pnpm validate`).

---

## 4. TDD (Test-Driven Development) Strategy

### Unit & Component Tests (Fase RED)
1. **`tests/unit/project-phase-media-card-arrows.test.tsx`**
   - **Command**: `pnpm vitest run tests/unit/project-phase-media-card-arrows.test.tsx`
   - **Assertion Goals**:
     - Renderiza flechas laterales con estilo glassmorphic únicamente cuando `images.length > 1`.
     - No renderiza flechas cuando `images.length <= 1`.
     - Clic en flecha derecha avanza al siguiente índice sin propagar evento al contenedor padre.
     - Clic en flecha izquierda retrocede al índice anterior con wrapping circular.
2. **`tests/unit/project-phase-progress-dots.test.tsx`**
   - **Command**: `pnpm vitest run tests/unit/project-phase-progress-dots.test.tsx`
   - **Assertion Goals**:
     - Las fases completadas con fotografías tienen un tamaño renderizado de `15px`.
     - Las fases completadas sin fotografías conservan el tamaño de `10px`.
     - El tooltip despliega el conteo `📷 X fotos de avance` en hover.
3. **`tests/unit/project-phase-media-modal.test.tsx`**
   - **Command**: `pnpm vitest run tests/unit/project-phase-media-modal.test.tsx`
   - **Assertion Goals**:
     - Al hacer clic en la miniatura con foto real se abre el modal.
     - `maxScale` nunca excede la escala 1:1 de `naturalWidth` / `naturalHeight`.
     - Tecla `Escape` y botón de cierre invocan la función `onClose`.
     - Flechas de navegación permiten alternar fotos de la fase dentro del modal.

---

## 5. Local Definition of Done (DoD)
- [ ] Documentos duales de requerimientos (`knowledge/features/`) completados y sin placeholders.
- [ ] Architect Gate 1 completado con aprobación y andamiaje estructural de archivos.
- [ ] 🛑 Human Design Approval otorgado explícitamente.
- [ ] Tests en fallo (RED) implementados previamente con `tdd-primal` para cada SPEC.
- [ ] Implementación en verde (GREEN) con comentarios paso a paso (`// Step N:`).
- [ ] Auditoría de refactorización limpia y Architect Gate 2 aprobada.
- [ ] Suite completa de validación (`pnpm validate`) pasando con 0 errores y 0 warnings.
- [ ] 🛑 Human Merge Acceptance otorgado por el usuario antes de la integración final.

---

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BBC-020-image-detail-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-020-image-detail-implementation.md)
- **Solution Spec**: [feature-jaymusicmachine-BBC-020-image-detail-implementation-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-020-image-detail-implementation-implementation.md)
- **Linear Issue**: BBC-020 (Sincronización Linear omitida por instrucción del usuario)
