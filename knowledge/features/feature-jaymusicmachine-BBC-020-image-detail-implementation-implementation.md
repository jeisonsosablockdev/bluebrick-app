# Solution Spec: Detalle y Experiencia de Visualización de Imágenes en Dashboard — Feature FDD (BBC-020)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend`
- **Architect Gatekeeper**: `architect` (Gate 1 Structural Scaffolding & Gate 2 Diff Audit)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

---

## 2. Solution Overview & 4-Layer Feature-Driven Design (FDD)

Conforme a `knowledge/architecture/architecture-overview.md` y `knowledge/governance/clean-code-folder-structure.md`, la funcionalidad de inspección visual se estructura como una **Vertical Slice autónoma** en `apps/web/src/features/image-detail/`, garantizando independencia de dominio, reusabilidad en el producto y cumplimiento estricto del flujo unidireccional de 4 capas.

```text
apps/web/src/features/image-detail/
├── index.ts                                   <-- 🛡️ Public API Boundary (único punto de exportación)
├── presentation/                              <-- Capa 1: Componentes visuales y accesibilidad
│   ├── image-detail-modal.tsx
│   └── image-detail-modal.test.tsx            <-- 🧪 Test colocalizado de presentación
├── application/                               <-- Capa 2: Hooks de consumo y estado interactivo
│   ├── use-image-zoom.ts
│   └── use-image-zoom.test.ts                 <-- 🧪 Test colocalizado de hook
├── domain/                                    <-- Capa 3: Lógica pura, Zoom Guard e invariantes
│   ├── zoom-boundary-calculator.ts            <-- Cálculo puro de escala 1:1 sin pixelado
│   ├── zoom-boundary-calculator.test.ts       <-- 🧪 Test colocalizado de dominio
│   └── image-detail-types.ts                  <-- Contratos tipados e interfaces de escala
└── infrastructure/                            <-- Capa 4: Adaptadores del navegador
    ├── browser-image-loader.ts                <-- Extracción cliente de naturalWidth / naturalHeight
    └── browser-image-loader.test.ts           <-- 🧪 Test colocalizado de infraestructura
```

### 2.1. Anatomía Interna de la Feature (`apps/web/src/features/image-detail/`)

#### Layer 1: Presentation Layer (`presentation/`)
- **`image-detail-modal.tsx`** [NEW]:
  - Modal lightbox montado sobre React Portal / Motion `AnimatePresence`.
  - Fondo oscuro con desenfoque de cristal (`backdrop-filter: blur(16px)`).
  - Controles flotantes accesibles: `(+)`, `(-)`, `(1:1 / Reset)`, botón de cierre `(X)`.
  - Escenario interactivo para la imagen con soporte de arrastre (drag/pan) suave cuando la imagen está ampliada (`drag`, `dragConstraints`).
  - Navegación entre imágenes de la galería (flechas izquierda/derecha y atajos de teclado `ArrowLeft`, `ArrowRight`).
  - Cierre mediante tecla `Escape`, botón `(X)` o clic fuera de la imagen.

#### Layer 2: Application / Consumption Layer (`application/`)
- **`use-image-zoom.ts`** [NEW]:
  - Custom hook reactivo que encapsula el estado de escala (`scale`), desplazamiento (`panOffset`), e índice activo.
  - Expone handlers optimizados para zoom por botones, doble clic (toggle fit / 100%), rueda del ratón (wheel listener no pasivo con throttle) y atajos de teclado.
  - Conecta la vista de presentación con el calculador de límites del dominio.

#### Layer 3: Domain / Pipelines Layer (`domain/`)
- **`zoom-boundary-calculator.ts`** [NEW]:
  - Función matemática pura y agnóstica de frameworks:
    `calculateZoomBoundaries({ viewportWidth, viewportHeight, naturalWidth, naturalHeight }): ZoomBoundaryContract`.
  - **Invariante Central (Zoom Guard)**: `maxScale = Math.max(1, Math.min(viewportWidth / naturalWidth, viewportHeight / naturalHeight) >= 1 ? 1 : 1 / fitScale)`.
  - Garantiza que el zoom jamás amplíe los píxeles por encima del 100% de la resolución nativa de la imagen fuente (`scale <= maxScale`), evitando distorsiones o artefactos de pixelado.
- **`image-detail-types.ts`** [NEW]:
  - Declaración de contratos: `ZoomBoundaryContract`, `ImageDetailModalProps`, `ImageItem`.

#### Layer 4: Infrastructure Layer (`infrastructure/`)
- **`browser-image-loader.ts`** [NEW]:
  - Adaptador para resolver las dimensiones intrínsecas (`naturalWidth`, `naturalHeight`) desde un elemento `HTMLImageElement` cargado en el cliente, de forma ultra ligera y sin dependencias externas.

#### Public API Boundary (`index.ts`)
- **`index.ts`** [NEW]:
  - Exporta únicamente los componentes y tipos que el resto de la aplicación puede consumir:
    `export { ImageDetailModal } from "./presentation/image-detail-modal";`
    `export type { ImageDetailModalProps, ImageItem } from "./domain/image-detail-types";`

---

### 2.2. Capa de Consumo en Dashboard (`apps/web/src/components/dashboard/`)

