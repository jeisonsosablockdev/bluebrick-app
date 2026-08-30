# Solution Spec: email-auth-and-logout Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture
The feature refactors the landing authentication entrypoint from a Google-specific button to a universal email login action, and introduces an accessible logout mechanism in the dashboard header:

1. **Layer 1: Presentation**
   - `apps/web/src/components/landing/investor-login-card.tsx`: Replace `GoogleIcon` with `Mail` from `lucide-react`, update label to localized `loginCard.emailLoginButton`, and connect to universal sign-in URL `/auth/login`.
   - `apps/web/src/components/dashboard/investment-dashboard.tsx`: Integrate explicit logout button in the header with `LogOut` icon, localized title `common.logout`, responsive user profile container (`.dash-user-text-container`), triggering `signOutAction()`.
   - `apps/web/src/app/globals.css`: Add `.dash-user-text-container` and `.dash-logout-btn` responsive utility classes.
2. **Layer 2: Application / Consumption**
   - `apps/web/src/lib/auth/actions.ts`: Implement `signInWithEmailAction()` calling WorkOS `getSignInUrl({ maxAge: 0 })` for universal email providers with fresh re-auth enforcement. Implement `signOutAction()` which synchronously clears `wos-session`, `workos-access-token`, `wos-pkce-*` cookies from Next.js cookie store and redirects cleanly to `/`.
   - `apps/web/src/app/auth/login/route.ts`: GET route handler generating PKCE authorization URL with dynamic port support and `maxAge: 0`.
   - `apps/web/src/app/auth/logout/route.ts`: GET route handler for URL-based logout clearing cookies and returning to `/`.
3. **Layer 3: Domain & Contracts**
   - `apps/web/src/features/i18n/domain/models/locale-types.ts`: Update dictionary interface with `loginCard.emailLoginButton` and `common.logout`.
   - `apps/web/src/features/i18n/domain/schemas/i18n-dictionary-schema.ts`: Validate new token definitions across schemas with Zod.
   - `apps/web/src/features/i18n/domain/dictionaries/{es,en,pt}.ts`: Spanish, English, and Portuguese dictionary translations for `emailLoginButton` and `logout`.
4. **Layer 4: Infrastructure**
   - `apps/web/src/lib/auth/workos-session.ts`: WorkOS AuthKit session management and JIT database synchronization.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: Universal Email Authentication & Dashboard Header Logout (Branch: `SPEC/jeisonsosa-BBC-10-s01-email-auth-and-logout`)
  - **Fase RED (TDD)**: Test suite covering dictionary schema validation, universal sign-in action resolution, logout server action behavior, and UI rendering of email login and logout triggers.
  - **Fase GREEN**: Implementation of presentation, application actions, dictionary tokens, and dashboard header integration with mandatory step-by-step in-code commentary.
  - **Fase REFACTOR**: Clean code pass (Ponytail audit), local session termination fix, `maxAge: 0` fresh authentication, typecheck, lint, and full harness validation.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `tests/unit/email-auth-and-logout.test.tsx`
- **Command**: `pnpm test tests/unit/email-auth-and-logout.test.tsx`
- **Assertion Goals**:
  - Verify `InvestorLoginCard` renders the universal email sign-in button with `Mail` icon and does not render Google-specific buttons.
  - Verify `InvestmentDashboard` header renders the logout button with `LogOut` icon.
  - Verify `es`, `en`, `pt` dictionaries contain valid strings for `emailLoginButton` and `logout`.
  - Verify `signOutAction` executes cleanly upon button click.

## 5. Local Definition of Done (DoD)
- [x] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [x] La suite de pruebas de regresión pasa al 100% (verde).
- [x] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [x] La documentación de arquitectura local y de gobernanza está actualizada.
- [x] Aprobación explícita del humano registrada y PR #12 generado.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jeisonsosa-BBC-10-email-auth-and-logout.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jeisonsosa-BBC-10-email-auth-and-logout.md)
- **Solution Spec**: [feature-jeisonsosa-BBC-10-email-auth-and-logout-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jeisonsosa-BBC-10-email-auth-and-logout-implementation.md)
- **Linear Issue**: [Linear Ticket #BBC-10](https://linear.app/brids-app/issue/BBC-10)
