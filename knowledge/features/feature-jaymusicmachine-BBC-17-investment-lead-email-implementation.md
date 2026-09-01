# Solution Spec: investment-lead-email Implementation (BBC-17)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `api` & `frontend`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture
La implementación conecta el botón "Invertir ahora" con un flujo de notificación por correo electrónico hacia `contacto@bluebrick.capital` preservando estrictamente el desacoplamiento en 4 capas funcionales:

1. **Presentation Layer (Layer 1)**:
   - `apps/web/src/components/dashboard/investment-dashboard.tsx`:
     - Conexión del evento `onClick` en el botón CTA de la sección de reinversión.
     - Gestión reactiva de estados: `idle`, `submitting` (deshabilitado con spinner/microanimación), `success` (confirmación visual/toast informando que el equipo se comunicará) y `error`.
     - Accesibilidad completa (`aria-busy`, estados para lectores de pantalla y soporte de reducción de movimiento).

2. **Application / Consumption Layer (Layer 2)**:
   - `apps/web/src/lib/auth/investment-actions.ts`:
     - Server Action seguro `submitInvestmentLeadAction()` marcado con `"use server"`.
     - Verificación estricta de autenticación mediante la sesión de WorkOS AuthKit (`workosSession`).
     - Protección de frecuencia (cooldown/rate-limiting en sesión para prevenir envíos duplicados o flooding de clics).
     - Orquestación del pipeline de dominio y manejo de respuestas tipadas `{ success: boolean; message: string; error?: string }`.

3. **Domain / Pipelines Layer (Layer 3)**:
   - `apps/web/src/lib/pipelines/investment-lead/investment-lead-schema.ts`:
     - Contrato de validación Zod para el payload del lead (`investorId`, `investorName`, `investorEmail`, `tier`, `timestamp`, `metadata`).
   - `apps/web/src/lib/pipelines/investment-lead/investment-lead-template.ts`:
     - Generador de plantilla HTML corporativa con estética institucional de BlueBrick (dark mode, tipografía institucional, datos del inversionista y enlace de respuesta directa) y fallback en texto plano.

4. **Infrastructure Layer (Layer 4)**:
   - `apps/web/src/lib/infrastructure/email/smtp-mailer.ts`:
     - Módulo de transporte SMTP basado en `nodemailer` encapsulado y resiliente.
     - Configuración vía variables de entorno (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`).
     - Modo *dry-run* / emulado automático en entornos de test y desarrollo local cuando las credenciales SMTP no están presentes, garantizando que los tests y el servidor local no fallen.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: *SMTP Infrastructure & Investment Lead Domain Pipeline* (Rama: `SPEC/jaymusicmachine-BBC-17-s01-smtp-infrastructure-and-lead-pipeline`)
  - Instalación de `nodemailer` y `@types/nodemailer`.
  - Creación del cliente de infraestructura `smtp-mailer.ts` y contratos Zod en `investment-lead-schema.ts`.
  - Generador de plantillas HTML y texto en `investment-lead-template.ts`.
  - Suite de pruebas unitarias TDD (RED -> GREEN -> REFACTOR).
- **SPEC-2**: *Server Action & Dashboard CTA Integration* (Rama: `SPEC/jaymusicmachine-BBC-17-s02-server-action-and-dashboard-cta`)
  - Creación del Server Action `submitInvestmentLeadAction()` con verificación de sesión WorkOS.
  - Conexión del botón "Invertir ahora" en `investment-dashboard.tsx` con estados de carga y feedback visual.
  - Actualización de `.env.example` con la documentación de variables SMTP.
  - Validación completa con `pnpm validate` y pruebas unitarias de integración.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `tests/unit/investment-lead-email.test.ts` y `tests/unit/investment-dashboard-cta.test.tsx`
- **Command**: `pnpm test tests/unit/investment-lead-email.test.ts`
- **Assertion Goals**:
  - Validar que el schema Zod rechaza payloads inválidos o con emails mal formados.
  - Validar que el generador de plantillas incluye el nombre, email, tier y fecha del inversionista.
  - Validar que el cliente SMTP envía correctamente los datos y opera en modo seguro ante variables ausentes.
  - Validar que el Server Action rechaza invocaciones de usuarios no autenticados.
  - Validar que el botón en el dashboard entra en estado de carga al hacer clic y muestra la confirmación al completarse.

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas de regresión pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] La documentación de variables en `.env.example` está actualizada.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BBC-17-investment-lead-email.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-17-investment-lead-email.md)
- **Solution Spec**: [feature-jaymusicmachine-BBC-17-investment-lead-email-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-17-investment-lead-email-implementation.md)
- **Linear Issue**: [Linear Ticket #BBC-17](https://linear.app/bluebrick/issue/BBC-17)
