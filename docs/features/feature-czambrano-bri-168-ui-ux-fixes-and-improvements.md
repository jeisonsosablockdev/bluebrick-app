# BRI-168 - UI/UX Fixes and Improvements

## VERSION ESPAÑOL

### Ownership
- Issue: `BRI-168`
- Developer: `czambrano`
- Team: `BRIDS App`
- Linear source of truth: cuerpo del issue `BRI-168`
- Local Git record: `docs/features/feature-czambrano-bri-168-ui-ux-fixes-and-improvements.md`
- Rama principal del issue: `feature/czambrano-bri-168-ui-ux-fixes-and-improvements`
- Rol de la rama: rama `Feature` principal para documentación, SPECS e implementación de `BRI-168`.

### Política de rama
Toda documentación, SPEC o cambio de implementación relacionado con `BRI-168` debe vivir primero en la rama principal `feature/czambrano-bri-168-ui-ux-fixes-and-improvements` y mantenerse congruente con el cuerpo del issue en Linear.

La rama `Feature` principal se divide en múltiples ramas `SPEC`, desarrolladas una por una según estabilidad, dependencia técnica y prioridad del producto. El orden numérico ayuda a organizar el scope, pero no obliga a ejecutar los SPECS en ese orden si la estabilidad del producto recomienda otra secuencia.

La nomenclatura de ramas SPEC para este issue es:

```text
SPEC/czambrano-bri168-specNN-slug-del-spec
```

Ejemplo:

```text
SPEC/czambrano-bri168-spec01-landing-dark-hero-look-and-feel
```

Cada rama SPEC debe partir desde la rama `Feature` principal y volver a ella para revisión. El cierre completo del bloque debe integrarse desde la rama `Feature` principal hacia la rama base definida por el flujo del proyecto.

### Objetivo
Mejorar la calidad visual, consistencia de marca y experiencia de uso del landing page y de las superficies públicas relacionadas, con foco en un dark mode más limpio, módulos con mayor profundidad visual, iconografía propia para categorías de inversión, un Hero más premium y una base preparada para interacciones modernas con animación progresiva.

El alcance general de este issue queda limitado a las mejoras UI/UX documentadas en este scope general. Cualquier trabajo que no contribuya directamente a estos objetivos debe abrirse en otro scope o issue.

### Objetivo transversal de política de desarrollo
Integrar en los documentos principales de políticas, documentación y workflow del proyecto BRIDS una regla transversal para:
- Confirmar siempre con qué desarrollador del proyecto se está trabajando antes de crear, actualizar o sincronizar contenido en Linear.
- Confirmar, antes de ejecutar protocolos de inicio de desarrollo, quién queda como responsable del issue, quién creó el issue, a quién está asignado el desarrollo y qué identidad de desarrollador quedará asociada a comentarios, actividad de Linear y commits de Git.
- Usar Linear como fuente principal para issues, objetivos, SPECS y criterios de aceptación.
- Mantener los `.md` locales como registro Git congruente con Linear.
- Evitar que los SPECS principales vivan en comentarios sueltos de Linear.
- Estandarizar la documentación bilingüe con `VERSION ESPAÑOL` primero y `ENGLISH VERSION` después.
- Exigir tildes, puntuación y ortografía correcta en toda documentación escrita en español.
- Documentar la nomenclatura de ramas SPEC como `SPEC/<developer>-bri<issue>-specNN-<slug>` dentro del workflow principal del proyecto.
- Incorporar `SPEC HISTORY` como registro obligatorio al final de cada SPEC para documentar patrones, decisiones y resultados que quedaron estables.
- Incorporar `SPEC MERGE` como protocolo de finalización de cada SPEC: actualizar historia local, sincronizar Linear, validar estado técnico y hacer merge de la rama `SPEC` hacia la rama `Feature` sin PR intermedio.

