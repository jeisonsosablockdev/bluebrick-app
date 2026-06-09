# BRI-168 - UI/UX Fixes and Improvements Implementation Plan

## VERSION ESPAÑOL

### Estado
- Implementation artifact
- Issue: `BRI-168`
- Developer: `czambrano`
- Fuente principal: cuerpo del issue en Linear
- Registro local: este archivo
- Rama principal del issue: `feature/czambrano-bri-168-ui-ux-fixes-and-improvements`

### Dirección de implementación
El trabajo se ejecuta como una serie de SPECS dentro del mismo issue padre. Cada SPEC debe estar primero en Linear, luego reflejado en los `.md` locales, y después implementado en el repositorio.

La rama `feature/czambrano-bri-168-ui-ux-fixes-and-improvements` es la rama `Feature` principal de `BRI-168`. Toda documentación del issue debe quedar plasmada en esta rama y sincronizada con Linear antes de abrir o ejecutar ramas SPEC.

Las ramas SPEC usan la nomenclatura `SPEC/czambrano-bri168-specNN-slug-del-spec`. El orden `SPEC01`, `SPEC02`, `SPEC03` organiza el scope, pero la ejecución puede priorizar estabilidad, dependencias técnicas o riesgo de integración por encima del orden numérico.

### Objetivo de política transversal
Montar estas reglas en los documentos principales de políticas y workflow del proyecto BRIDS:
1. Confirmar con qué desarrollador del proyecto se está trabajando antes de tocar Linear.
2. Confirmar responsable del issue, creador del issue, asignado al desarrollo e identidad de desarrollador para comentarios, actividad de Linear y commits de Git.
3. Confirmar issue destino.
4. Preparar versión en español y versión en inglés.
5. Actualizar el cuerpo del issue como fuente principal.
6. Evitar comentarios sueltos para SPECS.
7. Sincronizar los `.md` locales con el cuerpo del issue.
8. Usar ramas SPEC con formato `SPEC/<developer>-bri<issue>-specNN-<slug>` cuando una rama `Feature` se divida en múltiples SPECS.
9. Documentar `SPEC DEVELOPMENT HISTORY` al final del issue con resultados estables, decisiones reutilizables y aprendizajes validados por SPEC.
10. Ejecutar `SPEC MERGE` como protocolo de cierre interno de cada SPEC antes de integrar hacia la rama `Feature`, sin PR intermedio.

### SPECS de implementación

1. **SPEC01 - Landing Dark Hero Look And Feel**
   - Rama SPEC: `SPEC/czambrano-bri168-spec01-landing-dark-hero-look-and-feel`
   - Objetivo: mejorar el Hero dark mode con fondo azul oscuro, blur gaussiano, glow azul/morado y paneles internos sin borde blanco.
   - **ALCANCE INICIAL PROPUESTO:**
     - `components/sections/hero.tsx`
     - `app/globals.css`
     - Fondo dark mode del Hero.
     - Paneles internos del Hero sin borde blanco.
     - CTA secundario sin borde blanco visible.
     - Menú desplegable del Hero si corresponde al mismo flujo técnico.
   - **Validación inicial:**
     - `npm run lint`
     - evidencia visual en `http://localhost:3000`



2. **SPEC02 - Investment Category Iconography**
   - Rama SPEC: `SPEC/czambrano-bri168-spec02-investment-category-iconography`
   - Objetivo: crear íconos propios para categorías de inversión y reemplazar iconografía genérica.
   - **ALCANCE INICIAL PROPUESTO:**
     - Auditar superficies públicas con categorías de inversión.
     - Identificar íconos genéricos actuales.
     - Diseñar o implementar set inicial de íconos BRIDS.
     - Validar tamaños, pesos visuales, contraste y estados.
   - **Validación inicial:**
     - revisión visual dark/light mode
     - QA responsive de superficies tocadas



