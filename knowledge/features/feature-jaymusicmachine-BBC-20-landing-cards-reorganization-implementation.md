# Solution Spec: landing-cards-reorganization Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture
La solución se estructura estrictamente en las 4 capas del monorepo BlueBrick:
1. **Layer 1: Presentation Layer** (`apps/web/src/components/landing/`, `apps/web/src/app/page.tsx`):
   - `landing-hero.tsx`: Renderiza el encabezado institucional con `BlueBrickLogo`, el subtítulo de marca centrado *"plataforma de inversión"*, el titular *"Hola, Inversionista"* y el subtítulo *"Accede a tu portafolio..."*.
   - `landing-feature-cards.tsx` (Nuevo): Renderiza el grid 2x2 de cards informativas:
     - Card 1: Icono de bloques/ladrillos, badge *"Portal Privado"*, título *"Acceso Exclusivo"* y subtítulo *"Gestione sus inversiones"*.
     - Card 2: Icono `TrendingUp`, título *"Consultar Rendimiento"*.
     - Card 3: Icono `Coins`, título *"Monitorear Distribuciones"*.
     - Card 4: Icono `Handshake`, título *"Reinvertir Capital"*.
     - Microanimaciones CSS/framer integradas para atraer la atención (elevación hover, transiciones sutiles).
   - `investor-login-card.tsx`: Desacopla títulos ya presentes en las cards, conserva el botón principal de login por correo (`/auth/login`), los chips de compatibilidad (Google, Microsoft, Apple; eliminando Yahoo) y la nota de privacidad/seguridad.
   - `page.tsx`: Ensambla el layout con la barra superior de utilidades (`ThemeToggle` + `LocaleSwitcher`), el hero, el grid de cards, la card de login y el footer.
2. **Layer 2: Application / Consumption Layer** (`features/i18n`):
   - Consumo de diccionarios y formateadores a través del hook institucional `useI18n()`.
   - Consumo del tema activo mediante `useTheme()`.
3. **Layer 3: Domain / Pipelines / Services Layer** (`features/i18n/domain/`):
   - `i18n-dictionary-schema.ts`: Extensión de `LandingTokensSchema` y `LoginCardTokensSchema` con Zod para validar los nuevos tokens.
   - DICCIONARIOS (`es.ts`, `en.ts`, `pt.ts`): Traducciones exactas y sincronizadas para español, inglés y portugués.
4. **Layer 4: Infrastructure Layer**:
   - Sin cambios directos de persistencia o blockchain requeridos; integración con enrutamiento de Next.js App Router y adaptadores existentes de cookie de idioma y tema.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: Domain & Presentation - Reorganización en Cards Informativas, Refactor de Login y Multilenguaje Completo (Rama: `feature/jaymusicmachine-BBC-20-landing-cards-reorganization`).
  - Ciclo Red: Definición de tests unitarios que verifiquen el nuevo grid 2x2, ausencia de Yahoo, presencia de titulares y adaptabilidad de tema/idioma.
  - Ciclo Green: Implementación de `landing-feature-cards.tsx`, alineación de `landing-hero.tsx`, actualización de `investor-login-card.tsx` y diccionarios de i18n.
  - Ciclo Refactor: Auditoría de código limpio, in-code commentary obligatorio y validación integral con `pnpm validate`.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `tests/unit/landing-feature-cards.test.tsx` (Nuevo)
- **Command**: `pnpm vitest run tests/unit/landing-feature-cards.test.tsx`
- **Assertion Goals**:
  1. Renderizado de las 4 cards en el grid 2x2.
  2. Presencia del badge institucional "Portal Privado" en Card 1.
  3. Verificación de iconos y textos de valor en las 4 cards.
  4. Comportamiento puramente informativo con microanimaciones CSS.
  5. Soporte multidioma (ES, EN, PT).
- **Test File Path**: `tests/unit/landing-mock-login.test.tsx` y `tests/unit/investor-login-card.test.tsx`
- **Assertion Goals**:
  1. Confirmar eliminación de Yahoo de los proveedores compatibles.
  2. Confirmar persistencia del enlace a `/auth/login` y los proveedores Google, Microsoft y Apple.
  3. Sincronización de aserciones de titulares con "Hola, Inversionista".

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas unitarias y de integración pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] Todo el código incluye comentarios obligatorios de capa y funciones paso a paso (Clean Code).
- [ ] Aprobación explícita del humano registrada tras verificación visual.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BBC-20-landing-cards-reorganization.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-20-landing-cards-reorganization.md)
- **Solution Spec**: [feature-jaymusicmachine-BBC-20-landing-cards-reorganization-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-20-landing-cards-reorganization-implementation.md)
- **Linear Issue**: [Linear Ticket #BBC-20](https://linear.app/brids-app/issue/BBC-20)