### Objetivos específicos
1. Mejorar iconografía de categorías de inversión.
   - Reemplazar iconografía genérica o basada en íconos predefinidos de teclado.
   - Crear íconos propios para BRIDS, respetando manual de marca, estilos, pesos visuales y consistencia entre categorías.
   - Asegurar que los íconos sean legibles en dark mode y light mode.

2. Mejorar módulos en dark mode.
   - Quitar bordes blancos de los recuadros que contienen información.
   - Reemplazar contornos visibles por sombras suaves, gradientes de fondo y capas glass limpias.
   - Mejorar contraste entre módulos y fondo de página para generar profundidad sin ruido visual.
   - Mantener una calidad visual de agencia de diseño: superficies sobrias, premium y consistentes.

3. Mejorar el Hero.
   - Cambiar el fondo dark mode del Hero desde blanco/transparente hacia azul oscuro con blur gaussiano.
   - Incorporar brillos y gradientes en las zonas de color.
   - Mantener contenido, rutas y datos dinámicos mientras se mejora la expresión visual.
   - Mejorar también el menú desplegable del Hero con la misma paleta y matiz visual de la tarea.

4. Mejorar el Header del Landing Page.
   - Evolucionar el landing hacia una experiencia moderna que use mejor el ancho horizontal.
   - Incorporar una imagen llamativa, imponente y minimalista que comunique ciudad, tokenización y fragmentación inmobiliaria.
   - Trabajar texto grande, editorial y cambiante a medida que el usuario se desplaza hacia abajo.
   - Como segundo alcance, explorar animación basada en scroll usando Motion, Open Design o un motor actual de animación asistida por AI.

### SPECS definidos

#### SPEC01 - Landing Dark Hero Look And Feel
- Rama SPEC: `SPEC/czambrano-bri168-spec01-landing-dark-hero-look-and-feel`
- Objetivo: mejorar el Hero dark mode con fondo azul oscuro, blur gaussiano, brillos azul/morado y paneles internos sin borde blanco.
- Estado: implementado en la rama SPEC y validado localmente.

##### ALCANCE INICIAL PROPUESTO
- `components/sections/hero.tsx`
- `app/globals.css`
- Fondo dark mode del Hero.
- Paneles internos del Hero sin borde blanco.
- CTA secundario del Hero sin borde blanco visible.
- Compatibilidad visual con light mode.
- Menú desplegable del Hero con el mismo matiz visual, si pertenece técnicamente al mismo componente o flujo.

##### Criterios de aceptación iniciales
- En dark mode, el Hero usa un fondo azul oscuro con blur gaussiano ambiental.
- Los recuadros del Hero no muestran bordes blancos.
- Las capas internas usan sombras suaves, glass oscuro o gradientes para profundidad.
- El contenido del Hero conserva copy, orden, CTAs, rutas y datos dinámicos.
- Light mode sigue siendo usable.
- El cambio no modifica el componente global `Card`.