3. **SPEC03 - Dark Mode Modules Depth**
   - Rama SPEC: `SPEC/czambrano-bri168-spec03-dark-mode-modules-depth`
   - Objetivo: remover bordes blancos de módulos informativos e introducir profundidad visual limpia.
   - **ALCANCE INICIAL PROPUESTO:**
     - Auditar cards y módulos del landing.
     - Remover contornos blancos innecesarios.
     - Aplicar sombras suaves, gradientes y glass oscuro.
     - Validar contraste y accesibilidad.
   - **Validación inicial:**
     - revisión visual dark/light mode
     - `npm run lint`



4. **SPEC04 - Hero Dropdown Visual System**
   - Rama SPEC: `SPEC/czambrano-bri168-spec04-hero-dropdown-visual-system`
   - Objetivo: extender el tratamiento visual del Hero al menú desplegable.
   - **ALCANCE INICIAL PROPUESTO:**
     - Identificar componente exacto del dropdown.
     - Aplicar matiz azul/morado, blur, sombras y profundidad.
     - Revisar estados hover, active, focus y selected.
     - Validar accesibilidad por teclado.
   - **Validación inicial:**
     - QA interactivo del dropdown
     - revisión responsive



5. **SPEC05 - Landing Header Full Width Visual**
   - Rama SPEC: `SPEC/czambrano-bri168-spec05-landing-header-full-width-visual`
   - Objetivo: rediseñar el header/first viewport con uso total del ancho horizontal y dirección visual urbana/tokenización.
   - **ALCANCE INICIAL PROPUESTO:**
     - Auditar estructura actual del header.
     - Proponer composición full-width.
     - Definir imagen o dirección visual de ciudad, tokenización y fraccionamiento.
     - Definir jerarquía de texto grande.
   - **Validación inicial:**
     - revisión visual desktop/mobile
     - validación de performance del primer viewport



6. **SPEC06 - Scroll Motion Experience**
   - Rama SPEC: `SPEC/czambrano-bri168-spec06-scroll-motion-experience`
   - Objetivo: explorar animación progresiva por scroll usando Motion, Open Design o motor AI actual.
   - **ALCANCE INICIAL PROPUESTO:**
     - Evaluar motor de animación.
     - Definir elementos candidatos para animación por scroll.
     - Prototipar animación mínima.
     - Incluir fallback para `prefers-reduced-motion`.
   - **Validación inicial:**
     - prueba de performance
     - validación de accesibilidad de movimiento



7. **SPEC07 - Marketplace Pins Secondary Scope**
   - Rama SPEC: `SPEC/czambrano-bri168-spec07-marketplace-pins-secondary`
   - Objetivo: retomar mejoras de pins como alcance secundario de `BRI-168`.
   - **ALCANCE INICIAL PROPUESTO:**
     - Revisar visibilidad y jerarquía de pins.
     - Revisar estados selected, hover, focus y active.
     - Validar sincronización map/list/detail.
     - Ejecutar QA responsive de Marketplace.
   - **Validación inicial:**
     - QA map/list/detail
     - QA responsive Marketplace
### Gates
- Linear actualizado como fuente principal.
- `.md` locales congruentes.
- Bilingüe ES/EN completo.
- Sin comentarios sueltos de SPEC en Linear.
- Alcance inicial de cada SPEC validado o ajustado por el desarrollador antes de implementar.
- Validación UI por SPEC.
- `SPEC HISTORY` actualizado antes de cada `SPEC MERGE`.
- Merge interno `SPEC/*` → `Feature` ejecutado sin PR intermedio cuando el desarrollador responsable lo confirme.
- `npm run validate` antes de cerrar el bloque completo.

## ENGLISH VERSION

### Status
- Implementation artifact
- Issue: `BRI-168`
- Developer: `czambrano`
- Primary source: Linear issue body
- Local record: this file
- Main issue branch: `feature/czambrano-bri-168-ui-ux-fixes-and-improvements`

### Implementation Direction
The work runs as a series of SPECS inside the same parent issue. Each SPEC must live in Linear first, then be mirrored in the local `.md` files, and only then implemented in the repository.

The `feature/czambrano-bri-168-ui-ux-fixes-and-improvements` branch is the main `Feature` branch for `BRI-168`. All issue documentation must be captured in this branch and synchronized with Linear before opening or executing SPEC branches.

