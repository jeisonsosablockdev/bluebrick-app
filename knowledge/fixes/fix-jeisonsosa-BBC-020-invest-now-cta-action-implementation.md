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
- **SPEC-1**: `fix(cta): dispatch investment lead to connected investor email and handle session fallback` (COMPLETADO)
  - Rama: `SPEC/jeisonsosa-BBC-020-s01-invest-now-connected-user-fix`
  - Estado: Merged en rama padre.

- **SPEC-2**: `feat(lead-email): enrich lead notification with investor phone, reinvestment brief, and portfolio holdings summary`
  - Rama: `SPEC/jeisonsosa-BBC-020-lead-email-portfolio-brief`
  - Proyección 4 Capas:
    - **Capa 1 (Presentación)**: `apps/web/src/components/dashboard/investment-dashboard.tsx`
      - Extrae `totalInvested`, calcula capital proyectado para reinvertir (`reinvestmentCapital`), y mapea el resumen de `properties` (`propertyName`, `investedAmount`, `roi`, `status`).
      - Pasa estos campos al Server Action `submitInvestmentLeadAction`.
    - **Capa 2 (Aplicación)**: `apps/web/src/lib/auth/investment-actions.ts`
      - Consulta la tabla `clients` en Neon DB para obtener el teléfono si no viene en el payload (`SELECT phone FROM clients WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`).
      - Enriquece el payload del lead antes de invocar la plantilla.
    - **Capa 3 (Dominio)**:
      - `apps/web/src/lib/pipelines/investment-lead/investment-lead-schema.ts`: Agrega `investorPhone`, `reinvestmentCapital`, `totalInvested` y `currentInvestments` (array de objetos) como campos validados opcionales.
      - `apps/web/src/lib/pipelines/investment-lead/investment-lead-template.ts`: Renderiza en HTML y texto plano:
        1. Fila de teléfono en la ficha del inversionista.
        2. Bloque destacado de **Capital Disponible / Proyectado para Reinvertir**.
        3. Tabla de **Portafolio Actual** con los activos en los que ha invertido, montos y rendimientos.
    - **Capa 4 (Infraestructura)**: `apps/web/src/lib/infrastructure/email/smtp-mailer.ts` (mantiene transporte SMTP con logs y dry-run).

## 4. Estrategia de TDD (Test-Driven Development)
### Pruebas Unitarias / Integración (Fase RED)
- **Archivos de Prueba**:
  - `tests/unit/investment-dashboard-cta.test.tsx`: Verifica que el click en "Invertir ahora" envíe el teléfono, el capital de reinversión y la lista de inversiones actuales.
  - `tests/unit/investment-lead-behavioral.test.ts`: Verifica que el esquema acepte `investorPhone`, `reinvestmentCapital` y `currentInvestments`, y que las plantillas HTML y texto plano incluyan el teléfono, el monto de reinversión y la tabla de proyectos invertidos.
- **Comando de Ejecución**: `pnpm test tests/unit/investment-dashboard-cta.test.tsx tests/unit/investment-lead-behavioral.test.ts`
- **Metas de Aserción**:
  - `expect(html).toContain("Teléfono")` y `expect(html).toContain("+57 300 123 4567")` (o valor sanitizado).
  - `expect(html).toContain("Capital para Reinvertir")` y `expect(html).toContain("$25,000")`.
  - `expect(html).toContain("Portafolio Actual")` y nombres de proyectos con sus montos invertidos.
  - `expect(text).toContain("Teléfono:")` y lista en texto plano.

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
- **SPEC-1**: `fix(cta): dispatch investment lead to connected investor email and handle session fallback` (COMPLETED)
  - Branch: `SPEC/jeisonsosa-BBC-020-s01-invest-now-connected-user-fix`
  - Status: Merged into parent work branch.

- **SPEC-2**: `feat(lead-email): enrich lead notification with investor phone, reinvestment brief, and portfolio holdings summary`
  - Branch: `SPEC/jeisonsosa-BBC-020-lead-email-portfolio-brief`
  - Status: Merged into parent work branch.

- **SPEC-3**: `feat(i18n): internationalize investment lead feedback messages across ES, EN, and PT`
  - Branch: `SPEC/jeisonsosa-BBC-020-s03-i18n-lead-feedback`
  - 4-Layer Delivery:
    - **Layer 1 (Presentation)**: `apps/web/src/components/dashboard/investment-dashboard.tsx`
      - Translate lead submission feedback reactively via `t("dashboard.reinvestment.success")`, `t("dashboard.reinvestment.successDryRun")`, and `t("dashboard.reinvestment.cooldownError")`.
    - **Layer 2 (Application)**: `apps/web/src/lib/auth/investment-actions.ts`
      - Return machine-readable `code: "SUCCESS" | "DRY_RUN" | "RATE_LIMIT_COOLDOWN" | "ERROR"` in `InvestmentLeadActionResult`.
    - **Layer 3 (Domain)**:
      - `apps/web/src/features/i18n/domain/dictionaries/es.ts`: Add Spanish translation keys.
      - `apps/web/src/features/i18n/domain/dictionaries/en.ts`: Add English translation keys.
      - `apps/web/src/features/i18n/domain/dictionaries/pt.ts`: Add Portuguese translation keys.
      - `apps/web/src/features/i18n/domain/schemas/i18n-dictionary-schema.ts`: Ensure schema accepts new keys.
    - **Layer 4 (Infrastructure)**: `apps/web/src/features/i18n/infrastructure/dictionary-loader-adapter.ts`.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (RED Phase)
- **Test Files**:
  - `tests/unit/investment-dashboard-cta.test.tsx`:
    - Add test asserting that when dashboard locale is English (`en`), clicking "Invest Now" renders "Investment request submitted successfully. Our team will contact you shortly." instead of Spanish.
    - Add test asserting that rate limit cooldown renders in English "Please wait before submitting a new investment request.".
  - `tests/unit/i18n-dictionaries.test.ts`:
    - Assert all 3 dictionaries (`es`, `en`, `pt`) contain matching keys for `dashboard.reinvestment.success`, `dashboard.reinvestment.successDryRun`, and `dashboard.reinvestment.cooldownError`.
- **Test Command**: `pnpm test tests/unit/investment-dashboard-cta.test.tsx tests/unit/i18n-dictionaries.test.ts`
- **Assertion Goals**:
  - 100% dictionary symmetry across languages.
  - Client feedback respects active locale.

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
