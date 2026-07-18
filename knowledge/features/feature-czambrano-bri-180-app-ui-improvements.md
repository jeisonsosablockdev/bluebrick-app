# BRI-180 - App UI Improvements

---

## VERSIÓN ESPAÑOL

---

### Human Brief

#### Ownership
- Issue: `BRI-180`
- Developer: `czambrano`
- Team: `BRIDS App`
- Feature Type: `UI app`
- Priority: `Alta`
- Label: `Feature`
- Linear source of truth: cuerpo del issue `BRI-180`
- Local Git record: `knowledge/features/feature-czambrano-bri-180-app-ui-improvements.md`
- Rama principal del issue: `feature/czambrano-bri-180-app-ui-improvements`

#### Objective
Elevar el lenguaje visual y la calidad de interacción de la aplicación BRIDS mediante mejoras dirigidas de UI/UX. Esto incluye implementar iconografía personalizada alineada a la marca para las categorías de inversión, extender el sistema visual de "deep blur/dark-mode" a los dropdowns del Hero, introducir animaciones narrativas impulsadas por scroll (Scroll Motion), y refinar la usabilidad de los pines del Marketplace, todo manteniendo altos estándares de rendimiento y accesibilidad.

#### Scope
- **SPEC02 - Investment Category Iconography**: Reemplazar iconos genéricos por iconografía personalizada de BRIDS en todas las superficies públicas. Definir pesos visuales, contrastes (dark/light) y documentar reglas de uso. (SPEC/czambrano-bri-180-spec02-investment-category-iconography)
- **SPEC04 - Hero Dropdown Visual System**: Extender el lenguaje visual del Hero (fondos oscuros, blur, sombras suaves) a sus menús desplegables, validando estados interactivos y accesibilidad. (SPEC/czambrano-bri-180-spec04-hero-dropdown-visual-system)
- **SPEC06 - Scroll Motion Experience**: Implementar una capa de animación progresiva basada en scroll para fortalecer la narrativa visual sin comprometer el rendimiento (respetando `prefers-reduced-motion`). (SPEC/czambrano-bri-180-spec06-scroll-motion-experience)


#### Non-goals
- Cambios arquitectónicos mayores en el framework de frontend o la capa de datos.
- Rediseño de páginas completas fuera de los componentes especificados (Hero dropdown, pines, iconos de categoría).
- Animaciones puramente decorativas que degraden el rendimiento en dispositivos móviles.

#### Acceptance Criteria
- **SPEC02**: Las categorías priorizadas usan iconos legibles y coherentes con la marca en ambos modos de color, sin romper layouts responsivos.
- **SPEC04**: El dropdown del Hero se siente parte del mismo sistema visual y su navegación es accesible.
- **SPEC06**: La experiencia de scroll motion mejora la narrativa, es fluida y respeta configuraciones de accesibilidad.

- **Gobernanza**: El artefacto local, el issue de Linear y la rama principal existen y están sincronizados usando el identificador correcto.

#### Risks
- La adición de scroll motion podría introducir cuellos de botella en el rendimiento de pintado (layout shifts) en dispositivos de gama baja si no se optimiza.
- Los iconos personalizados podrían no escalar correctamente en contextos de UI no previstos si no se definen bien los contenedores.

#### Open Questions
- ¿Qué motor de animación exacto estandarizaremos para la experiencia de scroll en el SPEC06?

### SPEC History / Implementation Log

#### Cambios Desarrollados
- **Profile KYC Form Refactor**: Se migró el formulario de perfil de usuario a un sistema de doble estado:
  - *Modo Visualización*: Presentación limpia sin bordes de inputs, datos en texto plano y etiquetas en color `text-cyan-300` para mayor jerarquía.
  - *Modo Edición*: Inputs con fondo oscuro transicional (`bg-black/30` a `focus:bg-black/50`) para un claro affordance de interacción.
- **Formato y Contenedor**: Se estandarizó el contenedor principal del formulario bajo el sistema visual `marketplace-depth-card` (cristal ahumado y paddings espaciados) para asegurar cohesión con los demás submódulos de la plataforma.