SPEC branches use the naming convention `SPEC/czambrano-bri168-specNN-spec-slug`. The `SPEC01`, `SPEC02`, `SPEC03` order organizes scope, but execution may prioritize stability, technical dependencies, or integration risk over numeric order.

### Cross-Project Policy Objective
Install these rules into the primary BRIDS policy and workflow documents:
1. Confirm which project developer is responsible before touching Linear.
2. Confirm the issue owner, issue creator, development assignee, and developer identity for comments, Linear activity, and Git commits.
3. Confirm the target issue.
4. Prepare Spanish and English versions.
5. Update the issue body as the primary source.
6. Avoid loose comments for SPECS.
7. Sync local `.md` files with the issue body.
8. Use SPEC branches with the format `SPEC/<developer>-bri<issue>-specNN-<slug>` when a `Feature` branch is divided into multiple SPECS.
9. Document `SPEC DEVELOPMENT HISTORY` at the end of the issue with stable outcomes, reusable decisions, and validated learnings by SPEC.
10. Run `SPEC MERGE` as the internal closing protocol for each SPEC before integrating into the `Feature` branch, without an intermediate PR.

### Implementation SPECS

1. **SPEC01 - Landing Dark Hero Look And Feel**
   - SPEC branch: `SPEC/czambrano-bri168-spec01-landing-dark-hero-look-and-feel`
   - Objective: improve the dark mode Hero with a dark blue background, gaussian blur, blue/purple glow, and borderless internal panels.
   - **PROPOSED INITIAL SCOPE:**
     - `components/sections/hero.tsx`
     - `app/globals.css`
     - Hero dark mode background.
     - Borderless Hero internal panels.
     - Secondary CTA without visible white border.
     - Hero dropdown if it belongs to the same technical flow.
   - **Initial validation:**
     - `npm run lint`
     - visual evidence at `http://localhost:3000`



2. **SPEC02 - Investment Category Iconography**
   - SPEC branch: `SPEC/czambrano-bri168-spec02-investment-category-iconography`
   - Objective: create custom investment category icons and replace generic iconography.
   - **PROPOSED INITIAL SCOPE:**
     - Audit public surfaces with investment categories.
     - Identify current generic icons.
     - Design or implement an initial BRIDS icon set.
     - Validate sizes, visual weights, contrast, and states.
   - **Initial validation:**
     - dark/light mode visual review
     - responsive QA for touched surfaces



3. **SPEC03 - Dark Mode Modules Depth**
   - SPEC branch: `SPEC/czambrano-bri168-spec03-dark-mode-modules-depth`
   - Objective: remove white borders from informational modules and introduce clean visual depth.
   - **PROPOSED INITIAL SCOPE:**
     - Audit landing cards and modules.
     - Remove unnecessary white outlines.
     - Apply soft shadows, gradients, and dark glass.
     - Validate contrast and accessibility.
   - **Initial validation:**
     - dark/light mode visual review
     - `npm run lint`



4. **SPEC04 - Hero Dropdown Visual System**
   - SPEC branch: `SPEC/czambrano-bri168-spec04-hero-dropdown-visual-system`
   - Objective: extend the Hero visual treatment to the dropdown menu.
   - **PROPOSED INITIAL SCOPE:**
     - Identify the exact dropdown component.
     - Apply blue/purple mood, blur, shadows, and depth.
     - Review hover, active, focus, and selected states.
     - Validate keyboard accessibility.
   - **Initial validation:**
     - dropdown interaction QA
     - responsive review



5. **SPEC05 - Landing Header Full Width Visual**
   - SPEC branch: `SPEC/czambrano-bri168-spec05-landing-header-full-width-visual`
   - Objective: redesign the header/first viewport with full horizontal usage and city/tokenization visual direction.
   - **PROPOSED INITIAL SCOPE:**
     - Audit the current header structure.
     - Propose a full-width composition.
     - Define city, tokenization, and fractionalization imagery or visual direction.
     - Define large-text hierarchy.
   - **Initial validation:**
     - desktop/mobile visual review
     - first viewport performance validation



