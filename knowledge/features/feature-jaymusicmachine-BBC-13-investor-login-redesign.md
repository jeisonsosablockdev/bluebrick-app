# Problem Spec: investor-login-redesign (BBC-13)

## What problem exists
Currently, the `InvestorLoginCard` component on the landing page renders a mock demo persona ("Sofía Martínez", initials "SM", "Inversionista Privado", "5 Proyectos Activos") with a 1-click bypass button ("Entrar al Dashboard" / "Enter Dashboard") and a "Demo Verificada" pill badge. 

This creates confusion between mock exploration and production institutional access:
1. **Misleading Demo Persona**: Displaying mock profile details ("Sofía Martínez") diminishes the institutional seriousness of the portal.
2. **Lack of Exclusive Investor Branding**: There is no explicit message stating "Acceso exclusivo para inversionistas" to set clear access boundaries.
3. **Unclear Multi-Provider Support**: While the backend leverages WorkOS AuthKit supporting Google, Microsoft, Apple, and corporate SSO/email, the UI does not visually convey this broad email/SSO compatibility in an intuitive, non-technical way (avoiding jargon like "login federado").
4. **Redundant 1-Click Entry**: The "Enter Dashboard" direct bypass allows bypassing authentication, conflicting with real investor security requirements.

## Why it matters
BlueBrick is an institutional-grade fractional real estate investment platform. Replacing mock demo artifacts with a dedicated, secure WorkOS login interface reinforces security, exclusivity, and professional user experience for accredited investors across Latin America and global markets.

## What outcome is expected
1. Complete removal of mock persona artifacts ("Sofía Martínez", avatar circle, "Demo Verificada" badge, and "Entrar al Dashboard" 1-click link).
2. Clean, dedicated Investor Access card centered exclusively on secure authentication.
3. Prominent, localized headline stating "Acceso exclusivo para inversionistas" ("Exclusive access for investors" / "Acesso exclusivo para investidores").
4. Top header badge displaying "Portal Privado" ("Private Portal").
5. Prominent primary CTA button "Ingresa con tu correo" ("Sign in with your email" / "Entrar com seu e-mail") connecting to `/auth/login` (WorkOS AuthKit).
6. Subtle horizontal row of provider icons/badges (Google, Microsoft, Apple, Corporate Email/SSO) communicating broad email compatibility without using confusing jargon.
7. Localized institutional disclaimer note: "Plataforma de Inversiones BlueBrick · Acceso seguro e institucional para inversionistas verificados."
8. Full multi-language dictionary synchronization across ES, EN, and PT with complete type safety and test coverage.
9. Comprehensive Light Mode and Dark Mode support with a luxury `ThemeToggle` (Sun/Moon icon) in the top navigation bar, seamless theme persistence, and adaptive theme styling for the landing page and `InvestorLoginCard`.

## What gaps exist today
- `InvestorLoginCard` has hardcoded/default props for `investorName` and `initials` and renders mock persona UI blocks.
- `apps/web/src/app/page.tsx` passes `investorName="Sofía Martínez"` and `initials="SM"`.
- The interface is locked to hardcoded dark theme CSS values; there is no theme toggle or dynamic light mode support in the landing navigation bar.
- i18n dictionaries (`es.ts`, `en.ts`, `pt.ts`) contain legacy tokens (`verifiedBadge: "Demo Verificada"`, `enterDashboardButton: "Entrar al Dashboard"`, and outdated `disclaimerNote`) that need updating with new token contracts (`privatePortalBadge`, `exclusiveAccessTitle`, `loginSubtitle`, `disclaimerNote`, `emailLoginButton`, `toggleThemeAria`).
- Unit tests in `tests/unit/` check for deprecated tokens and need alignment with the new component design and theme behavior.

## What questions remain open
None. All design requirements, token naming, light/dark theme toggle, and visual layout decisions were resolved via Socratic design interview (`/grill-me`).