#### Bugfixes
- **Bug**: Fallo al guardar datos del perfil (`400 Bad Request`).
  - **Causa**: Al cambiar el país, el selector pre-llenaba el campo de teléfono con el código de área (ej. `+57 `). Si el usuario no completaba el número, el payload enviaba el prefijo suelto, fallando la validación estricta de regex en el backend `^\+?[1-9]\d{1,14}$`.
  - **Solución**: Interceptación en `handleSave` del frontend para detectar números que solo contienen código de área y sobreescribirlos con un string vacío antes del `PUT`, evitando que el backend rechace la actualización.
- **Bug**: El "User Tour" interactivo desapareció del módulo Perfil/Soporte.
  - **Causa**: La refactorización de elementos del DOM afectó los selectores ID y referencias que el sistema de tour utilizaba para anclarse, perdiendo el rastro de la interfaz.

#### Retrospectiva (OKF Protocol)
- **Qué estuvo bien**: Rápida iteración y alineación del formulario con el lenguaje visual "dark mode / glassmorphism" de BRIDS. Se detectó y resolvió ágilmente el bug de payload desde el frontend, protegiendo el backend sin ensuciar la lógica de negocio. Además, la exploración de animaciones complejas (SPEC06) se realizó controladamente sin romper la versión base, permitiendo una rápida reversión.
- **Qué estuvo mal**: Los cambios drásticos en el DOM rompieron de manera silenciosa integraciones de terceros (como el User Tour). Además, la validación laxa en el cliente permitió enviar datos que causaron fricción oculta al usuario final, requiriendo revisión de logs para detectar el bloqueo.

- **SPEC02 (Investment Category Iconography)**: Se reemplazaron los emojis estáticos genéricos por un sistema de SVGs minimalistas estilizados (`text-cyan-400 drop-shadow`) sin fondos sólidos. Se documentó formalmente este nuevo paradigma visual en `knowledge/governance/iconography-rules.md` para garantizar consistencia futura. Se respetó la estricta secuencia de *Preflight*.
- **SPEC04 (Hero Dropdown & Background)**: Se refinaron los contrastes de superposición en el componente Hero, forzando legibilidad óptima para textos blancos tanto en modo claro como oscuro. Se realizaron ajustes a nivel de tipografía y alineación ultra-ajustada para el logo animado. Se incluyeron márgenes de separación de diseño en `FirstInvestmentSection`.
- **SPEC06 (Scroll Motion & Welcome)**: Se iteró sobre la animación basada en scroll de la sección de Propiedades Destacadas (framer-motion). Tras pruebas en vivo del mapeo de scroll (`useScroll`, `useTransform`), se revirtió a la versión original según la decisión de UX del usuario, priorizando estabilidad visual sobre interactividad prolongada. Se corrigió un error gramatical en la copia del componente Welcome ("Bienvenido al futuro").

---

## ENGLISH VERSION

---

### Human Brief

#### Ownership
- Issue: `BRI-180`
- Developer: `czambrano`
- Team: `BRIDS App`
- Feature Type: `UI app`
- Priority: `Alta`
- Label: `Feature`
- Linear source of truth: `BRI-180` issue body
- Local Git record: `knowledge/features/feature-czambrano-bri-180-app-ui-improvements.md`
- Main issue branch: `feature/czambrano-bri-180-app-ui-improvements`

#### Objective
Elevate the BRIDS app visual language and interaction quality through targeted UI/UX improvements. This includes deploying custom brand iconography, unifying the Hero dropdown visual system, introducing narrative scroll-motion, and refining marketplace pin usability, all while maintaining high performance and accessibility standards.

