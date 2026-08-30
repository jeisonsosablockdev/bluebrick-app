# Problem Spec: email-auth-and-logout

## What problem exists
Currently, the authentication flow in the BlueBrick platform is visually and conceptually restricted to "Google OAuth" (labeled specifically as "Iniciar sesión con Google" / "Sign in with Google" with a Google SVG icon in the `InvestorLoginCard`). Additionally, there is no explicit visual logout / sign out mechanism available for authenticated investors in the dashboard top navigation header once they have entered the platform session.

## Why it matters
Institutional and private real estate investors frequently use corporate email domains (Microsoft 365, Outlook, custom domain email addresses, ProtonMail, corporate SSO) rather than personal Google accounts. Having a Google-only label confuses institutional users and reduces trust. Furthermore, investors require an immediate, secure, and accessible way to terminate active sessions from the dashboard header (compliance with security standards and session hygiene).

## What outcome is expected
1. The login card on the landing page displays a universal email authentication entrypoint ("Continuar con Correo Electrónico" / "Sign in with Email" / "Entrar com E-mail") with a clean, luxury mail icon (`Mail` from `lucide-react`), initiating WorkOS AuthKit's universal email / magic link / SSO hosted flow.
2. The sign-in flow enforces fresh re-authentication via standard OIDC `maxAge: 0` (`getSignInUrl({ maxAge: 0 })`), ensuring users are always prompted for their credentials on new login attempts after a session is closed.
3. An elegant and accessible logout button (`LogOut` from `lucide-react`) is integrated into the dashboard header alongside the investor profile and locale switcher, with responsive mobile optimization (`.dash-user-text-container`, `.dash-logout-btn`).
4. Clicking logout invokes `signOutAction()` / `/auth/logout` to synchronously and cleanly clear all local session and PKCE cookies (`wos-session`, `workos-access-token`, `wos-pkce-*`) from Next.js cookie store and immediately redirect back to `/` without external redirect errors.
5. Full multi-language support (Spanish, English, Portuguese) for all new auth tokens across the dictionary schema (`common.logout`, `loginCard.emailLoginButton`).
6. 100% test coverage including unit tests, structural tests, and UI integration tests with zero regression.

## What gaps exist today
- Solved in BBC-10: Replaced Google-only button with universal email login, added dashboard header logout button, local cookie clearance mechanism, `maxAge: 0` re-auth, and complete i18n support.

## What questions remain open
- None. The WorkOS AuthKit Next.js integration supports universal email authentication with `maxAge: 0`, and local session termination handles clean redirects to `/`.