6. **SPEC06 - Scroll Motion Experience**
   - SPEC branch: `SPEC/czambrano-bri168-spec06-scroll-motion-experience`
   - Objective: explore progressive scroll animation using Motion, Open Design, or a current AI engine.
   - **PROPOSED INITIAL SCOPE:**
     - Evaluate animation engine.
     - Define candidate elements for scroll animation.
     - Prototype a minimal animation.
     - Include fallback for `prefers-reduced-motion`.
   - **Initial validation:**
     - performance test
     - motion accessibility validation



7. **SPEC07 - Marketplace Pins Secondary Scope**
   - SPEC branch: `SPEC/czambrano-bri168-spec07-marketplace-pins-secondary`
   - Objective: resume pin improvements as secondary scope for `BRI-168`.
   - **PROPOSED INITIAL SCOPE:**
     - Review pin visibility and hierarchy.
     - Review selected, hover, focus, and active states.
     - Validate map/list/detail synchronization.
     - Run Marketplace responsive QA.
   - **Initial validation:**
     - map/list/detail QA
     - Marketplace responsive QA
### Gates
- Linear updated as primary source.
- Local `.md` files are consistent.
- Complete ES/EN bilingual structure.
- No loose Linear SPEC comments.
- Initial scope for each SPEC validated or adjusted by the developer before implementation.
- UI validation per SPEC.
- `SPEC HISTORY` updated before each `SPEC MERGE`.
- Internal `SPEC/*` → `Feature` merge completed without an intermediate PR when the responsible developer confirms it.
- `npm run validate` before closing the full block.

---

## SPEC DEVELOPMENT HISTORY

---

### SPEC03 - Dark Mode Modules Depth

#### Checkpoint estable: Landing y Marketplace
- Fecha: 2026-06-08.
- Desarrollador responsable: `czambrano`.
- Rama SPEC: `SPEC/czambrano-bri168-spec03-dark-mode-modules-depth`.
- Estado: avance estable dentro de `SPEC03`; no cierra el SPEC, pero deja un punto seguro para volver antes de continuar con nuevos módulos.

#### Implementación consolidada
- BRIDS Landing usa utilidades `landing-depth-*` para reemplazar bordes blancos por profundidad visual con gradientes suaves, sombras limpias y contraste controlado.
- Marketplace usa utilidades `marketplace-depth-*` y `marketplace-brand-pill` para filtros, botones, tarjetas, pins, mapa y módulos analíticos.
- El modal de detalle usa utilidades `marketplace-detail-*` para panel, tarjetas internas, alertas, media frame, controles de cantidad, CTA y scrollbar.
- Light mode quedó validado con overrides específicos para labels, textfields, botones, badges, porcentajes de mapa, ejes de gráficas y contenido de cards.
- Las gráficas eliminan ruido visual: donut sin bordes blancos, funnel sin recuadro gris de selección y tooltips conservados.
- El loading del modal cambia de animación repetitiva a progreso determinate ascendente con fases reales de carga y lectura progresiva del payload cuando está disponible.
- La transición Landing → Marketplace limpia `clipPath` al completar la animación para evitar overlays persistentes.

#### Aprendizajes técnicos aprobados
- No modificar el componente global `Card` para este SPEC; usar clases de alcance específico reduce regresiones en superficies no auditadas.
- Evitar hover glow en módulos grandes cuando el usuario aprueba una lectura más limpia y estática.
- Mantener profundidad con gradientes, sombras internas y radios completos en vez de bordes blancos o sombras rectangulares.
- Validar dark mode y light mode en cada ajuste visual, porque un patrón correcto en dark mode puede perder legibilidad sobre fondos claros.
- Conectar indicadores de progreso a señales reales de carga siempre que sea posible; una barra que se reinicia o se detiene sin razón rompe la confianza de la interfaz.

#### Validación
- `npm run lint`: aprobado.
- Revisión visual local en `http://localhost:3000/`.
- Revisión visual local en `http://localhost:3000/marketplace`.
- Checkpoint listo para commit estable antes de continuar el alcance restante de `SPEC03`.

