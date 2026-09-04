# Problem Spec: Detalle y Experiencia de Visualización de Imágenes en Dashboard — Feature FDD (BBC-020)

## What problem exists
En la plataforma BlueBrick, la inspección fotográfica de alta resolución para avances de obra, planos arquitectónicos e inmuebles carece de una **Vertical Slice autónoma en Feature-Driven Design (FDD)** y presenta deficiencias directas en la experiencia de usuario del dashboard:

1. **Ausencia de una Feature FDD para Detalle e Inspección de Imágenes (`apps/web/src/features/image-detail`)**:
   Actualmente no existe una feature modular dedicada a la visualización, lightbox, zoom e inspección de imágenes. Implementar la funcionalidad de inspección de fotos como código acoplado a un componente específico del dashboard (`components/dashboard/`) violaría el **Pilar 1 de la arquitectura del monorepo (FDD / Vertical Slices)**, generando dispersión técnica, código duplicado e impidiendo que otros dominios (e.g. Marketplace, ficha de propiedad, documentos) puedan reutilizar esta capacidad de inspección de alta fidelidad.

2. **Imposibilidad de Inspección a Detalle de Obra en Dashboard**:
   En la sección **'AVANCE DE OBRA POR FASES'** (`ProjectPhaseProgress.tsx` y `ProjectPhaseMediaCard.tsx`), la miniatura fotográfica sólo se muestra en un contenedor compacto (altura mínima 120px). Al hacer clic sobre ella no ocurre ninguna acción, impidiendo auditar en alta resolución detalles constructivos reales (cimentación, armaduras, muros, acabados). Además, un zoom sin control de escala nativa causaría pixelación y deterioro de la percepción de calidad.

3. **Falta de Descubrimiento de Fases con Fotografías en el Stepper**:
   En la barra horizontal de hitos de obra (`ProjectPhaseProgress.tsx`), todos los puntos completados lucen idénticos (círculos verdes uniformes de 10px con checkmarks diminutos). El inversionista no puede discernir rápidamente cuáles fases disponen de evidencia fotográfica registrada y cuáles no.

4. **Navegación Poco Intuitiva en Miniatura**:
   El carrusel de la tarjeta multimedia solo cuenta con micro-dots inferiores y auto-rotación de 4s. Carece de controles manuales laterales directos, fluidos y accesibles (flechas de navegación que ocupen toda la esquina vertical con estilo glassmorphic y revelación en hover).

## Why it matters
- **Alineación Arquitectónica FDD**: Según `knowledge/architecture/architecture-overview.md`, las capacidades de negocio deben organizarse en rebanadas verticales autónomas dentro de `apps/web/src/features/[feature_name]/` con un **Public API Boundary (`index.ts`)**. La inspección de imágenes fotográficas es una capacidad nuclear de transparencia inmobiliaria que debe ser un ciudadano de primer nivel en el árbol de features.
- **Transparencia Radical sin Pixelación (Zoom Guard)**: El inversionista requiere auditar los avances físicos con zoom óptico seguro, garantizando matemáticamente que la escala nunca sobrepase la resolución nativa 1:1 (`naturalWidth` / `naturalHeight`) de la fotografía.
- **Usabilidad y Jerarquía Visual**: Destacar los hitos con fotografías en la barra de progreso ahorra fricción al inversionista y comunica de inmediato el volumen de avance documentado.
- **Estética de Lujo (Glassmorphism)**: Incorporar controles laterales con desenfoque de fondo dinámico (`backdrop-filter`) al hacer hover preserva la sofisticación visual de BlueBrick sin sobrecargar la interfaz.

## What outcome is expected
1. **Vertical Slice FDD Canónica (`apps/web/src/features/image-detail/`)**:
   - Creación de la feature autónoma con sus 4 capas funcionales internas:
     - `presentation/`: Modal lightbox accesible con Motion (`AnimatePresence`), backdrop blur y controles.
     - `application/`: Hook reactivo `useImageZoom` para gestión de escala, arrastre (pan/drag) y navegación.
     - `domain/`: Calculador puro de Zoom Guard (`ZoomBoundaryCalculator`) que acota la escala a 1:1 nativo.
     - `infrastructure/`: Extracción cliente de dimensiones reales (`naturalWidth`, `naturalHeight`).
     - `index.ts`: Punto de entrada único (`Public API Boundary`) que exporta únicamente los contratos y componentes públicos.
   - Tests colocalizados exhaustivos (`*.test.ts`, `*.test.tsx`) dentro de la propia feature.
2. **Consumo Desacoplado en Dashboard (`ProjectPhaseMediaCard`)**:
   - Al hacer clic en la miniatura con fotografía real, se abre el modal consumido desde `@/features/image-detail`.
   - Soporte de controles de zoom: botones visibles `(+)`, `(-)`, `(1:1 / Reset)`, rueda del ratón (wheel), doble clic para alternar fit/1:1, y arrastre (pan/drag) cuando la imagen está ampliada.
   - Navegación entre imágenes de la fase mediante flechas laterales y teclado (`←` / `→`). Cierre ágil con `Escape`, botón `(X)` o clic en backdrop.
3. **Flechas Laterales Glassmorphism en Miniatura**:
   - Franjas de navegación laterales que abarcan toda la altura del contenedor en `ProjectPhaseMediaCard`.
   - Base estilizada en glassmorphism (`backdrop-filter: blur(8px)`, `rgba(10, 18, 32, 0.45)`).
   - Revelación suave únicamente en hover (`opacity: 0` a `opacity: 1`).
   - Clic con `stopPropagation()` para alternar fotos sin disparar el modal. Ocultamiento si `images.length <= 1`.
4. **Hitos Prominentes en Barra de Fases con Fotos**:
   - Los puntos completados con fotografías (`images.length > 0`) incrementan su diámetro de `10px` a `15px` con checkmark proporcionalmente mayor.
   - Tooltip emergente (sólo en hover) exhibe el badge de conteo fotográfico: `📷 X fotos de avance`.
   - Fases en curso conservan su tamaño y pulso característico.

## What gaps exist today
- Inexistencia del directorio y módulo de feature `apps/web/src/features/image-detail/`.
- `apps/web/src/components/dashboard/project-phase-media-card.tsx` no cuenta con trigger para modal ni flechas laterales glassmorphic.
- `apps/web/src/components/dashboard/project-phase-progress.tsx` dibuja todos los hitos con tamaño uniforme de 10px y no informa de fotos en el tooltip.

## What questions remain open
- Ninguna. Criterios y requerimientos acordados y clarificados con el usuario:
  1. Controles visibles de zoom `(+)`, `(-)`, `(1:1 / Reset)`, soporte de rueda de ratón, doble clic y pan/drag.
  2. Flechas de navegación en modal y teclado (`←`, `→`, y `Escape` para cerrar).
  3. Hitos completados con fotos agrandados a 15px; tooltip informativo de fotos únicamente en hover; fases en curso mantienen su tamaño estándar.
  4. Flechas laterales en miniatura de altura completa con base glassmorphic, reveladas en hover y con propagación detenida.
  5. Sincronización Linear omitida explícitamente (`skip linear sync`).