##### Evidencia de implementación
- `npm run lint`: aprobado.
- `npm run typecheck`: bloqueado durante `SPEC MERGE` por errores externos en `.next/types/app/api/protected/overview/route.ts` y `.next/types/app/api/protected/portfolio/route.ts`; las rutas fuente no pertenecen al alcance ni fueron modificadas por `SPEC01`.
- `npm run build`: bloqueado por error externo en `app/api/protected/overview/route.ts`; el archivo no pertenece al alcance ni fue modificado por `SPEC01`.
- Inspección visual desktop dark/light en `http://localhost:3000`.
- Inspección responsive móvil: sin overflow horizontal y paneles del Hero con borde computado `0px`.
- Ajuste visual solicitado: el header público usa superficie mate oscura con blur gaussiano y sin bordes blancos computados en shell, pills, selector de idioma y toggle de tema.
- Corrección puntual: el pill `Marketplace` ya no usa sombra exterior rectangular; conserva profundidad con sombras internas redondeadas para no degradar la calidad visual.
- Corrección puntual active state: el pill activo de `Marketplace` en modo oscuro elimina la sombra exterior rectangular y usa profundidad interna redondeada con borde computado `0px`.
- Corrección puntual light mode: el pill del logo BRIDS conserva el mismo tratamiento oscuro mate del dark mode y elimina el gris plano anterior.
- Corrección puntual light mode refinada: el pill del logo BRIDS usa un azul noche sólido, equivalente al color de referencia, para evitar que la transparencia sobre fondo claro lo vuelva gris.
- Microinteracción del header: los pills del Hero/header adoptan la misma sensación del botón `Ingresar`, con elevación suave en hover, presión en active y fallback para `prefers-reduced-motion`.
- Corrección de glitch: el theme toggle ya no anima todo el recuadro al pasar sobre el label; la microinteracción ocurre solo al pasar sobre el switch.
- Corrección de glitch: el selector de idioma ya no anima todo el contenedor; la microinteracción ocurre solo sobre el botón de idioma bajo el cursor.
- Corrección de margen: el contenedor de navegación desktop agrega respiración vertical para que el pill activo `Marketplace` pueda elevarse en hover sin recortarse.
- Corrección light mode: el switch de tema reemplaza el amarillo por el gradiente azul/morado de BRIDS en track y thumb.
- Corrección de microinteracción del switch: el track interno queda anclado en una columna fija, permanece estático entre estados dark/light y el círculo es el único elemento que viaja y anima hover/press.
- Observación fuera de alcance: cualquier rediseño estructural del header móvil se reserva para el scope de Header/Dropdown.

##### SPEC HISTORY
- Resultado estable: el Hero dark mode quedó con base azul noche, blur gaussiano, glows azul/morado y paneles sin bordes blancos visibles.
- Resultado estable: el header público quedó como superficie mate oscura, con profundidad por blur, sombras internas y gradientes sutiles en lugar de contornos blancos.
- Resultado estable: los pills del header, incluyendo `Marketplace`, conservan microinteracción premium sin sombras rectangulares, sin recortes en hover y con estados activos limpios.
- Resultado estable: el pill de marca BRIDS conserva un azul noche sólido en light mode, evitando el gris lavado sobre fondos claros.
- Resultado estable: el selector de idioma y el theme toggle mantienen el contenedor estable; solo anima el elemento interactivo bajo el cursor o el círculo del switch.
- Decisión de diseño validada: las sombras exteriores rectangulares degradan la calidad visual de los pills; el patrón aceptado es usar profundidad interna, gradientes suaves y radios completos.
- Decisión de interacción validada: los contenedores de navegación y switch deben permanecer estáticos; las microinteracciones se concentran en el elemento accionable para evitar glitches.
- Decisión de implementación validada: aislar estilos del landing mediante clases `landing-*` permite mejorar esta superficie sin alterar componentes globales como `Card`.
- Evidencia de estabilidad: `npm run lint`, inspección visual desktop/mobile y mediciones runtime confirmaron bordes `0px`, track estático y hover sin recorte; `npm run typecheck` queda bloqueado por rutas externas al SPEC.
- Aprendizaje para futuros SPECS: cuando el usuario marca un ajuste como perfecto, ese patrón debe promoverse a historial estable del SPEC y reutilizarse como referencia visual o interactiva.

#### SPEC02 - Investment Category Iconography
- Rama SPEC: `SPEC/czambrano-bri168-spec02-investment-category-iconography`
- Objetivo: reemplazar la iconografía genérica de categorías de inversión por íconos propios de BRIDS, consistentes con marca y legibles en dark/light mode.

##### ALCANCE INICIAL PROPUESTO
- Identificar todas las superficies públicas donde aparecen categorías de inversión.
- Auditar íconos actuales genéricos, de teclado o de librería que no representen la marca.
- Diseñar o implementar un set inicial de íconos propios para categorías prioritarias.
- Definir pesos visuales, tamaños, contenedores, estados y contraste para dark mode y light mode.
- Documentar reglas de uso para que futuras categorías mantengan consistencia.