#### Cierre de desarrollo local
- Fecha de cierre local: 2026-06-08.
- Desarrollador responsable: `czambrano`.
- Rama SPEC: `SPEC/czambrano-bri168-spec03-dark-mode-modules-depth`.
- Estado: desarrollo de `SPEC03` terminado y listo para commit de cierre.

#### Alcance implementado
- BRIDS Landing: módulos y recuadros sin bordes blancos, profundidad visual limpia y compatibilidad dark/light.
- Marketplace: filtros, botones, listing cards, pins, mapa, gráficas, indicadores, modal de detalle, scrollbar y loading con sistema borderless/depth.
- Transparencia: módulos, timeline, CTA, bloques on-chain, footer visual y formulario adaptados al mismo concepto de profundidad y gradientes.
- Header público: Transparencia hereda la misma UX sticky/flotante de Landing al mantener el header dentro del contenedor largo de la página.
- Contact form: bloque gradiente azul/morado con campos, selects, checkbox y botón adaptados a dark mode y light mode.

#### Implementación final consolidada
- `app/globals.css` concentra las utilidades visuales específicas para `landing-depth-*`, `marketplace-depth-*`, `marketplace-detail-*`, `transparency-depth-*` y `contact-gradient-*`.
- `components/sections/*` usa las clases de Landing sin alterar el componente global `Card`.
- `components/marketplace/*` usa clases scoped para preservar comportamiento de datos, compra, mapa y detalle.
- `app/transparencia/client.tsx` usa clases específicas de Transparencia y evita depender de estilos globales genéricos de glass/border.
- `app/transparencia/page.tsx` alinea la estructura con Landing para preservar la experiencia sticky del header.
- `components/sections/contact-form.tsx` adopta el patrón gradiente BRIDS y fields temáticos sin modificar formularios globales.
- `lib/motion.ts` limpia `clipPath` al terminar transiciones para evitar overlays persistentes entre rutas.

#### Decisiones reutilizables
- No usar bordes blancos para separar módulos premium; usar profundidad por gradiente, blur, sombra suave y contraste con el fondo.
- No aplicar hover glow agresivo a módulos grandes en light mode; si genera una sombra gris o selección visual falsa, debe apagarse por tema.
- Separar dark mode y light mode con overrides scoped por superficie cuando una pieza visual necesita conservar identidad de marca.
- Los botones de light mode deben usar gradiente cyan/blue/purple claro con texto blanco y sombra suave, no pills azul noche con texto oscuro.
- Los textfields en light mode sobre paneles gradiente deben ser claros, con texto navy y placeholder slate.
- Las animaciones o indicadores de progreso deben reflejar señales reales o fases claras; no deben reiniciarse ni retroceder visualmente.

#### Validación final
- `git diff --check`: aprobado.
- `npm run lint`: aprobado.
- `npm run validate`: bloqueado en `npm run typecheck` por errores externos en `.next/types/app/api/protected/overview/route.ts` y `.next/types/app/api/protected/portfolio/route.ts`; los archivos fuente de esas rutas no pertenecen al alcance de `SPEC03` ni fueron modificados por este cierre.
- Capturas locales revisadas en dark mode y light mode para `http://localhost:3000/`.
- Capturas locales revisadas en dark mode y light mode para `http://localhost:3000/marketplace`.
- Capturas locales revisadas en dark mode y light mode para `http://localhost:3000/transparencia`.
- Captura con hover validó que el módulo de cierre de Transparencia no muestra sombra gris incorrecta en light mode.

#### Estado post SPEC MERGE
- `SPEC03` queda terminado a nivel de desarrollo local y consolidado en la rama Feature.
- Commit estable de checkpoint: `dbbb35d feat(app): checkpoint marketplace landing spec03`.
- Commit de cierre del SPEC: `5d05107 feat(app): finish spec03 transparency depth`.
- Merge a Feature completado: `aac3913 feat(app): merge spec03 dark mode modules depth`.
- Author y committer usados para los commits del SPEC: `czambrano`.
- Linear queda como fuente principal y este documento actúa como espejo local Git del historial de desarrollo.
