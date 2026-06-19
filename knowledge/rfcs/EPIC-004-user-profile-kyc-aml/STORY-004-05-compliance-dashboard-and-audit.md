---
type: RFC
title: STORY- 004 05 Compliance Dashboard And Audit
description: STORY- 004 05 Compliance Dashboard And Audit - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-004-user-profile-kyc-aml/STORY-004-05-compliance-dashboard-and-audit.md
---

# STORY-004-05-compliance-dashboard-and-audit

## Metadata
- Epic: `EPIC-004-user-profile-kyc-aml`
- Story ID: `STORY-004-05-compliance-dashboard-and-audit`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-24`
- Last Updated: `2026-03-27`

## Context
- Problem:
  No existe una vista unica para que admin/compliance gestione excepciones KYC/AML con trazabilidad completa y buen rendimiento.
- Why now:
  Con Stripe y Helius integrados, operar con JOINs pesados para cada carga del panel no escala.
- Constraints:
  - Solo roles admin/compliance.
  - Lista operativa debe consultar estado denormalizado (`compliance_status`).
  - Rechazo y override requieren justificacion obligatoria.
  - Endpoints de decision deben ser idempotentes.
  - Auditoria con actor y timestamp UTC.
- Affected paths:
  - `app/admin/compliance/page.tsx`
  - `app/api/admin/compliance/cases/*`
  - `lib/compliance/case-service.ts`
  - `lib/compliance/compliance-status-projector.ts`
  - `db/migrations/*` (`user_profiles.compliance_status`, `compliance_audit_events`, `compliance_notes`)

## Proposal
- Approach summary:
  Crear panel de cumplimiento con cola performante basada en `compliance_status`, detalle por wallet y acciones de incidente auditables.
- API/routes:
  - `GET /api/admin/compliance/cases?status=<compliance_status>&cursor=<...>`
  - `GET /api/admin/compliance/cases/:walletPublicKey`
  - `POST /api/admin/compliance/cases/:walletPublicKey/kyc-decision`
  - `POST /api/admin/compliance/cases/:walletPublicKey/aml-decision`
  - `POST /api/admin/compliance/cases/:walletPublicKey/suspend`
  - `POST /api/admin/compliance/cases/:walletPublicKey/unsuspend`
  - `POST /api/admin/compliance/cases/:walletPublicKey/notes`
  - `GET /api/admin/compliance/cases/:walletPublicKey/notes`

## Functional Design
- Lista principal (`/admin/compliance`):
  - Fuente: `user_profiles` con índice por `compliance_status` y `compliance_status_updated_at`.
  - Filtros: `pending_kyc`, `pending_aml`, `pending_review`, `fully_verified`, `restricted_aml`, `suspended`.
  - Badge global de pendientes.
- Detalle de caso:
  - Perfil basico, `kyc_status`, `aml_status`, `compliance_status`, historial auditoría y notas internas.
- Acciones admin:
  - `kyc-decision` (`verified`/`rejected` con reason obligatorio para rechazo).
  - `aml-decision` (override con reason obligatorio).
  - `suspend`/`unsuspend` de cuenta para bloquear/desbloquear funciones financieras.
  - `add internal note` para investigación operativa.
- Reglas críticas:
  - `suspended` tiene prioridad sobre cualquier otro estado.
  - `restricted_aml` bloquea features financieras hasta decisión admin.
  - Todas las acciones disparan recomputación de `compliance_status`.

## Critique
- Reviewer(s):
  - `staff-review`
- Critical findings:
1. Riesgo de rendimiento por JOINs en tiempo real para el panel.
2. Ausencia de estado unificado para lógica de negocio futura.
3. Flujo de acciones admin incompleto para gestión de incidentes.
- Blocking concerns:
  Ninguno.

## Resolution
- Final approach after critique:
  Se adopta modelo denormalizado con `compliance_status` y flujo admin ampliado.
- Changes accepted:
  - Denormalización en `user_profiles.compliance_status`.
  - Proyector backend para sincronizar cambios KYC/AML/Admin.
  - Nuevas acciones admin: `suspend`, `unsuspend`, `internal notes`.
- Changes rejected (with rationale):
  - Cargar panel con JOIN dinámico completo por request: rechazado por escalabilidad.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-24`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobado para cerrar ciclo operativo KYC/AML con rendimiento y controles de incidente.

## Status
- Current status: `implemented`
- Next action:
  Ejecutar validacion end-to-end de operaciones admin y checklist responsive.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Proyector: combinaciones `kyc_status + aml_status + admin_flags -> compliance_status`.
  - Validación de reasons obligatorios para rechazo/override.
  - Idempotencia de acciones admin.
- Integration tests:
  - Lista de panel consulta `user_profiles` por `compliance_status` (sin JOIN crítico).
  - `suspend` cambia a `compliance_status=suspended` y bloquea endpoints financieros.
  - `unsuspend` restaura estado proyectado correcto.
  - Notas internas se crean y listan con auditoría.
- Performance tests:
  - Validar tiempo de respuesta estable de lista en dataset alto (paginación + índice).
- Responsive QA:
  - Validar `/admin/compliance` en `320/375/768/1024` sin overflow.

## Traceability
- Related issue(s): `EPIC-004`
- Related PR(s): `#58`
- Final commit hash(es): `0ff7653`
