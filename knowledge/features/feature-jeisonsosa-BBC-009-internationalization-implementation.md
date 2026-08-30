# Solution Spec: Internationalization Implementation (BBC-009)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend`
- **Architect Gatekeeper**: `architect` (Gate 1 Scaffolding & Gate 2 Diff Audit)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security` (Cookie flags & XSS safety in translation interpolation)

## 2. Solution Overview & 4-Layer Architecture
The internationalization feature is organized under `apps/web/src/features/i18n/` following the strict 4-Layer Feature-Driven Design (FDD) Monorepo standard:

### Layer 1: Presentation Layer (`presentation/`)
- `presentation/components/locale-switcher.tsx`: Luxury dark-themed dropdown/segmented switcher supporting English (`en`), Spanish (`es`), and Portuguese (`pt`), with flags, keyboard navigation, and Motion transitions.
- `presentation/components/i18n-provider.tsx`: Client-side React context provider wrapping the application shell, managing dynamic locale state, supplying dictionary tokens, and providing `useI18n()`.

### Layer 2: Application / Consumption Layer (`application/`)
- `application/hooks/use-i18n.ts`: Context consumer hook providing typed translations `t(key, params?)`, locale switcher handlers, and localized formatter functions.
- `application/actions/locale-cookie-actions.ts`: Server Actions (`setLocaleCookie`, `getLocaleCookie`) to persist user language preferences securely via `bb_locale` cookie.
- `application/queries/get-dictionary-query.ts`: Server-side dictionary retrieval utility for React Server Components (RSC) and Next.js proxy route handling.

### Layer 3: Domain / Pipelines Layer (`domain/`)
- `domain/models/locale-types.ts`: Core type definitions (`SupportedLocale = "en" | "es" | "pt"`, `Dictionary`, `TranslationKey`, `LocaleConfig`, `LocaleFormatOptions`).
- `domain/schemas/i18n-dictionary-schema.ts`: Zod schema validating full dictionary shape and key parity across all language dictionaries.
- `domain/dictionaries/es.ts`: Canonical Spanish dictionary (landing, login, dashboard, metrics, portfolio, reinvestment, errors, common) with USD-denominated values.
- `domain/dictionaries/en.ts`: Canonical English dictionary with 100% key parity and USD denomination.
- `domain/dictionaries/pt.ts`: Canonical Portuguese dictionary with 100% key parity and USD denomination.
- `domain/ports/i18n-port.ts`: Port interface contracts for dictionary loading, locale detection, and string interpolation.
- `domain/formatters/locale-formatters.ts`: Pure domain formatting functions for numbers, USD currency (`$ ... USD`), percentages, and dates using standard `Intl` APIs for US operations.

### Layer 4: Infrastructure Layer (`infrastructure/`)
- `infrastructure/cookie-locale-adapter.ts`: Browser & server cookie manager for `bb_locale` with `SameSite=Lax`, `Path=/`, and 365-day TTL.
- `infrastructure/browser-locale-detector.ts`: Safe client-side `navigator.languages` & `navigator.language` detector resolving to supported locales.
- `infrastructure/dictionary-loader-adapter.ts`: In-memory caching adapter delivering fast dictionary resolution without network latency.

### Feature Public API Barrel (`index.ts`)
- `apps/web/src/features/i18n/index.ts`: Strict 4-layer export barrel.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: Core i18n Domain Contracts, Zod Dictionary Schemas, English/Spanish/Portuguese dictionaries & Formatters (Domain Layer). (Branch: `SPEC/jeisonsosa-BBC-009-s01-domain-dictionaries-and-formatters`)
- **SPEC-2**: Infrastructure Adapters (Cookie Locale Adapter, Browser Detector, Dictionary Loader) & Application Actions/Queries. (Branch: `SPEC/jeisonsosa-BBC-009-s02-infrastructure-and-application-layer`)
- **SPEC-3**: Presentation Components (`LocaleSwitcher`, `I18nProvider`, `useI18n` hook) & Root Layout Integration. (Branch: `SPEC/jeisonsosa-BBC-009-s03-presentation-provider-and-switcher`)
- **SPEC-4**: Landing Page & Dashboard Full Multilingual Integration (`LandingHero`, `InvestorLoginCard`, `InvestmentDashboard`, `StatusBadge`, `StatChip`, `MetricRow`). (Branch: `SPEC/jeisonsosa-BBC-009-s04-ui-multilingual-integration`)
- **SPEC-5**: Comprehensive Unit, Integration & E2E Verification + Clean Code Refactor Audit. (Branch: `SPEC/jeisonsosa-BBC-009-s05-clean-code-audit-and-e2e`)

## 4. TDD (Test-Driven Development) Strategy
### Structural & Contract Tests (Fase RED)
- **Test File Path**: `tests/unit/i18n-structural.test.ts`
- **Command**: `pnpm test tests/unit/i18n-structural.test.ts`
- **Assertion Goals**: Verify all 4-layer file paths exist physically, export proper types, and comply with architecture isolation.

### Behavioral Unit & Integration Tests (Fase RED)
- **Test File Path**: `tests/unit/i18n-dictionaries.test.ts` & `tests/unit/i18n-formatters.test.ts`
- **Command**: `pnpm test tests/unit/i18n-dictionaries.test.ts`
- **Assertion Goals**: Validate Zod schema adherence, 100% key parity across `es`, `en`, and `pt`, interpolation parameter replacement, locale cookie persistence, and formatting accuracy.

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas de regresión pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] La documentación de arquitectura local y gobernanza está actualizada sin placeholders.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jeisonsosa-BBC-009-internationalization.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jeisonsosa-BBC-009-internationalization.md)
- **Solution Spec**: [feature-jeisonsosa-BBC-009-internationalization-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jeisonsosa-BBC-009-internationalization-implementation.md)
- **Linear Issue**: BBC-009 (Bypassed via User Directive)
