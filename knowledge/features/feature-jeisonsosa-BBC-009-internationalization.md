# Problem Spec: Internationalization (BBC-009)

## What problem exists
Currently, the BlueBrick platform is hardcoded in Spanish across the entire user experience—including the landing page hero, investor mock login card, institutional investment dashboard, status badges, metrics rows, portfolio allocation charts, reinvestment opportunity banners, and modal dialogs. International real estate investors from English-speaking jurisdictions (such as the US/Global markets) and Brazilian Portuguese markets cannot navigate the portal in their native language or with localized number/date/currency conventions.

## Why it matters
BlueBrick operates in the United States (USA), offering tokenized real estate investments denominated exclusively in US Dollars (USD). Supporting multi-language localization (English `en`, Spanish `es`, and Portuguese `pt`) while strictly maintaining USD financial denomination is critical for:
1. **Global Investor Acquisition**: Enabling frictionless onboarding for cross-border capital and international family offices investing in US real estate assets.
2. **Institutional Governance & Trust**: Providing professional, native translations and precise legal/financial nomenclature under US market standards.
3. **Transaction Clarity & USD Denomination**: Eliminating ambiguity in financial metrics, returns, timeline dates, and investment states by ensuring all monetary figures across all three languages explicitly represent **US Dollars ($ USD)**.

## What outcome is expected
1. **4-Layer Feature Architecture**: A clean, modular `apps/web/src/features/i18n/` feature module strictly respecting Presentation, Application, Domain, and Infrastructure boundaries.
2. **Complete Dictionary Parity**: Typed, zero-gap translation dictionaries for English (`en`), Spanish (`es`), and Portuguese (`pt`), strictly validated at compile time with TypeScript and at test time with Zod schemas.
3. **Strict USD Financial Formatting**: All monetary figures, minimum investment amounts, capital values, and returns are formatted in US Dollars (USD) across all supported languages.
4. **Persistent Locale Management**: Server-compatible cookie resolution (`bb_locale`) paired with browser `Accept-Language` / `navigator.languages` detection fallback.
5. **Accessible Luxury UI**: An interactive, dark-luxury-styled `LocaleSwitcher` component with smooth Motion transitions, accessible ARIA attributes, and instant feedback.
6. **Universal React Hook & Provider**: `I18nProvider` context and `useI18n()` hook providing typed interpolation `t(key, params)` and localized formatters (`formatCurrency`, `formatDate`, `formatPercent`).
7. **Zero Hydration Mismatch**: Seamless SSR and client hydration without layout shift or text flicker.
8. **Comprehensive Automated Verification**: 100% test coverage across schemas, adapters, state providers, and translated UI components, passing `pnpm validate` cleanly.

## What gaps exist today
1. **Hardcoded UI Strings**: All presentation components (`landing-hero.tsx`, `investor-login-card.tsx`, `investment-dashboard.tsx`, etc.) contain hardcoded Spanish strings.
2. **Lack of Localization Contracts**: No typed translation dictionary schema or port interfaces exist in the domain layer.
3. **No Locale State / Persistence**: The application does not store or read user locale preferences via cookies or HTTP headers.
4. **Monolithic Formatting**: Metric formatting functions use hardcoded static formatting instead of locale-sensitive `Intl` formatters with USD compliance.

## What questions remain open
1. **Default Locale**: Spanish (`es`) remains the default fallback locale to preserve backwards compatibility with existing users, while English (`en`) and Portuguese (`pt`) are selectable.
2. **Currency Denomination**: All operations and assets are based in the USA, so the platform currency is strictly **USD ($ USD)** across all three languages.
3. **Cookie Specification**: Use `bb_locale` cookie with `SameSite=Lax`, `Path=/`, and a 365-day expiration for persistent preferences across Edge/RSC/Client boundaries.
