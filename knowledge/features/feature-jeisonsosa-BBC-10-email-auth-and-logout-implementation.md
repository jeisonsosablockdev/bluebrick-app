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
   - `apps/web/src/components/dashboard/investment-dashboard.tsx`: Integrate explicit logout button in the header with `LogOut` icon, localized title `nav.logout` / `common.logout`, triggering `signOutAction()`.
   - `apps/web/src/components/auth/logout-button.tsx`: Dedicated presentation component for handling session sign-out with loading state and clean redirect.
2. **Layer 2: Application / Consumption**
   - `apps/web/src/lib/auth/actions.ts`: Refactor `signInAction()` / `signInWithEmailAction()` to call WorkOS `getSignInUrl()` without restricting to GoogleOAuth, supporting all email providers. Maintain `signOutAction()` which clears session cookies via WorkOS AuthKit.
   - `apps/web/src/app/auth/login/route.ts`: Update GET route handler to use universal AuthKit sign-in URL generation.
3. **Layer 3: Domain & Contracts**
   - `apps/web/src/features/i18n/domain/models/locale-types.ts`: Update dictionary interface with `loginCard.emailLoginButton` and `nav.logout` / `common.logout`.
   - `apps/web/src/features/i18n/domain/schemas/i18n-dictionary-schema.ts`: Validate new token definitions across schemas.
   - `apps/web/src/features/i18n/domain/dictionaries/{es,en,pt}.ts`: Populate Spanish, English, and Portuguese translations for email login and logout actions.
4. **Layer 4: Infrastructure**
   - `apps/web/src/lib/auth/workos-session.ts`: WorkOS AuthKit integration and session management.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: Universal Email Authentication & Dashboard Header Logout (Branch: `SPEC/jeisonsosa-BBC-10-s01-email-auth-and-logout`)
  - **Fase RED (TDD)**: Test suite covering dictionary schema validation, universal sign-in action resolution, logout server action behavior, and UI rendering of email login and logout triggers.
  - **Fase GREEN**: Implementation of presentation, application actions, dictionary tokens, and dashboard header integration with mandatory step-by-step in-code commentary.
  - **Fase REFACTOR**: Clean code pass, removal of unused Google iconography, typecheck, lint, and full harness validation.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `tests/unit/email-auth-and-logout.test.tsx` and `tests/unit/auth-actions.test.ts`
- **Command**: `pnpm test tests/unit/email-auth-and-logout.test.tsx`
- **Assertion Goals**:
  - Verify `InvestorLoginCard` renders the universal email sign-in button with `Mail` icon and does not render `Iniciar sesión con Google`.
  - Verify `InvestmentDashboard` header renders the logout button with `LogOut` icon.
  - Verify `es`, `en`, `pt` dictionaries contain valid strings for `emailLoginButton` and `logout`.
  - Verify `signInWithEmailAction` / `signInAction` generates universal WorkOS sign-in redirect URL without `provider: "GoogleOAuth"`.

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas de regresión pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] La documentación de arquitectura local y de base de datos está actualizada.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jeisonsosa-BBC-10-email-auth-and-logout.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jeisonsosa-BBC-10-email-auth-and-logout.md)
- **Solution Spec**: [feature-jeisonsosa-BBC-10-email-auth-and-logout-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jeisonsosa-BBC-10-email-auth-and-logout-implementation.md)
- **Linear Issue**: [Linear Ticket #BBC-10](https://linear.app/brids-app/issue/BBC-10)
