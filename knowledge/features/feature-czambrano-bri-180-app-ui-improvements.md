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
- **SPEC07 - Marketplace Pins Secondary Scope**: Refinar la jerarquía visual de los pines del mapa, sus estados interactivos (hover, active) y garantizar la sincronización mapa/lista/detalle. (SPEC/czambrano-bri-180-spec07-marketplace-pins-secondary)

#### Non-goals
- Cambios arquitectónicos mayores en el framework de frontend o la capa de datos.
- Rediseño de páginas completas fuera de los componentes especificados (Hero dropdown, pines, iconos de categoría).
- Animaciones puramente decorativas que degraden el rendimiento en dispositivos móviles.

#### Acceptance Criteria
- **SPEC02**: Las categorías priorizadas usan iconos legibles y coherentes con la marca en ambos modos de color, sin romper layouts responsivos.
- **SPEC04**: El dropdown del Hero se siente parte del mismo sistema visual y su navegación es accesible.
- **SPEC06**: La experiencia de scroll motion mejora la narrativa, es fluida y respeta configuraciones de accesibilidad.
- **SPEC07**: Los pines son más claros y la sincronización entre mapa y lista no se rompe.
- **Gobernanza**: El artefacto local, el issue de Linear y la rama principal existen y están sincronizados usando el identificador correcto.

#### Risks
- La adición de scroll motion podría introducir cuellos de botella en el rendimiento de pintado (layout shifts) en dispositivos de gama baja si no se optimiza.
- Los iconos personalizados podrían no escalar correctamente en contextos de UI no previstos si no se definen bien los contenedores.

#### Open Questions
- ¿Qué motor de animación exacto estandarizaremos para la experiencia de scroll en el SPEC06?

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
- **SPEC07 - Marketplace Pins Secondary Scope**: Refine marketplace pin visibility, interactive states, and map/list synchronization. (SPEC/czambrano-bri-180-spec07-marketplace-pins-secondary)

#### Non-goals
- Major architectural changes to the frontend framework or data fetching layer.
- Redesign of pages outside the specified components (Hero dropdown, pins, category icons).
- Animations that degrade performance or ignore `prefers-reduced-motion` settings.

#### Acceptance Criteria
- **SPEC02**: Custom icons are integrated, responsive, and legible in both light and dark modes.
- **SPEC04**: Hero dropdown matches the overarching visual system with correct interactive states.
- **SPEC06**: Scroll animations are smooth and respect accessibility settings.
- **SPEC07**: Marketplace pins maintain state synchronization and clear visibility.
- **Governance**: Branch and SPEC nomenclature strictly follow governance.

#### Risks
- Adding scroll motion could introduce layout shifts or performance bottlenecks on lower-end devices.
- Custom icons might not scale properly in unexpected UI contexts if not documented well.

#### Open Questions
- What exact animation engine should we standardize on for the scroll experience?
