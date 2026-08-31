# Solution Spec: investor-login-redesign Implementation (BBC-13)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture
This solution updates the investor authentication landing experience by transitioning from a mock demo card to a dedicated, institutional investor login interface powered by WorkOS AuthKit with multi-provider awareness (Google, Microsoft, Apple, corporate email / SSO), localized copy, and comprehensive Light/Dark theme toggling.

### Layer 1: Presentation Layer
- `apps/web/src/components/landing/investor-login-card.tsx`:
  - Header: Lock icon + `t("loginCard.headerTitle")` ("Investor Access" / "Acceso de Inversionista" / "Acesso do Investidor").
  - Top-Right Badge: Pill badge `t("loginCard.privatePortalBadge")` ("Portal Privado" / "Private Portal" / "Portal Privado").
  - Body Headline: `t("loginCard.exclusiveAccessTitle")` ("Acceso exclusivo para inversionistas" / "Exclusive access for investors" / "Acesso exclusivo para investidores").
  - Body Subtitle: `t("loginCard.loginSubtitle")` ("Ingresa con tu correo personal o corporativo para gestionar tus inversiones.").
  - Primary CTA: Prominent email sign-in link with `Mail` icon and `t("loginCard.emailLoginButton")` pointing to `/auth/login`.
  - Provider Compatibility Chips: Subtle horizontal row showing provider logos/chips (Google, Microsoft, Apple, Corporate SSO) with adaptive styling.
  - Disclaimer Note: `t("loginCard.disclaimerNote")` ("Plataforma de Inversiones BlueBrick · Acceso seguro e institucional para inversionistas verificados.").
  - Adaptive Styling: Seamless transition between dark luxury background/borders and crisp light luxury background/borders.
- `apps/web/src/components/theme/theme-toggle.tsx`:
  - Interactive Sun/Moon toggle button with smooth Motion transitions and accessible ARIA attributes.
- `apps/web/src/components/theme/theme-provider.tsx`:
  - React context providing `theme` state (`"dark" | "light"`), `toggleTheme()`, and localStorage persistence.
- `apps/web/src/app/providers.tsx`:
  - Incorporate `ThemeProvider` into global client providers hierarchy.
- `apps/web/src/app/page.tsx`:
  - Top navigation bar renders `<ThemeToggle />` alongside `<LocaleSwitcher />`.
  - Remove legacy props `investorName` and `initials` from `<InvestorLoginCard />`.

### Layer 2: Application / Consumption Layer
- `apps/web/src/components/theme/use-theme.ts`:
  - Hook providing theme consumption and switching logic.
- `apps/web/src/app/auth/login/route.ts`:
  - Existing PKCE WorkOS AuthKit route handler directing users to secure authentication screens.
- `apps/web/src/features/i18n/presentation/hooks/use-i18n.ts`:
  - Exposes reactive translations to presentation components.

### Layer 3: Domain & Contracts Layer
- `apps/web/src/features/i18n/domain/models/locale-types.ts`:
  - Update `LoginCardTokens` interface:
    - `headerTitle`: string
    - `privatePortalBadge`: string
    - `exclusiveAccessTitle`: string
    - `loginSubtitle`: string
    - `emailLoginButton`: string
    - `disclaimerNote`: string
    - `supportedProvidersLabel`: string
    - Remove deprecated `verifiedBadge`, `tierLabel`, `activeProjectsCount`, `enterDashboardButton`.
  - Update `CommonTokens` with `toggleThemeAria`: string.
- `apps/web/src/features/i18n/domain/schemas/i18n-dictionary-schema.ts`:
  - Update Zod schema `LoginCardTokensSchema` to match the new token contracts.
- `apps/web/src/features/i18n/domain/dictionaries/es.ts`:
  - Spanish dictionary translations.
- `apps/web/src/features/i18n/domain/dictionaries/en.ts`:
  - English dictionary translations.
- `apps/web/src/features/i18n/domain/dictionaries/pt.ts`:
  - Portuguese dictionary translations.

### Layer 4: Infrastructure Layer
- WorkOS AuthKit API endpoints and Next.js Edge/Node runtime boundaries.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: Complete Investor Login Redesign, Light/Dark Theme Support & Multi-Language Sync (Branch: `SPEC/jaymusicmachine-BBC-13-s01-investor-login-redesign`)
  - **RED Phase**: Write comprehensive failing unit tests in `tests/unit/investor-login-card.test.tsx`, `tests/unit/theme-toggle.test.tsx`, and update `tests/unit/email-auth-and-logout.test.tsx` and `tests/unit/i18n-dictionaries.test.ts`.
  - **GREEN Phase**: Implement `ThemeProvider`, `ThemeToggle`, updated i18n dictionaries, types, schema, `InvestorLoginCard` component, and landing page integration.
  - **REFACTOR Phase**: Execute clean-code review, ensure strict layer commentary, zero implicit `any`, and execute `pnpm validate`.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Paths**:
  - `tests/unit/investor-login-card.test.tsx`
  - `tests/unit/theme-toggle.test.tsx`
  - `tests/unit/i18n-dictionaries.test.ts`
  - `tests/unit/email-auth-and-logout.test.tsx`
- **Command**: `pnpm test tests/unit/investor-login-card.test.tsx tests/unit/theme-toggle.test.tsx tests/unit/i18n-dictionaries.test.ts tests/unit/email-auth-and-logout.test.tsx`
- **Assertion Goals**:
  - Verify `InvestorLoginCard` renders "Acceso exclusivo para inversionistas", "Portal Privado", and "Ingresa con tu correo".
  - Verify `InvestorLoginCard` does NOT render "Sofía Martínez", initials avatar, "Demo Verificada", or "Entrar al Dashboard".
  - Verify primary button points to `/auth/login`.
  - Verify provider compatibility row renders Google, Microsoft, Apple, and SSO indicators.
  - Verify `ThemeToggle` correctly toggles dark/light theme classes and persists choice.
  - Verify all three dictionaries (ES, EN, PT) contain matching, non-empty tokens conforming to `LoginCardTokensSchema`.

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas de regresión pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] La documentación de arquitectura local está actualizada sin placeholders.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BBC-13-investor-login-redesign.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-13-investor-login-redesign.md)
- **Solution Spec**: [feature-jaymusicmachine-BBC-13-investor-login-redesign-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-13-investor-login-redesign-implementation.md)
- **Linear Issue**: [Linear Ticket #BBC-13](https://linear.app/brids-app/issue/BBC-13)

