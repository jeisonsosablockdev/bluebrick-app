# Solution Spec: fix-jeisonsosa-BBC-020-invest-now-cta-action Implementation

## VERSION ESPAÑOL

## 1. Gobernanza y Asignación de Agentes
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend` (integración React/Next.js y Server Actions)
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security` (validación de esquemas Zod y sanitización de entrada)

## 2. Descripción de la Solución y Arquitectura en 4 Capas
La solución corrige el flujo completo de la llamada a la acción "Invertir ahora" para que tome la identidad del usuario conectado y despache el correo de confirmación directamente a su casilla de correo (`validatedLead.investorEmail`), con soporte para modo testing (`jsosa@primalcodelab.com`):

1. **Capa 1: Presentación (`apps/web/src/components/dashboard/investment-dashboard.tsx`)**:
   - `handleInvestLeadClick` actualiza la invocación de `submitInvestmentLeadAction` pasando los metadatos del inversionista conectado (`investorId`, `investorName`, `investorEmail`, `tier`) obtenidos desde `initialData.investor`.
   - Se mantiene el spinner de carga (`isSubmittingLead`), feedback reactivo accesible (`role="status"`, `aria-live="polite"`) y mensajes en el idioma activo vía `useTranslation()`.

2. **Capa 2: Aplicación / Server Action (`apps/web/src/lib/auth/investment-actions.ts`)**:
   - Resuelve el inversionista de forma desacoplada y robusta:
     1. Prioriza la sesión activa de WorkOS (`withAuth()`).
     2. Si WorkOS no tiene sesión activa (entornos de prueba local, navegación con query param `?email=...`, o demo), resuelve el inversionista mediante el payload validado en conjunto con `getAuthenticatedInvestor()`.
   - **Destinatario del Correo**: El destinatario principal (`to:`) del despacho SMTP es estrictamente `validatedLead.investorEmail` (la persona conectada).
   - Opcionalmente añade copia (`cc` o `bcc`) a la casilla institucional (`process.env.LEAD_NOTIFICATION_COPY_EMAIL` o `contacto@bluebrick.capital`), preservando la invariante de que quien hace clic es quien recibe la confirmación.

3. **Capa 3: Dominio y Pipelines (`apps/web/src/lib/pipelines/investment-lead/`)**:
   - `investment-lead-schema.ts`: Esquema estricto Zod para validar `investorEmail`, `investorName`, `investorId`, `tier` y `timestamp`.
   - `investment-lead-template.ts`: Plantilla bilingüe/personalizada para el inversionista receptor, confirmando la recepción formal de su intención de inversión inmobiliaria.

4. **Capa 4: Infraestructura (`apps/web/src/lib/infrastructure/email/smtp-mailer.ts`)**:
   - Despacho SMTP resiliente mediante Nodemailer con transporte seguro (puerto 465/587) o fallback a dry-run loggeado en consola cuando las credenciales no están presentes en local.

## 3. Desglose de SPECs y Secuencia Lógica
- **SPEC-1**: `fix(cta): dispatch investment lead to connected investor email and handle session fallback`
  - Rama: `SPEC/jeisonsosa-BBC-020-s01-invest-now-connected-user-fix`
  - Ciclo interno:
    1. **RED (TDD)**: Actualizar y escribir pruebas unitarias en `tests/unit/investment-dashboard-cta.test.tsx` y `tests/unit/investment-lead-behavioral.test.ts` esperando que el correo vaya al inversionista conectado y no falle en modo demo/prueba.
    2. **GREEN**: Modificar `investment-dashboard.tsx` e `investment-actions.ts` para transferir y validar el perfil del inversionista y enviar a su correo.
    3. **REFACTOR**: Limpieza y auditoría de Clean Code en las 4 capas, garantizando cero dead code y comentarios JSDoc/TSDoc completos.

## 4. Estrategia de TDD (Test-Driven Development)
### Pruebas Unitarias / Integración (Fase RED)
- **Archivos de Prueba**:
  - `tests/unit/investment-dashboard-cta.test.tsx`: Verifica que el click en "Invertir ahora" envíe el perfil del inversionista conectado (`initialData.investor`) al Server Action.
  - `tests/unit/investment-lead-behavioral.test.ts`: Verifica que `submitInvestmentLeadAction` use `to: validatedLead.investorEmail`, admita inversionistas con email resuelto aun sin cookie WorkOS en local, y aplique el rate-limiting de 60 segundos.
- **Comando de Ejecución**: `pnpm test tests/unit/investment-dashboard-cta.test.tsx tests/unit/investment-lead-behavioral.test.ts`
- **Metas de Aserción**:
  - `expect(sendSmtpEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "jsosa@primalcodelab.com" }))` cuando el usuario conectado es `jsosa@primalcodelab.com`.
  - Respuestas exitosas `{ success: true, message: ... }` sin errores de `UNAUTHENTICATED` cuando se provee identidad válida.

## 5. Definición de Terminado Local (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] Las pruebas unitarias de CTA e Investment Lead pasan al 100%.
- [ ] `pnpm validate` se ejecuta con 0 errores de compilación, linter y tipos.
- [ ] Documentación técnica y trazabilidad completas sin placeholders.
- [ ] Aprobación explícita del humano registrada.

