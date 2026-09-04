# Solution Spec: Detalle y Experiencia de Visualización de Imágenes en Dashboard — Feature FDD (BBC-020)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend`
- **Architect Gatekeeper**: `architect` (Gate 1 Structural Scaffolding & Gate 2 Diff Audit)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

---

## 2. Solution Overview: Lean FDD & Next.js 16 Architecture

Conforme a `knowledge/architecture/architecture-overview.md` y tras la auditoría de sobreingeniería (*Ponytail Review*), la funcionalidad se organiza como una **Vertical Slice autónoma y compacta** en `apps/web/src/features/image-detail/`. Se eliminan capas intermedias especulativas (adaptadores innecesarios para APIs nativas del navegador) concentrando la lógica en 3 archivos altamente cohesivos con su suite de pruebas colocalizada.

```text
apps/web/src/features/image-detail/
├── index.ts                                   <-- 🛡️ Public API Boundary (exporta ImageDetailModal y tipos)
├── image-detail-modal.tsx                     <-- Capa 1: Presentación (Dialog accesible WAI-ARIA + Motion)
├── use-image-zoom.ts                          <-- Capa 2 & 3: Aplicación / Dominio (Hook + Zoom Guard 1:1 puro)
└── image-detail-modal.test.tsx                <-- 🧪 Tests colocalizados (Zoom Guard, Gestos, Teclado)
```

---

### 2.1. Anatomía Interna de la Feature (`apps/web/src/features/image-detail/`)

#### Layer 1: Presentation Layer (`image-detail-modal.tsx`)
- **Montaje en Portal & Accesibilidad**:
  - Montado mediante `createPortal` en `document.body` y animado con Motion `AnimatePresence`.
  - Semántica WAI-ARIA: `role="dialog"`, `aria-modal="true"`, `aria-label="Detalle de fotografía"`.
  - Backdrop con desenfoque de cristal (`backdrop-filter: blur(16px)`, `rgba(0, 0, 0, 0.85)`).
- **Controles de Interacción**:
  - Botones flotantes con glassmorphism: `(+)`, `(-)`, `(1:1 / Reset)`, `(X Cerrar)`.
  - Flechas de navegación previa/siguiente con soporte de wrapping circular.
  - Cierre inmediato mediante tecla `Escape`, botón `(X)` o clic en el fondo oscuro.
- **Escenario de Imagen con GPU Compositing**:
  - Contenedor con `overflow: hidden`.
  - Transformaciones aplicadas estrictamente sobre `transform: translate3d(x, y, 0) scale(s)`. Prohibido alterar `width`, `height`, `top` o `left` para evitar recálculos de layout (*reflows*).

#### Layer 2 & 3: Application & Domain Layer (`use-image-zoom.ts`)
- **Hook `useImageZoom`**:
  - Maneja estado reactivo: `scale`, `panOffset`, `isZoomed`, `naturalDimensions`.
  - Captura dimensiones nativas directamente mediante `e.currentTarget.naturalWidth` y `naturalHeight` en el `onLoad` nativo de React (cero dependencias de infraestructura).
- **Invariante Central (Zoom Guard Matemático)**:
  - Función pura:
    $$\text{fitScale} = \min\left(\frac{\text{viewportWidth}}{\text{naturalWidth}}, \frac{\text{viewportHeight}}{\text{naturalHeight}}, 1\right)$$
    $$\text{maxScale} = \max\left(1, \frac{1}{\text{fitScale}}\right)$$
  - **Invariante**: $\text{scale} \le \text{maxScale}$. Garantiza matemáticamente que la imagen nunca supere el 100% de su densidad de píxeles nativa, impidiendo distorsión o pixelación.
- **Contención de Eventos**:
  - Doble clic / doble tap: alterna entre `fitScale` y `maxScale` (1:1).
  - Rueda del ratón (`wheel`): ajusta la escala con throttle mediante `requestAnimationFrame`.

#### Public API Boundary (`index.ts`)
- Exporta únicamente el contrato público de consumo:
  ```ts
  export { ImageDetailModal } from "./image-detail-modal";
  export type { ImageDetailModalProps } from "./image-detail-modal";
  ```

---

### 2.2. Capa de Consumo en Dashboard (`apps/web/src/components/dashboard/`)

#### `project-phase-media-card.tsx` [MODIFY]
- **Next.js 16 Dynamic Import**:
  - Importa el modal con carga diferida y sin SSR para proteger el bundle inicial y el FCP de `/dashboard`:
    ```tsx
    const ImageDetailModal = dynamic(
      () => import("@/features/image-detail").then((m) => m.ImageDetailModal),
      { ssr: false }
    );
    ```
- **Flechas Laterales Glassmorphism**:
  - Franjas de esquina a esquina en laterales izquierdo y derecho (`top: 0, bottom: 0`).
  - Base con estilo glassmorphism: `backdrop-filter: blur(8px)`, `background: rgba(10, 18, 32, 0.45)`.
  - Revelación suave en hover (`opacity: 0` a `opacity: 1`).
  - Clic ejecuta `e.stopPropagation()` para cambiar de imagen sin disparar la apertura del modal.
  - Se ocultan automáticamente si `images.length <= 1`.

#### `project-phase-progress.tsx` [MODIFY]
- **Hitos Prominentes**:
  - Para fases completadas que contienen fotos (`phase.images.length > 0`), incrementa el diámetro del círculo de `10px` a `15px` con checkmark proporcional de `9px`.
  - Fases sin fotos mantienen `10px`. Fases en curso mantienen su indicador y pulso.
- **Tooltip Informativo**:
  - Al hacer hover, añade el badge: `📷 X fotos de avance` si la fase dispone de imágenes registradas.

