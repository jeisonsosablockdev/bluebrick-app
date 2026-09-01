# Problem Spec: Consumo y Renderizado de Imágenes Reales en Avance de Obra (BBC-015 / BBC-15)

## What problem exists
En el panel del inversionista (Dashboard), dentro de la sección **'AVANCE DE OBRA POR FASES'** (`ProjectPhaseProgress.tsx`), la tarjeta de multimedia situada a la derecha de la información de la fase actual muestra únicamente un placeholder estático: un contenedor verde con un icono genérico de imagen (`<ImageIcon size={22} />`) y una etiqueta de texto (`${currentPhase.name} · avance 1`).

A pesar de que:
1. La tabla `dashboard_project_phases` almacena hasta tres URLs fotográficas de obra por fase (`imagen_url_1`, `imagen_url_2`, `imagen_url_3`).
2. El repositorio `InvestmentRepository.ts` ya mapea y filtra estos campos hacia `property.phases[].images: string[]`.
3. El componente `ProjectPhaseProgress.tsx` ya contiene la lógica de estado para carrusel (`activeImageIndex`, auto-rotación cada 4s, dots de paginación y pausa al colocar el cursor encima con `isHoveredOnMedia`).

**El componente no renderiza la imagen real (`<img>` o `<Image />`)**. En su lugar, sólo dibuja el icono y texto en un bloque verde fijo, impidiendo que el inversionista visualice el progreso físico fotográfico de su propiedad inmobiliaria (ej. cimentación, columnas, cerramientos, acabados en Carrollwood, Bush Garden, etc.).

## Why it matters
La propuesta de valor central de BlueBrick para los inversionistas radica en la transparencia radical y la trazabilidad de sus activos en construcción. Al ingresar a su panel, el inversionista espera auditar visualmente los avances de obra reportados por la constructora en cada fase mediante fotografías reales. Dejar un icono decorativo genérico crea una experiencia incompleta ("empty state" aparente) y no capitaliza las URLs fotográficas ya sincronizadas desde las hojas de cálculo y base de datos PostgreSQL.

## What outcome is expected
1. **Renderizado de Imágenes Fotográficas Reales**:
   - Cuando `currentPhase.images` contiene al menos una URL válida, la tarjeta de multimedia renderiza la imagen fotográfica real ocupando el contenedor (`object-fit: cover`), con bordes suaves (`border-radius: 12px`) y protección de aspect-ratio para prevenir Layout Shifts (CLS = 0).
   - Se incluye un gradiente overlay semitransparente oscuro en la parte inferior para asegurar que el título de la fase y el número de foto (`1/3`, etc.) sean legibles con cualquier iluminación de la foto.
2. **Animaciones de Transición Suaves con Motion**:
   - Al alternar de imagen (ya sea automáticamente por el ciclo de 4s o al hacer clic en los dots de paginación), la imagen transiciona con una animación fluida de opacidad/fade (`AnimatePresence` / `motion.img`).
3. **Fallback Robusto y Elegante**:
   - Si una fase no dispone de fotografías registradas (`images` vacío o con URLs rotas/nulas), la tarjeta preserva el diseño existente de gradiente temático esmeralda de lujo con el icono `<ImageIcon />` y el texto de fase como fallback sin romper el layout.
4. **Integración con Datos Demo y Reales**:
   - Las inversiones de fallback/demo de Sofía Martínez contarán con URLs fotográficas representativas de arquitectura y construcción de alta calidad en sus fases activas para garantizar que la experiencia interactiva sea visible tanto en modo demo como con cuentas reales.
5. **Accesibilidad y Rendimiento**:
   - Atributos `alt` accesibles y descriptivos (`Foto de avance N de [nombre_fase]`).
   - Carga diferida (`loading="lazy"` o decoding asíncrono) para optimizar el rendimiento y First Contentful Paint.

## What gaps exist today
- `apps/web/src/components/dashboard/project-phase-progress.tsx` (L495-L594): La tarjeta de previsualización sólo dibuja `<ImageIcon />` y omite el elemento visual de imagen real con `src={currentPhoto}`.
- `apps/web/src/components/dashboard/project-phase-progress.tsx`: Falta un contenedor `overflow: hidden` con posicionamiento relativo que soporte la imagen fotográfica de fondo con `object-fit: cover` y overlay de contraste.
- En los datos de fallback de propiedades (`FALLBACK_PROPERTIES` en `dashboard/page.tsx` o `DEFAULT_PHASES`), no se proveen URLs fotográficas de demostración en `DEFAULT_PHASES`, haciendo que en modo demo siempre aparezca el fallback vacío.

## What questions remain open
- Ninguna: La UI especificada por el usuario en la imagen adjunta delimita exactamente el área donde deben visualizarse las imágenes provistas por `imagen_url_1`, `imagen_url_2`, `imagen_url_3`, utilizando la infraestructura de carrusel y temporizador ya existente.