##### Criterios de aceptación iniciales
- Las categorías priorizadas ya no dependen de íconos genéricos sin criterio de marca.
- Los íconos mantienen coherencia visual entre sí.
- Los íconos son legibles en dark mode y light mode.
- La implementación no rompe layouts responsive existentes.

#### SPEC03 - Dark Mode Modules Depth
- Rama SPEC: `SPEC/czambrano-bri168-spec03-dark-mode-modules-depth`
- Objetivo: limpiar los módulos en dark mode removiendo bordes blancos y reemplazándolos por profundidad visual más premium.

##### ALCANCE INICIAL PROPUESTO
- Identificar cards, recuadros y módulos informativos del landing page y superficies públicas relacionadas.
- Remover bordes blancos o contornos de alto ruido visual.
- Introducir sombras suaves, gradientes de fondo, glass oscuro y separación por contraste.
- Revisar contraste entre módulos y fondo de página.
- Mantener compatibilidad con light mode sin degradar accesibilidad.

##### Criterios de aceptación iniciales
- Los módulos en dark mode no muestran bordes blancos innecesarios.
- La jerarquía visual mejora mediante profundidad, contraste y capas limpias.
- El resultado mantiene una estética sobria, premium y consistente con marca.

#### SPEC04 - Hero Dropdown Visual System
- Rama SPEC: `SPEC/czambrano-bri168-spec04-hero-dropdown-visual-system`
- Objetivo: extender el lenguaje visual del Hero al menú desplegable asociado, manteniendo el mismo matiz azul/morado, blur y profundidad.

##### ALCANCE INICIAL PROPUESTO
- Identificar el componente o flujo exacto del menú desplegable del Hero.
- Aplicar fondo oscuro, blur, sombras suaves y gradientes coherentes con `SPEC01`.
- Revisar estados hover, active, focus y selected.
- Validar comportamiento responsive y accesibilidad por teclado.

##### Criterios de aceptación iniciales
- El menú desplegable se siente parte del mismo sistema visual del Hero.
- Los estados interactivos son claros en dark mode y light mode.
- La navegación y accesibilidad no se degradan.

#### SPEC05 - Landing Header Full Width Visual
- Rama SPEC: `SPEC/czambrano-bri168-spec05-landing-header-full-width-visual`
- Objetivo: evolucionar el header/first viewport del landing hacia una composición moderna, horizontal, minimalista e imponente.

##### ALCANCE INICIAL PROPUESTO
- Revisar la estructura actual del header y primer viewport del landing.
- Proponer una composición que use mejor el ancho horizontal disponible.
- Integrar una imagen o dirección visual que comunique ciudad, tokenización y fragmentación inmobiliaria.
- Definir jerarquía de texto grande, editorial y adaptable al scroll.
- Mantener performance, responsive behavior y claridad del CTA principal.

##### Criterios de aceptación iniciales
- El primer viewport comunica mejor el modelo de negocio de BRIDS.
- La composición se siente moderna, minimalista y visualmente fuerte.
- El layout mantiene buena legibilidad en desktop y mobile.

#### SPEC06 - Scroll Motion Experience
- Rama SPEC: `SPEC/czambrano-bri168-spec06-scroll-motion-experience`
- Objetivo: explorar una capa de animación progresiva basada en scroll para reforzar narrativa visual sin comprometer performance.

##### ALCANCE INICIAL PROPUESTO
- Evaluar Motion, Open Design u otro motor actual de animación asistida por AI.
- Definir qué textos, imágenes o módulos pueden animarse con scroll.
- Establecer límites de performance y fallback para `prefers-reduced-motion`.
- Prototipar una animación mínima antes de escalar el patrón.

##### Criterios de aceptación iniciales
- La animación aporta claridad narrativa y no solo decoración.
- La experiencia respeta `prefers-reduced-motion`.
- La implementación mantiene performance aceptable en desktop y mobile.

