# Solution Spec: i18n-localization-fix Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`

## 2. Solution Overview & 4-Layer Architecture

### Capa 4: Dominio (`apps/web/src/features/i18n/domain/`)
- **Modelos (`models/locale-types.ts`)**: Tipado estricto `I18nDictionary` ampliado con las interfaces `PhaseProgressTokens`, `MediaCardTokens`, `AvatarModalTokens`, `ImageDetailTokens`, `PropertyTypesTokens` y subclaves de `reinvestment`.
- **Esquemas Zod (`schemas/i18n-dictionary-schema.ts`)**: Validación Zod estricta para todos los nuevos namespaces y propiedades de traducción.
- **Diccionarios (`dictionaries/{es,en,pt}.ts`)**: Definición completa y con paridad de claves al 100% de los textos en Español, Inglés y Portugués.

### Capa 1: Presentación (`apps/web/src/features/i18n/presentation/` & `components/`)
- **Banderas Vectoriales (`features/i18n/presentation/components/flag-icons.tsx`)**:
  - `SpainFlag`: Bandera de España con las 3 franjas tradicionales (rojo, amarillo gualda, rojo) y proporciones vectoriales nítidas.
  - `UsaFlag`: Bandera de Estados Unidos con franjas alternadas y cantón azul.
  - `BrazilFlag`: Bandera de Brasil con campo verde, rombo amarillo y círculo azul central.
  - `LocaleFlag`: Selector polimórfico que despacha la bandera según el `Locale` provisto.
- **Conmutador de Idioma (`features/i18n/presentation/components/locale-switcher.tsx`)**:
  - Integra `<LocaleFlag>` en el botón de activación (trigger) y en cada opción del menú de selección.
- **Componentes del Dashboard**:
  - `project-phase-progress.tsx`: Consume `useI18n()` para traducir títulos, porcentajes, estados de hitos y contadores de fotos.
  - `project-phase-media-card.tsx`: Consume `useI18n()` para traducir textos alternativos, badges numéricos y etiquetas de accesibilidad de navegación.
  - `image-detail-modal.tsx`: Consume `useI18n()` para traducir títulos de modal, controles de zoom, etiquetas ARIA y mensajes de fallback.
  - `avatar-upload-modal.tsx`: Consume `useI18n()` para traducir diálogo, instrucciones de carga y feedback de error.
  - `investment-dashboard.tsx`: Consume `useI18n()` para traducir etiquetas de navegación del carrusel y estados de leads.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1 (Multilingual Dashboard & Subcomponents)**:
  - Expansión de contratos de tipo y esquemas Zod en Capa 4.
  - Población de diccionarios `es`, `en`, `pt`.
  - Inyección de `useI18n()` en componentes interactivos del dashboard.
- **SPEC-2 (Vector SVG Flag Icons in LocaleSwitcher)**:
  - Creación de componentes SVG de banderas vectoriales.
  - Integración en `LocaleSwitcher`.
- **SPEC-3 (Testing & Monorepo Validation)**:
  - Suites unitarias de diccionarios, integración UI y componentes existentes al 100% verdes.
  - Validación de gobernanza y políticas de arquitectura.

## 4. TDD Strategy
- Pruebas unitarias de diccionarios: `tests/unit/i18n-dictionaries.test.ts`
- Pruebas unitarias de integración de UI: `tests/unit/i18n-ui-integration.test.tsx`
- Pruebas de componentes relacionados: `tests/unit/project-phase-media-card-modal.test.tsx`, `apps/web/src/features/image-detail/image-detail-modal.test.tsx`

## 5. Local Definition of Done (DoD)
- [x] Paridad del 100% de claves entre `es.ts`, `en.ts` y `pt.ts`.
- [x] Vector SVG flags renderizadas uniformemente en `LocaleSwitcher`.
- [x] Todos los subcomponentes del dashboard traducidos dinámicamente con `useI18n()`.
- [x] 0 errores en `pnpm validate` (TypeScript, ESLint, Vitest, Docs Governance).

## 6. Spec Artifact Traceability
- **Problem Spec**: [fix-jaymusicmachine-i18n-localization-fix.md](knowledge/fixes/fix-jaymusicmachine-i18n-localization-fix.md)
- **Solution Spec**: [fix-jaymusicmachine-i18n-localization-fix-implementation.md](knowledge/fixes/fix-jaymusicmachine-i18n-localization-fix-implementation.md)
