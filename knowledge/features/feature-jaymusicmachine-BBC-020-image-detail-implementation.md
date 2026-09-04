# Problem Spec: Detalle y Experiencia de Visualización de Imágenes en Dashboard (BBC-020)

## What problem exists
En el panel del inversionista (Dashboard), dentro de la sección **'AVANCE DE OBRA POR FASES'** (`ProjectPhaseProgress.tsx` y `ProjectPhaseMediaCard.tsx`):
1. **Imposibilidad de Inspección a Detalle de Obra**: La miniatura de avance fotográfico sólo se muestra en un contenedor compacto (aprox. 120px de altura mínima). Al hacer clic sobre ella no ocurre ninguna acción, impidiendo al inversionista examinar en alta resolución los avances físicos reales (e.g. calidad de cimentación, armaduras de acero, tuberías empotradas, aplomado de muros o acabados). Además, si se habilitara un zoom indiscriminado sin control de escala nativa, las imágenes de resoluciones moderadas se pixelarían, degradando la percepción de calidad de la plataforma.
2. **Falta de Descubrimiento de Fases con Fotografías**: En la barra horizontal de hitos de obra (`ProjectPhaseProgress.tsx`), todos los puntos completados lucen idénticos (círculos verdes uniformes de 10px con checkmarks diminutos). El usuario no tiene forma inmediata de discernir cuáles fases contienen evidencia fotográfica registrada y cuáles no, obligándolo a hacer clic a ciegas en cada una para descubrir contenido visual.
3. **Navegación Poco Intuitiva en Miniatura**: El carrusel de la tarjeta multimedia solo cuenta con micro-dots inferiores y una auto-rotación cada 4s. Carece de controles manuales laterales directos y accesibles (flechas prev/next). Las flechas deben ser fluidas, elegantes, ocupar toda la esquina vertical con estilo glassmorphic y revelarse sutilmente solo bajo hover para no ensuciar la composición visual.

## Why it matters
La propuesta de valor fundamental de BlueBrick radica en la transparencia y auditoría fotográfica de los proyectos inmobiliarios para los inversionistas. Si la interfaz limita la visualización a una estampa pequeña, el inversionista no puede apreciar el valor real de su inversión ni auditar los detalles constructivos.
- **Transparencia Tangible**: Permitir zoom óptico respetando estrictamente el tamaño nativo de la imagen (sin pixelación) garantiza una experiencia técnica impecable y ligera.
- **Usabilidad y Navegabilidad**: Distinguir los hitos con fotografías en la barra de progreso ahorra tiempo al usuario y destaca el volumen de avance documentado.
- **Estética de Lujo (Glassmorphism)**: Incorporar controles laterales con desenfoque de fondo dinámico (`backdrop-filter`) al hacer hover preserva la sofisticación de la marca BlueBrick sin saturar la pantalla.

## What outcome is expected
1. **Modal Lightbox Expandido con Zoom Guard**:
   - Al hacer clic en la miniatura de avance fotográfico, se abre un modal de visualización en alta definición mediante Motion (`AnimatePresence`).
   - Soporte de controles de zoom: botones `(+)`, `(-)`, `(1:1 / Reset)`, rueda del ratón (mouse wheel) y doble clic para alternar entre "ajustar a pantalla" y "tamaño real máximo sin pixelar".
   - **Zoom Guard (Invariante)**: El zoom máximo está estrictamente limitado a la resolución nativa de la imagen (`naturalWidth` / `naturalHeight`), impidiendo distorsión o pixelado.
   - Navegación interna entre imágenes de la fase mediante flechas laterales y teclado (`←` / `→`).
   - Cierre ágil mediante tecla `Escape`, botón `(X)` o clic en el fondo oscurecido con `backdrop-filter: blur(16px)`.
   - Soporte de pan/arrastre con el cursor cuando la imagen está ampliada para explorar cuadrantes de la obra.
2. **Hitos Prominentes en Barra de Fases con Fotos**:
   - En la barra de avance por fases, los puntos completados que tienen imágenes (`images.length > 0`) incrementan su diámetro de `10px` a `15px` con un checkmark proporcionalmente mayor, permitiendo una rápida identificación visual.
   - El tooltip emergente (visible sólo en hover) exhibe el badge de conteo fotográfico: `📷 X fotos de avance`.
3. **Flechas Laterales Glassmorphism en Miniatura**:
   - En `ProjectPhaseMediaCard`, se añaden controles laterales izquierdo y derecho que abarcan toda la esquina/altura del contenedor.
   - Base estilizada en glassmorphism (`backdrop-filter: blur(8px)`, semi-transparencia oscura `rgba(10, 18, 32, 0.45)`, borde sutil).
   - Revelación suave únicamente al hacer hover (`opacity: 0` a `opacity: 1`).
   - Clic con `stopPropagation()` para alternar fotos sin disparar la apertura del modal.
   - Se ocultan automáticamente si la fase dispone de 1 o 0 imágenes.

## What gaps exist today
- `apps/web/src/components/dashboard/project-phase-media-card.tsx`:
  - No cuenta con listener de clic para expandir en modal.
  - No posee componentes ni estilos para flechas laterales de altura completa con base glassmorphic.
- `apps/web/src/components/dashboard/project-phase-progress.tsx`:
  - Todos los hitos de fase completados se renderizan con un tamaño fijo de 10px sin importar si tienen o no fotos.
  - El tooltip de cada punto muestra únicamente nombre y estado, sin informar si la fase contiene fotografías.
- Ausencia de componente modal lightbox:
  - No existe un componente `ProjectPhaseMediaModal.tsx` que maneje el estado de zoom, el guard contra pixelación y la navegación de alta resolución.

## What questions remain open
- Ninguna. Todas las decisiones de interacción fueron acordadas con el usuario:
  1. Controles visibles de zoom `(+)`, `(-)`, `(1:1 / Reset)` + soporte de rueda de ratón, doble clic y arrastre (pan/drag) cuando esté ampliada.
  2. Flechas de navegación en modal y soporte de teclado (`←`, `→`, y `Escape` para cerrar).
  3. Hitos completados con fotos agrandados a 15px; tooltip informativo de fotos únicamente al hacer hover; fases en curso mantienen su indicador estándar.
  4. Flechas laterales en miniatura abarcan toda la altura de esquina a esquina con base glassmorphic, revelándose en hover y con propagación detenida.
  5. Sincronización Linear omitida explícitamente (`skip linear sync`).