#### SPEC07 - Marketplace Pins Secondary Scope
- Rama SPEC: `SPEC/czambrano-bri168-spec07-marketplace-pins-secondary`
- Objetivo: mantener las mejoras de pins de Marketplace como alcance secundario dentro de `BRI-168`, sin desplazar la prioridad UI/UX del landing.

##### ALCANCE INICIAL PROPUESTO
- Revisar visibilidad y jerarquía de pins.
- Revisar estados selected, hover, focus y active.
- Validar sincronización map/list/detail.
- Ejecutar QA responsive específico de Marketplace.

##### Criterios de aceptación iniciales
- Los pins son más claros y consistentes visualmente.
- Los estados interactivos son distinguibles.
- La sincronización entre mapa, lista y detalle no se rompe.

### No objetivos
- No rediseñar toda la aplicación en un solo SPEC.
- No cambiar reglas de negocio, auth, wallet, compra o datos on-chain.
- No introducir animaciones pesadas que degraden performance.
- No tratar el número del SPEC como prioridad obligatoria si la estabilidad recomienda otro orden.
- No crear subissues nuevos si el trabajo puede mantenerse gobernado en `BRI-168`.

### Validación
- Validar `/` en `http://localhost:3000`.
- Revisar dark mode contra referencia visual cuando aplique.
- Capturar evidencia visual desktop y mobile cuando el SPEC lo requiera.
- Ejecutar `npm run lint` para cambios UI acotados.
- Ejecutar `npm run validate` antes de cerrar el bloque completo.

## ENGLISH VERSION

### Ownership
- Issue: `BRI-168`
- Developer: `czambrano`
- Team: `BRIDS App`
- Linear source of truth: `BRI-168` issue body
- Local Git record: `docs/features/feature-czambrano-bri-168-ui-ux-fixes-and-improvements.md`
- Main issue branch: `feature/czambrano-bri-168-ui-ux-fixes-and-improvements`
- Branch role: main `Feature` branch for `BRI-168` documentation, SPECS, and implementation.

### Branch Policy
All documentation, SPECS, or implementation changes related to `BRI-168` must live first in the main branch `feature/czambrano-bri-168-ui-ux-fixes-and-improvements` and remain consistent with the Linear issue body.

The main `Feature` branch is divided into multiple `SPEC` branches, developed one by one according to stability, technical dependency, and product priority. The numeric order helps organize the scope, but it does not force execution in that order when product stability recommends a different sequence.

The SPEC branch naming convention for this issue is:

```text
SPEC/czambrano-bri168-specNN-spec-slug
```

Example:

```text
SPEC/czambrano-bri168-spec01-landing-dark-hero-look-and-feel
```

Each SPEC branch must branch from the main `Feature` branch and target it back for review. The full block should only be merged from the main `Feature` branch into the base branch defined by the project workflow.

### Objective
Improve the visual quality, brand consistency, and user experience of the landing page and related public surfaces, focusing on cleaner dark mode, modules with stronger visual depth, custom investment category iconography, a more premium Hero, and a foundation for modern interactions with progressive animation.

The general scope of this issue is limited to the UI/UX improvements documented in this general scope. Any work that does not directly support these objectives should be opened in a separate scope or issue.

### Cross-Project Development Policy Objective
Integrate a cross-project rule into the primary BRIDS policy, documentation, and workflow documents to:
- Always confirm which project developer is responsible before creating, updating, or syncing Linear content.
- Before running development-start protocols, confirm who is responsible for the issue, who created the issue, who is assigned to the development work, and which developer identity will be associated with comments, Linear activity, and Git commits.
- Use Linear as the primary source for issues, objectives, SPECS, and acceptance criteria.
- Keep local `.md` files as the Git record that remains consistent with Linear.
- Prevent primary SPECS from living in loose Linear comments.
- Standardize bilingual documentation with `VERSION ESPAÑOL` first and `ENGLISH VERSION` second.
- Document the SPEC branch naming convention as `SPEC/<developer>-bri<issue>-specNN-<slug>` inside the main project workflow.
- Add `SPEC HISTORY` as a mandatory end-of-SPEC record for stable patterns, decisions, and outcomes.
- Add `SPEC MERGE` as the end-of-SPEC protocol: update local history, sync Linear, validate technical state, and merge the `SPEC` branch back into the `Feature` branch without an intermediate PR.