---

### 2.3. Matriz de Protección contra el Abuso de Recursos

| Vector de Riesgo | Mecanismo de Mitigación Implementado |
| :--- | :--- |
| **Memoria RAM & GPU (Texturas 4K)** | **Desmontaje Total**: Al cerrar el modal (`isOpen === false`), el DOM y decodificadores se eliminan vía `<AnimatePresence>`. El **Zoom Guard (1:1)** bloquea buffers de renderizado hipertrofiados en pantallas Retina. |
| **CPU & Event Loop (Gestos/Wheel)** | **GPU Compositing**: Transformaciones exclusivamente con `translate3d` y `scale`. Throttling de rueda con `requestAnimationFrame`. Listeners de teclado agregados solo cuando el modal está montado. |
| **Ancho de Banda / Egress** | **Carga Lazy Bajo Demanda**: Cero precarga en segundo plano de fotografías pesadas en el dashboard; la imagen se consume en alta resolución únicamente cuando el usuario abre el modal. |
| **Bundle Size & First Paint (FCP)** | **Code Splitting (`next/dynamic`)**: El código del visor modal no forma parte del JavaScript inicial del dashboard; se transfiere solo tras la primera interacción del usuario. |

---

## 3. Atomic Slices & Logical Sequence

- **SPEC-1: Flechas Laterales de Navegación Glassmorphism en Tarjeta Multimedia**
  - **Rama**: `SPEC/jaymusicmachine-BBC-020-s01-glassmorphic-corner-arrows`
  - **Fase RED (TDD)**: Test en `tests/unit/project-phase-media-card-arrows.test.tsx` verificando franjas laterales completas, hover, `stopPropagation()` y ocultamiento cuando `images.length <= 1`.
  - **Fase GREEN**: Implementación de franjas laterales en `project-phase-media-card.tsx`.
  - **Fase REFACTOR**: Limpieza y comentarios paso a paso (`// Step N:`).

- **SPEC-2: Hitos de Fase Agrandados con Fotos y Tooltip Informativo**
  - **Rama**: `SPEC/jaymusicmachine-BBC-020-s02-milestone-photo-indicators`
  - **Fase RED (TDD)**: Test en `tests/unit/project-phase-progress-dots.test.tsx` validando hitos de 15px en fases con fotos, 10px en fases sin fotos, y badge en tooltip en hover.
  - **Fase GREEN**: Actualización del stepper y tooltip en `project-phase-progress.tsx`.
  - **Fase REFACTOR**: Limpieza de estilos y auditoría clean code.

- **SPEC-3: Feature FDD `image-detail` con Zoom Guard y Modal Lightbox**
  - **Rama**: `SPEC/jaymusicmachine-BBC-020-s03-fdd-image-detail-feature`
  - **Fase RED (TDD)**: Tests colocalizados en `apps/web/src/features/image-detail/image-detail-modal.test.tsx`:
    - Valida cálculo de `maxScale` acotado a 1:1 nativo (sin pixelación).
    - Valida apertura accesible (`dialog`) y cierre por `Escape` o botón.
    - Valida navegación circular entre imágenes con flechas y teclado.
  - **Fase GREEN**: Implementación de la feature FDD en `apps/web/src/features/image-detail/` y conexión vía `next/dynamic` en `project-phase-media-card.tsx`.
  - **Fase REFACTOR**: Auditoría clean code, verificación GPU (`translateZ(0)`) y validación con `pnpm validate`.

---

## 4. TDD (Test-Driven Development) Strategy

### 4.1. Tests Colocalizados en la Feature (`apps/web/src/features/image-detail/`)
- **`image-detail-modal.test.tsx`**:
  - `clamps maxScale to 1.0 when image is smaller than container`: Valida que imágenes de 400x300 no se amplíen más allá de 1:1.
  - `renders dialog with aria-modal and title`: Valida accesibilidad WAI-ARIA.
  - `calls onClose on Escape key press`: Valida listener de teclado.
  - `navigates to next/previous image on arrow keys`: Valida navegación fluida.

### 4.2. Tests de Componentes del Dashboard (`tests/unit/`)
- **`project-phase-media-card-arrows.test.tsx`**: Valida presencia de franjas laterales glassmorphic solo si `images.length > 1` y detención de propagación de clic.
- **`project-phase-progress-dots.test.tsx`**: Valida escala a 15px en fases completadas con imágenes y presencia de badge en hover tooltip.

---

## 5. Local Definition of Done (DoD)
- [ ] Documentos duales de requerimientos (`knowledge/features/`) completados y alineados con FDD Lean sin placeholders.
- [ ] Architect Gate 1 completado con aprobación del diseño FDD y andamiaje canónico en `apps/web/src/features/image-detail/`.
- [ ] 🛑 Human Design Approval otorgado explícitamente antes de escribir lógica.
- [ ] Tests en fallo (RED) implementados previamente con `tdd-primal` para cada SPEC.
- [ ] Implementación en verde (GREEN) con comentarios obligatorios paso a paso (`// Step N:`).
- [ ] Auditoría de refactorización limpia y Architect Gate 2 aprobada.
- [ ] Suite completa de validación (`pnpm validate`) pasando con 0 errores y 0 warnings.
- [ ] 🛑 Human Merge Acceptance otorgado por el usuario antes de la integración final.

---

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BBC-020-image-detail-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-020-image-detail-implementation.md)
- **Solution Spec**: [feature-jaymusicmachine-BBC-020-image-detail-implementation-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-020-image-detail-implementation-implementation.md)
- **Linear Issue**: BBC-020 (Sincronización Linear omitida por instrucción del usuario)