- **`apps/web/src/components/dashboard/project-phase-media-card.tsx`** [MODIFY]:
  - Importa de forma limpia y desacoplada: `import { ImageDetailModal } from "@/features/image-detail"`.
  - Al hacer clic en la fotografía real, abre `ImageDetailModal` pasando las imágenes de la fase y el índice actual.
  - Incorpora franjas laterales de navegación izquierda y derecha de altura completa (`top: 0, bottom: 0`).
  - Base estilizada en glassmorphism (`backdrop-filter: blur(8px)`, `rgba(10, 18, 32, 0.45)`, borde translúcido).
  - Revelación suave con hover (`opacity: 0` a `opacity: 1`) y `e.stopPropagation()` al hacer clic en las flechas para evitar abrir el modal.
  - Se ocultan automáticamente si `images.length <= 1`.
- **`apps/web/src/components/dashboard/project-phase-progress.tsx`** [MODIFY]:
  - Detecta si la fase dispone de fotos (`phase.images.length > 0`).
  - Los hitos de fases completadas con fotografías incrementan su tamaño de `10px` a `15px` con checkmark proporcional (`9px`), resaltando frente a los hitos sin fotos.
  - En hover, el tooltip existente incorpora la insignia `📷 X fotos de avance`.

---

## 3. Atomic Slices & Logical Sequence

- **SPEC-1: Flechas Laterales de Navegación Glassmorphism en Tarjeta Multimedia**
  - **Rama**: `SPEC/jaymusicmachine-BBC-020-s01-glassmorphic-corner-arrows`
  - **Fase RED (TDD)**: Diseñar tests en `tests/unit/project-phase-media-card-arrows.test.tsx` verificando renderizado de franjas laterales de esquina a esquina, revelación en hover, alternancia de imágenes con `stopPropagation()`, y ocultamiento cuando hay 1 o 0 imágenes.
  - **Fase GREEN**: Implementar las franjas laterales glassmorphic en `project-phase-media-card.tsx` con Motion y Lucide icons.
  - **Fase REFACTOR**: Limpieza de código, verificación de estándares y comentarios paso a paso (`// Step N:`).

- **SPEC-2: Hitos de Fase Agrandados con Fotos y Tooltip Informativo**
  - **Rama**: `SPEC/jaymusicmachine-BBC-020-s02-milestone-photo-indicators`
  - **Fase RED (TDD)**: Diseñar tests en `tests/unit/project-phase-progress-dots.test.tsx` validando que las fases completadas con imágenes tengan diámetro agrandado (15px), las fases sin imágenes mantengan 10px, y el tooltip muestre el conteo de fotos sólo en hover.
  - **Fase GREEN**: Actualizar el renderizado del stepper y tooltip en `project-phase-progress.tsx`.
  - **Fase REFACTOR**: Limpieza de estilos, tipado estricto y auditoría clean code.

- **SPEC-3: Feature FDD Image-Detail con Zoom Guard y Modal Lightbox**
  - **Rama**: `SPEC/jaymusicmachine-BBC-020-s03-fdd-image-detail-feature`
  - **Fase RED (TDD)**: Diseñar tests colocalizados:
    - `domain/zoom-boundary-calculator.test.ts` (invariante 1:1, nunca sobrepasar resolución nativa).
    - `application/use-image-zoom.test.ts` (gestión de escala, pan, reset y atajos).
    - `presentation/image-detail-modal.test.tsx` (montaje, accesibilidad, cierre por Escape, navegación).
  - **Fase GREEN**: Implementar los archivos de la feature FDD en `apps/web/src/features/image-detail/` e integrar `ImageDetailModal` en `project-phase-media-card.tsx`.
  - **Fase REFACTOR**: Limpieza de deuda técnica, verificación de rendimiento GPU (`translateZ(0)`) y validación integral de la suite (`pnpm validate`).

---

## 4. TDD (Test-Driven Development) Strategy

### 4.1. Tests Colocalizados en la Feature (`apps/web/src/features/image-detail/`)
1. **`zoom-boundary-calculator.test.ts` (Dominio)**:
   - Valida que para imágenes con dimensiones pequeñas (ej. 400x300) en una pantalla de 1920x1080, `maxScale` esté acotado estrictamente a 1.0 (tamaño real 1:1) impidiendo ampliación artificial.
   - Valida cálculo correcto de `fitScale` cuando la imagen excede la resolución de pantalla.
2. **`use-image-zoom.test.ts` (Aplicación)**:
   - Valida incremento y decremento de escala con límites inferior (`fitScale`) y superior (`maxScale`).
   - Valida reseteo de escala a 1:1 o fit al alternar imágenes o invocar reset.
3. **`image-detail-modal.test.tsx` (Presentación)**:
   - Valida renderizado accesible (`role="dialog"`, `aria-modal="true"`, `aria-label`).
   - Valida que presionar la tecla `Escape` o hacer clic en el botón de cierre ejecute `onClose`.
   - Valida que las flechas de navegación y teclas `ArrowLeft` / `ArrowRight` cambien la imagen activa.

### 4.2. Tests de Componentes del Dashboard (`tests/unit/`)
1. **`project-phase-media-card-arrows.test.tsx`**:
   - Valida presencia de franjas laterales glassmorphic solo con `images.length > 1`.
   - Valida `e.stopPropagation()` al hacer clic en las flechas laterales.
   - Valida apertura del modal al hacer clic en la miniatura fotográfica.
2. **`project-phase-progress-dots.test.tsx`**:
   - Valida diámetro de `15px` para fases completadas con fotografías y `10px` para fases sin fotos.
   - Valida texto `📷 X fotos de avance` en el tooltip visible en hover.

---

## 5. Local Definition of Done (DoD)
- [ ] Documentos duales de requerimientos (`knowledge/features/`) completados y alineados con FDD sin placeholders.
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