### Specific Objectives
1. Improve investment category iconography.
   - Replace generic iconography or keyboard-style predefined icons.
   - Create custom BRIDS icons that respect brand guidelines, visual style, stroke weight, and category consistency.
   - Ensure icons remain legible in dark mode and light mode.

2. Improve dark mode modules.
   - Remove white borders from informational cards and modules.
   - Replace visible outlines with soft shadows, background gradients, and clean glass layers.
   - Improve contrast between modules and the page background to create depth without visual noise.
   - Preserve a design-agency level of visual quality: sober, premium, and consistent surfaces.

3. Improve the Hero.
   - Move the dark mode Hero background away from transparent white and into dark blue with gaussian blur.
   - Add glow and gradient accents in colored areas.
   - Preserve content, routes, and dynamic data while improving visual expression.
   - Improve the Hero dropdown menu with the same color mood and visual treatment.

4. Improve the Landing Page Header.
   - Evolve the landing page into a modern experience that uses the full horizontal space more effectively.
   - Add a striking, imposing, minimalist image that communicates city, tokenization, and real-estate fractionalization.
   - Use large editorial text that changes as the user scrolls down.
   - As a second scope, explore scroll-driven animation using Motion, Open Design, or a current AI-assisted animation engine.

### Defined SPECS

#### SPEC01 - Landing Dark Hero Look And Feel
- SPEC branch: `SPEC/czambrano-bri168-spec01-landing-dark-hero-look-and-feel`
- Objective: improve the dark mode Hero with a dark blue background, gaussian blur, blue/purple glow, and borderless internal panels.
- Status: implemented in the SPEC branch and locally validated.

##### PROPOSED INITIAL SCOPE
- `components/sections/hero.tsx`
- `app/globals.css`
- Hero dark mode background.
- Borderless Hero internal panels.
- Hero secondary CTA without visible white border.
- Visual compatibility with light mode.
- Hero dropdown with the same visual mood, if it technically belongs to the same component or flow.

##### Initial Acceptance Criteria
- In dark mode, the Hero uses a dark blue background with ambient gaussian blur.
- Hero panels do not show white borders.
- Internal layers use soft shadows, dark glass, or gradients to create depth.
- Hero content preserves copy, order, CTAs, routes, and dynamic data.
- Light mode remains usable.
- The global `Card` component is not modified.

