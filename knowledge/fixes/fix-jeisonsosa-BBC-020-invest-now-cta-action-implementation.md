# Solution Spec: fix-jeisonsosa-BBC-020-invest-now-cta-action Implementation

## VERSION ESPAÑOL

## 1. Gobernanza y Asignación de Agentes
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend` (integración React/Next.js y Server Actions)
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security` (validación de esquemas Zod y sanitización de entrada)

## 2. Descripción de la Solución y Arquitectura en 4 Capas
La solución desacopla la ejecución de la acción del proveedor de autenticación y utiliza la base de datos de Neon PostgreSQL como fuente de verdad de la identidad del usuario, enviando el correo de notificación al buzón configurado dinámicamente mediante variables de entorno:

1. **Capa 1: Presentación (`apps/web/src/components/dashboard/investment-dashboard.tsx`)**:
   - `handleInvestLeadClick` extrae los datos del inversionista conectado provistos desde el servidor y la base de datos (`initialData.investor`), incluyendo `investorId`, `investorName`, `investorEmail` y `tier`.
   - Invoca `submitInvestmentLeadAction` pasando este payload estructurado, manteniendo spinner (`isSubmittingLead`), feedback reactivo accesible (`role="status"`, `aria-live="polite"`) y estados de error.

2. **Capa 2: Aplicación / Server Action (`apps/web/src/lib/auth/investment-actions.ts`)**:
   - Elimina la dependencia frágil de `withAuth()` que falla en peticiones POST de Server Actions en producción y local.
   - Resuelve y verifica al inversionista consultando el repositorio de base de datos (`UserRepository` / `InvestmentRepository`). Si el payload contiene un correo o ID válido registrado en la base de datos o en la sesión, procede con la validación de dominio.
   - **Buzón Receptor Configurable**: El destinatario del correo (`to:`) se resuelve dinámicamente desde la variable de entorno `process.env.LEAD_NOTIFICATION_EMAIL` (con fallback a `process.env.SMTP_TO` o `contacto@bluebrick.capital`), permitiendo cambiarlo fácilmente para testing (`jsosa@primalcodelab.com`) o producción sin modificar código.
   - **Remitente y Respuesta**: El contenido del lead refleja al inversionista conectado, y `replyTo: validatedLead.investorEmail` para poder responderle directamente.
   - Aplica el cooldown anti-spam de 60 segundos por usuario (`investorId`).

3. **Capa 3: Dominio y Pipelines (`apps/web/src/lib/pipelines/investment-lead/`)**:
   - `investment-lead-schema.ts`: Esquema estricto Zod para validar `investorEmail`, `investorName`, `investorId`, `tier` y `timestamp`.
   - `investment-lead-template.ts`: Plantilla estructurada con los datos del inversionista que solicita reinvertir y detalles de contacto.

4. **Capa 4: Infraestructura (`apps/web/src/lib/infrastructure/`)**:
   - `user-repository.ts`: Añade método `findByEmail(email: string): Promise<DbUser | null>` para consulta directa por email contra Neon PostgreSQL.
   - `smtp-mailer.ts`: Despacho SMTP resiliente mediante Nodemailer con transporte seguro o fallback dry-run loggeado en consola.

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
The solution decouples action execution from the auth provider, uses Neon PostgreSQL database as the source of truth for the connected user, and routes notifications to a dynamically configurable inbox:

1. **Layer 1: Presentation (`apps/web/src/components/dashboard/investment-dashboard.tsx`)**:
   - `handleInvestLeadClick` extracts connected investor metadata from `initialData.investor` (`investorId`, `investorName`, `investorEmail`, `tier`).
   - Dispatches `submitInvestmentLeadAction` forwarding this structured payload, maintaining loading spinner (`isSubmittingLead`), accessible status feedback (`role="status"`, `aria-live="polite"`), and error states.

2. **Layer 2: Application / Server Action (`apps/web/src/lib/auth/investment-actions.ts`)**:
   - Eliminates fragile `withAuth()` guard that fails during Server Action POST requests in both production and local setups.
   - Verifies the investor against the database repository (`UserRepository` / `InvestmentRepository`).
   - **Configurable Destination Inbox**: Outbound lead notification recipient (`to:`) is dynamically resolved via `process.env.LEAD_NOTIFICATION_EMAIL` (falling back to `process.env.SMTP_TO` or `contacto@bluebrick.capital`), easily configurable for testing (`jsosa@primalcodelab.com`) or production without code edits.
   - **Lead Context & Reply-To**: Contains the connected user's metadata with `replyTo: validatedLead.investorEmail`.
   - Enforces 60-second anti-spam cooldown per investor (`investorId`).

3. **Layer 3: Domain & Pipelines (`apps/web/src/lib/pipelines/investment-lead/`)**:
   - `investment-lead-schema.ts`: Strict Zod schema validating `investorEmail`, `investorName`, `investorId`, `tier`, and `timestamp`.
   - `investment-lead-template.ts`: Tailored notification template for the operations/sales team detailing the investor request.

4. **Layer 4: Infrastructure (`apps/web/src/lib/infrastructure/`)**:
   - `user-repository.ts`: Adds `findByEmail(email: string): Promise<DbUser | null>`.
   - `smtp-mailer.ts`: Resilient Nodemailer SMTP transport with dry-run fallback.

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