## 6. Trazabilidad de Artefactos
- **Problem Spec**: [fix-jeisonsosa-BBC-020-invest-now-cta-action.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/fixes/fix-jeisonsosa-BBC-020-invest-now-cta-action.md)
- **Solution Spec**: [fix-jeisonsosa-BBC-020-invest-now-cta-action-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/fixes/fix-jeisonsosa-BBC-020-invest-now-cta-action-implementation.md)
- **Linear Issue**: BBC-020 (Standalone Git Work Branch)

---

## ENGLISH VERSION

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend` (React/Next.js Server Actions integration)
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security` (Zod schemas & input sanitization)

## 2. Solution Overview & 4-Layer Architecture
The solution fixes the complete "Invest Now" CTA flow so that it captures the connected investor's identity and dispatches the confirmation email directly to their email address (`validatedLead.investorEmail`), with full support for testing environments (`jsosa@primalcodelab.com`):

1. **Layer 1: Presentation (`apps/web/src/components/dashboard/investment-dashboard.tsx`)**:
   - `handleInvestLeadClick` updates the call to `submitInvestmentLeadAction` passing connected investor attributes (`investorId`, `investorName`, `investorEmail`, `tier`) from `initialData.investor`.
   - Preserves loading spinner (`isSubmittingLead`), accessible reactive status feedback (`role="status"`, `aria-live="polite"`), and multi-language strings via `useTranslation()`.

2. **Layer 2: Application / Server Action (`apps/web/src/lib/auth/investment-actions.ts`)**:
   - Resolves investor identity in a decoupled and resilient manner:
     1. Prioritizes active WorkOS session (`withAuth()`).
     2. If WorkOS session is unavailable (local testing, query parameter `?email=...`, or demo), resolves identity from the validated client payload alongside `getAuthenticatedInvestor()`.
   - **Email Recipient**: Primary recipient (`to:`) for SMTP dispatch is strictly `validatedLead.investorEmail` (the connected user).
   - Optionally includes a copy (`cc` or `bcc`) to corporate inbox (`process.env.LEAD_NOTIFICATION_COPY_EMAIL` or `contacto@bluebrick.capital`), preserving the invariant that whoever clicks receives confirmation.

3. **Layer 3: Domain & Pipelines (`apps/web/src/lib/pipelines/investment-lead/`)**:
   - `investment-lead-schema.ts`: Strict Zod validation for `investorEmail`, `investorName`, `investorId`, `tier`, and `timestamp`.
   - `investment-lead-template.ts`: Personalized investor template confirming receipt of their fractional real estate investment intent.

4. **Layer 4: Infrastructure (`apps/web/src/lib/infrastructure/email/smtp-mailer.ts`)**:
   - Resilient Nodemailer SMTP transport (port 465/587) with dry-run console logging fallback when credentials are absent.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: `fix(cta): dispatch investment lead to connected investor email and handle session fallback`
  - Branch: `SPEC/jeisonsosa-BBC-020-s01-invest-now-connected-user-fix`
  - Internal cycle:
    1. **RED (TDD)**: Update unit tests in `tests/unit/investment-dashboard-cta.test.tsx` and `tests/unit/investment-lead-behavioral.test.ts` to assert that emails are addressed to the connected investor and do not fail in demo/test modes.
    2. **GREEN**: Implement payload passing in `investment-dashboard.tsx` and recipient resolution in `investment-actions.ts`.
    3. **REFACTOR**: Clean Code review across the 4 layers, verifying zero dead code and thorough TSDoc comments.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (RED Phase)
- **Test Files**:
  - `tests/unit/investment-dashboard-cta.test.tsx`: Verifies "Invest Now" click forwards connected investor profile to server action.
  - `tests/unit/investment-lead-behavioral.test.ts`: Verifies `submitInvestmentLeadAction` targets `to: validatedLead.investorEmail`, accepts resolved emails without active WorkOS cookies in local mode, and enforces 60-second cooldown.
- **Test Command**: `pnpm test tests/unit/investment-dashboard-cta.test.tsx tests/unit/investment-lead-behavioral.test.ts`
- **Assertion Goals**:
  - `expect(sendSmtpEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "jsosa@primalcodelab.com" }))` when user is `jsosa@primalcodelab.com`.
  - `{ success: true }` responses without `UNAUTHENTICATED` errors on valid identity.

## 5. Local Definition of Done (DoD)
- [ ] State tracker phase is `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] Unit tests pass 100%.
- [ ] `pnpm validate` executes with 0 errors and 0 warnings.
- [ ] Documentation is complete with zero placeholders.
- [ ] Human acceptance explicitly granted.

## 6. Spec Artifact Traceability
- **Problem Spec**: [fix-jeisonsosa-BBC-020-invest-now-cta-action.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/fixes/fix-jeisonsosa-BBC-020-invest-now-cta-action.md)
- **Solution Spec**: [fix-jeisonsosa-BBC-020-invest-now-cta-action-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/fixes/fix-jeisonsosa-BBC-020-invest-now-cta-action-implementation.md)
- **Linear Issue**: BBC-020 (Standalone Git Work Branch)