##### Implementation Evidence
- `npm run lint`: passed.
- `npm run typecheck`: blocked during `SPEC MERGE` by external errors in `.next/types/app/api/protected/overview/route.ts` and `.next/types/app/api/protected/portfolio/route.ts`; the source routes are outside the scope and were not modified by `SPEC01`.
- `npm run build`: blocked by an external route handler error in `app/api/protected/overview/route.ts`; the file is outside the SPEC01 scope and was not modified by this slice.
- Desktop dark/light visual inspection at `http://localhost:3000`.
- Mobile responsive inspection: no horizontal overflow and Hero panels with computed border `0px`.
- Requested visual adjustment: the public header uses a dark matte gaussian-blur surface with no computed white borders on shell, pills, language selector, or theme toggle.
- Focused correction: the `Marketplace` pill no longer uses a rectangular outer shadow; it preserves depth with rounded inner shadows to avoid visual quality loss.
- Focused active-state correction: the active `Marketplace` pill in dark mode removes the rectangular outer shadow and uses rounded inner depth with computed border `0px`.
- Focused light mode correction: the BRIDS logo pill keeps the same dark matte treatment from dark mode and removes the previous flat gray look.
- Refined light mode correction: the BRIDS logo pill uses a solid night-blue tone matching the reference color, preventing light-background transparency from washing it into gray.
- Header microinteraction: Hero/header pills adopt the same feel as the `Sign in` button, with subtle hover lift, active press, and a `prefers-reduced-motion` fallback.
- Glitch correction: the theme toggle no longer animates the full control when hovering the label; the microinteraction only runs when hovering the switch.
- Glitch correction: the language selector no longer animates the full container; the microinteraction only runs on the language button under the cursor.
- Spacing correction: the desktop navigation container adds vertical breathing room so the active `Marketplace` pill can lift on hover without being clipped.
- Light mode correction: the theme switch replaces yellow with the BRIDS blue/purple gradient on both track and thumb.
- Switch microinteraction correction: the inner track is anchored in a fixed column, stays static between dark/light states, and the thumb circle is the only element that travels and animates hover/press.
- Out-of-scope observation: any structural redesign of the mobile header remains reserved for the Header/Dropdown scope.

##### SPEC HISTORY
- Stable outcome: the dark mode Hero now uses a night-blue base, gaussian blur, blue/purple glows, and panels without visible white borders.
- Stable outcome: the public header now behaves as a dark matte surface, using blur depth, inner shadows, and subtle gradients instead of white outlines.
- Stable outcome: header pills, including `Marketplace`, keep a premium microinteraction without rectangular shadows, hover clipping, or noisy active states.
- Stable outcome: the BRIDS brand pill keeps a solid night-blue tone in light mode, avoiding a washed gray look over light backgrounds.
- Stable outcome: the language selector and theme toggle keep their containers stable; only the interactive item under the cursor or the switch thumb animates.
- Validated design decision: rectangular outer shadows reduce pill quality; the accepted pattern is rounded inner depth, soft gradients, and full-radius surfaces.
- Validated interaction decision: navigation and switch containers must stay static; microinteractions are concentrated on the actionable element to avoid glitches.
- Validated implementation decision: isolating landing styles through `landing-*` classes improves this surface without changing global components such as `Card`.
- Stability evidence: `npm run lint`, desktop/mobile visual inspection, and runtime measurements confirmed `0px` borders, static switch track, and unclipped hover; `npm run typecheck` remains blocked by routes external to the SPEC.
- Learning for future SPECS: when the user marks an adjustment as perfect, that pattern must be promoted into stable SPEC history and reused as a visual or interaction reference.

#### SPEC02 - Investment Category Iconography
- SPEC branch: `SPEC/czambrano-bri168-spec02-investment-category-iconography`
- Objective: replace generic investment category iconography with custom BRIDS icons that remain brand-consistent and legible in dark/light mode.

##### PROPOSED INITIAL SCOPE
- Identify all public surfaces where investment categories appear.
- Audit current generic, keyboard-style, or library icons that do not represent the brand.
- Design or implement an initial set of custom icons for priority categories.
- Define visual weights, sizes, containers, states, and contrast for dark mode and light mode.
- Document usage rules so future categories remain consistent.

##### Initial Acceptance Criteria
- Prioritized categories no longer depend on generic icons without brand rationale.
- Icons remain visually coherent with each other.
- Icons are legible in dark mode and light mode.
- The implementation does not break existing responsive layouts.

#### SPEC03 - Dark Mode Modules Depth
- SPEC branch: `SPEC/czambrano-bri168-spec03-dark-mode-modules-depth`
- Objective: clean dark mode modules by removing white borders and replacing them with more premium visual depth.

##### PROPOSED INITIAL SCOPE
- Identify cards, boxes, and informational modules across the landing page and related public surfaces.
- Remove white borders or high-noise outlines.
- Introduce soft shadows, background gradients, dark glass, and contrast-based separation.
- Review contrast between modules and page background.
- Preserve light mode compatibility without reducing accessibility.

