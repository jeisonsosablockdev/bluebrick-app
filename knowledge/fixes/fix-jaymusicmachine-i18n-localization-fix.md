# Problem Spec: i18n-localization-fix

## What problem exists
1. **Subcomponentes del Dashboard en Español**: Diversos subcomponentes interactivos del dashboard de inversión (`ProjectPhaseProgress`, `ProjectPhaseMediaCard`, `ImageDetailModal`, `AvatarUploadModal`, carrusel de oportunidades) tenían textos y atributos de accesibilidad (`aria-label`) estáticos o parcialmente traducidos, impidiendo una experiencia multilingüe completa al conmutar entre Español (`es`), Inglés (`en`) y Portugués (`pt`).
2. **Iconografía del Selector de Idioma**: El conmutador de idioma (`LocaleSwitcher`) no contaba con representaciones visuales claras de banderas nacionales para cada locale soportado:
   - Español (`es`): Bandera de España 🇪🇸
   - Inglés (`en`): Bandera de Estados Unidos 🇺🇸
   - Portugués (`pt`): Bandera de Brasil 🇧🇷
   El uso de emojis Unicode generaba inconsistencias visuales y renderizado degradado en plataformas como Windows y Linux, donde se mostraban caracteres alfanuméricos en lugar de banderas gráficas.

## Why it matters
1. **Experiencia de Usuario Global**: Inversionistas internacionales de habla inglesa y portuguesa requieren que todos los indicadores de avance, detalles fotográficos de obra, carga de avatar y métricas financieras se presenten en su idioma de preferencia con total coherencia.
2. **Estética y Consistencia Visual Multiplataforma**: Las banderas en vectores SVG de alta definición garantizan que la interfaz de BlueBrick mantenga su identidad de lujo institucional sin depender de los glifos de fuentes del sistema operativo del cliente.

## What outcome is expected
1. **Cobertura 100% Multilingüe en Dashboard**:
   - `project-phase-progress.tsx`: Títulos de fase, estados de hito, descripciones y contadores de fotos traducidos dinámicamente con `useI18n()`.
   - `project-phase-media-card.tsx`: Contadores de paginación, textos alternativos y etiquetas ARIA de navegación de imágenes traducidos.
   - `image-detail-modal.tsx`: Controles de zoom, navegación anterior/siguiente, botón de cierre y mensajes de fallback traducidos.
   - `avatar-upload-modal.tsx`: Título del modal, instrucciones de arrastre (dropzone), botones de acción y mensajes de error traducidos.
   - `investment-dashboard.tsx`: Controles de carrusel, estados de envío de lead y errores traducidos.
2. **Componentes SVG de Banderas Vectoriales**:
   - Componentes `SpainFlag`, `UsaFlag`, `BrazilFlag` y despachador `LocaleFlag` integrados en `@/features/i18n`.
   - `LocaleSwitcher` renderiza la bandera correspondiente en el botón trigger y en cada opción del menú desplegable.
3. **Validación Exhaustiva**:
   - Paridad del 100% de claves entre diccionarios `es`, `en` y `pt`.
   - Cobertura completa de pruebas unitarias y de integración sin regresión.

## What gaps exist today
- Faltaban tokens específicos en los diccionarios para `phaseProgress`, `mediaCard`, `avatarModal` e `imageDetail`.
- Faltaban los componentes de banderas SVG nativos y su exportación en la capa de presentación de i18n.

## What questions remain open
- Ninguna. Los requisitos de diseño e internacionalización fueron definidos y verificados.