#### Scope
- **SPEC02 - Investment Category Iconography**: Replace generic icons with custom BRIDS brand-consistent iconography across public surfaces. (SPEC/czambrano-bri-180-spec02-investment-category-iconography)
- **SPEC04 - Hero Dropdown Visual System**: Extend the deep blur, soft shadow, and dark background visual language to the Hero dropdown menus. (SPEC/czambrano-bri-180-spec04-hero-dropdown-visual-system)
- **SPEC06 - Scroll Motion Experience**: Implement a progressive, performance-safe scroll-driven animation layer to enhance visual storytelling. (SPEC/czambrano-bri-180-spec06-scroll-motion-experience)


#### Non-goals
- Major architectural changes to the frontend framework or data fetching layer.
- Redesign of pages outside the specified components (Hero dropdown, pins, category icons).
- Animations that degrade performance or ignore `prefers-reduced-motion` settings.

#### Acceptance Criteria
- **SPEC02**: Custom icons are integrated, responsive, and legible in both light and dark modes.
- **SPEC04**: Hero dropdown matches the overarching visual system with correct interactive states.
- **SPEC06**: Scroll animations are smooth and respect accessibility settings.

- **Governance**: Branch and SPEC nomenclature strictly follow governance.

#### Risks
- Adding scroll motion could introduce layout shifts or performance bottlenecks on lower-end devices.
- Custom icons might not scale properly in unexpected UI contexts if not documented well.

#### Open Questions
- What exact animation engine should we standardize on for the scroll experience?

### SPEC History / Implementation Log

#### Developed Changes
- **Profile KYC Form Refactor**: Migrated the user profile form to a dual-state system:
  - *View Mode*: Clean presentation with no input borders, plain text data, and `text-cyan-300` labels for better hierarchy.
  - *Edit Mode*: Interactive inputs with transitional dark backgrounds (`bg-black/30` to `focus:bg-black/50`) for clear affordance.
- **Layout & Container**: Standardized the main form container using the `marketplace-depth-card` visual system (smoked glass and spaced paddings) to ensure cohesion with other platform submodules.

#### Bugfixes
- **Bug**: Profile save failure (`400 Bad Request`).
  - **Cause**: Changing the country pre-filled the phone field with the dial code (e.g., `+57 `). If left incomplete, the payload sent the isolated prefix, which failed the strict backend regex validation `^\+?[1-9]\d{1,14}$`.
  - **Solution**: Intercepted in the frontend's `handleSave` to detect area-code-only phone strings and overwrite them with an empty string before the `PUT` request, passing validation.
- **Bug**: Interactive "User Tour" disappeared from the Profile/Support module.
  - **Cause**: Structural DOM refactoring broke the ID selectors and references the tour system relied upon, breaking the flow.

#### Retrospective (OKF Protocol)
- **What went well**: Rapid UI iteration aligned seamlessly with BRIDS's dark mode / glassmorphism visual language. The payload bug was resolved swiftly on the frontend, protecting backend logic without tight coupling. The complex animation exploration (SPEC06) was managed safely without breaking the baseline, allowing a rapid and clean rollback when the UX direction changed.
- **What went wrong**: Drastic DOM changes silently broke third-party/global integrations (like the User Tour). Additionally, loose client-side validation allowed sending invalid edge-case data, causing hidden user friction that required log inspection to identify.

- **SPEC02 (Investment Category Iconography)**: Replaced generic static emojis with a system of minimalist styled SVGs (`text-cyan-400 drop-shadow`) lacking solid backgrounds. Formalized this new visual paradigm in `knowledge/governance/iconography-rules.md` to ensure future consistency. Complied strictly with the *Preflight* sequence.
- **SPEC04 (Hero Dropdown & Background)**: Refined overlay contrasts in the Hero component to force optimal readability for white text across both light and dark modes. Applied typography scaling and ultra-tight alignment for the animated logo. Added design separation margins in `FirstInvestmentSection`.
- **SPEC06 (Scroll Motion & Welcome)**: Iterated on the scroll-bound animation of the Featured Properties section (framer-motion). After live testing the scroll mapping (`useScroll`, `useTransform`), reverted to the original baseline per UX decision, prioritizing visual stability over prolonged interactivity. Fixed a grammar typo in the Welcome component copy ("Bienvenido al futuro").