##### Initial Acceptance Criteria
- Dark mode modules do not show unnecessary white borders.
- Visual hierarchy improves through depth, contrast, and clean layers.
- The result keeps a sober, premium aesthetic consistent with the brand.

#### SPEC04 - Hero Dropdown Visual System
- SPEC branch: `SPEC/czambrano-bri168-spec04-hero-dropdown-visual-system`
- Objective: extend the Hero visual language into the associated dropdown menu while preserving the same blue/purple mood, blur, and depth.

##### PROPOSED INITIAL SCOPE
- Identify the exact Hero dropdown component or flow.
- Apply dark background, blur, soft shadows, and gradients consistent with `SPEC01`.
- Review hover, active, focus, and selected states.
- Validate responsive behavior and keyboard accessibility.

##### Initial Acceptance Criteria
- The dropdown feels like part of the same Hero visual system.
- Interactive states are clear in dark mode and light mode.
- Navigation and accessibility are not degraded.

#### SPEC05 - Landing Header Full Width Visual
- SPEC branch: `SPEC/czambrano-bri168-spec05-landing-header-full-width-visual`
- Objective: evolve the landing header/first viewport into a modern, horizontal, minimalist, and imposing composition.

##### PROPOSED INITIAL SCOPE
- Review the current header and first viewport structure.
- Propose a composition that uses horizontal space more effectively.
- Integrate an image or visual direction that communicates city, tokenization, and real-estate fractionalization.
- Define large editorial text hierarchy that can adapt to scroll.
- Preserve performance, responsive behavior, and primary CTA clarity.

##### Initial Acceptance Criteria
- The first viewport communicates the BRIDS business model more clearly.
- The composition feels modern, minimalist, and visually strong.
- The layout remains readable on desktop and mobile.

#### SPEC06 - Scroll Motion Experience
- SPEC branch: `SPEC/czambrano-bri168-spec06-scroll-motion-experience`
- Objective: explore a progressive scroll-driven animation layer that strengthens visual storytelling without compromising performance.

##### PROPOSED INITIAL SCOPE
- Evaluate Motion, Open Design, or another current AI-assisted animation engine.
- Define which text, image, or module elements can animate on scroll.
- Establish performance limits and fallback behavior for `prefers-reduced-motion`.
- Prototype a minimal animation before scaling the pattern.

##### Initial Acceptance Criteria
- Animation improves narrative clarity and is not only decorative.
- The experience respects `prefers-reduced-motion`.
- The implementation keeps acceptable desktop and mobile performance.

#### SPEC07 - Marketplace Pins Secondary Scope
- SPEC branch: `SPEC/czambrano-bri168-spec07-marketplace-pins-secondary`
- Objective: keep Marketplace pin improvements as secondary scope inside `BRI-168` without displacing the landing UI/UX priority.

##### PROPOSED INITIAL SCOPE
- Review pin visibility and hierarchy.
- Review selected, hover, focus, and active states.
- Validate map/list/detail synchronization.
- Run Marketplace-specific responsive QA.

##### Initial Acceptance Criteria
- Pins are visually clearer and more consistent.
- Interactive states are distinguishable.
- Map, list, and detail synchronization does not break.

### Non-goals
- Do not redesign the entire app in a single SPEC.
- Do not change business rules, auth, wallet, purchase, or on-chain data behavior.
- Do not introduce heavy animation that harms performance.
- Do not treat the SPEC number as mandatory priority if stability recommends a different order.
- Do not create new subissues if the work can remain governed inside `BRI-168`.

### Validation
- Validate `/` at `http://localhost:3000`.
- Review dark mode against the visual reference when applicable.
- Capture desktop and mobile visual evidence when required by the SPEC.
- Run `npm run lint` for focused UI changes.
- Run `npm run validate` before closing the full block.
