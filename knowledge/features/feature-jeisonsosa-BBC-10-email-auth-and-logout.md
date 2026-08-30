# Problem Spec: email-auth-and-logout

## What problem exists
Currently, the authentication flow in the BlueBrick platform is visually and conceptually restricted to "Google OAuth" (labeled specifically as "Iniciar sesión con Google" / "Sign in with Google" with a Google SVG icon in the `InvestorLoginCard`). Additionally, there is no explicit visual logout / sign out mechanism available for authenticated investors in the dashboard top navigation header once they have entered the platform session.

## Why it matters
Institutional and private real estate investors frequently use corporate email domains (Microsoft 365, Outlook, custom domain email addresses, ProtonMail, corporate SSO) rather than personal Google accounts. Having a Google-only label confuses institutional users and reduces trust. Furthermore, investors require an immediate, secure, and accessible way to terminate active sessions from the dashboard header (compliance with security standards and session hygiene).

## What outcome is expected
1. The login card on the landing page displays a universal email authentication entrypoint ("Continuar con Correo Electrónico" / "Sign in with Email" / "Entrar com E-mail") with a clean, luxury mail icon (`Mail` from `lucide-react`), initiating WorkOS AuthKit's universal email / magic link / SSO hosted flow.
2. An elegant and accessible logout button (`LogOut` from `lucide-react`) is integrated into the dashboard header alongside the investor profile and locale switcher.
3. Clicking logout invokes the `signOutAction()` server action to securely invalidate the encrypted WorkOS session cookie and redirect the user back to the landing page.
4. Full multi-language support (Spanish, English, Portuguese) for all new auth tokens across the dictionary schema.
5. 100% test coverage including unit tests, structural tests, and UI integration tests with zero regression.

## What gaps exist today
- `InvestorLoginCard` hardcodes Google iconography and text strings.
- `apps/web/src/lib/auth/actions.ts` explicitly requests `provider: "GoogleOAuth"`.
- `apps/web/src/components/dashboard/investment-dashboard.tsx` header lacks a logout action button.
- Missing localized dictionary keys for universal email login and logout actions in `es.ts`, `en.ts`, and `pt.ts`.

## What questions remain open
- None. The WorkOS AuthKit Next.js integration already supports universal email authentication natively via `getSignInUrl()` without explicit provider overrides.
