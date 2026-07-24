---
type: RFC
title: STORY- 013 06 Qa Rollout Observability And Kill Switch
description: STORY- 013 06 Qa Rollout Observability And Kill Switch - migrated from knowledge/
tags: [rfcs]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-013-pwa-installability-and-web-push-notifications/STORY-013-06-qa-rollout-observability-and-kill-switch.md
---

# STORY-013-06-qa-rollout-observability-and-kill-switch

## Metadata
- Epic: `EPIC-013-pwa-installability-and-web-push-notifications`
- Story ID: `STORY-013-06-qa-rollout-observability-and-kill-switch`
- Status: `implemented` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-05-09`
- Last Updated: `2026-05-12`

## Context
- Problem:
  PWA + push tiende a “funcionar en mi laptop” y fallar en combinaciones reales de browser, modo standalone y permisos. Sin rollout disciplinado y evidencia dura, la iniciativa puede declararse lista falsamente.
- Why now:
  Este epic toca browser capabilities, auth, service worker y background delivery. Necesita una historia de verificacion desde el inicio.
- Constraints:
  - Frontend del repo exige Playwright y responsive QA.
  - Flujos wallet pueden requerir Synpress.
  - Debe haber evidencia reproducible.
- Affected paths:
  - `e2e/*`
  - `knowledge/features/*`
  - `knowledge/auth-flow.md`
  - `knowledge/session-model.md`
  - observabilidad y feature flags

## Proposal
- Approach summary:
  Cerrar el epic con rollout controlado, kill-switch, evidencia browser y monitoreo de salud de suscripciones y entregas.
- Technical design:
  - Feature flag global para desactivar registro y/o envio.
  - Dashboard o reporte minimo de:
    - total de suscripciones activas,
    - opt-ins nuevos,
    - entregas exitosas,
    - fallos por plataforma,
    - pruning events.
  - Playwright para shell instalable, prompts y estados UI.
  - Synpress si el opt-in forma parte del flujo wallet autenticado final.
  - MCP browser evidence para path critico.
  - Responsive QA obligatorio en 320, 375, 768 y 1024.
  - Si alguna historia introduce tablas nuevas (`subscriptions`, `delivery_jobs`, `delivery_events`), el gate de salida incluye `validate:db`.
- Alternatives considered:
  - Dejar QA para el final.
    - Rechazado: es donde estos proyectos mas fallan.
- Tradeoffs:
  - Mas rigor y mas trabajo de cierre.
  - Menos riesgo de autoengaño.

## Critique
- Reviewer(s):
  - `Build Web Apps`
  - `security-auditor`
- Critical findings:
1. Sin kill-switch, cualquier bug de payload, targeting o flood te obliga a desplegar bajo presion con el canal activo.
2. Sin observabilidad por plataforma, vas a confundir fallos de iOS standalone con fallos generales del sistema.
3. Declarar exito solo por “se recibio una notificacion en mi telefono” no es una estrategia de QA.
- Blocking concerns:
  - No aprobar salida sin feature flag, evidencia E2E y metricas minimas de salud.

## Resolution
- Final approach after critique:
  El story se mantiene como gate formal de salida del EPIC.
- Changes accepted:
  - Kill-switch obligatorio.
  - Evidence pack como criterio de salida.
- Changes rejected (with rationale):
  - Rechazado considerar QA como una tarea accesoria.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-05-12`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Se aprueba un cierre pragmatico del EPIC: kill-switches discretos por capa, health snapshot admin y evidencia responsive automatizable del panel de notificaciones.

## Status
- Current status: `implemented`
- Next action:
  Preparar merge final de la rama de integracion a `develop` cuando el issue padre lo autorice.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - helpers de rollout/feature flags y metrics aggregation.
- Integration tests:
  - guardas server-side y rutas de control.
- Devnet validation (if applicable):
  - No aplica.
- Responsive QA (if applicable):
  - Obligatoria en 320px, 375px, 768px y 1024px.

## Release Gates
- Required quality gates:
  - `npm run validate`
  - `npm run validate:db` cuando haya trabajo de schema/persistencia

## Traceability
- Related issue(s): `BRI-157`
- Related PR(s): `pending`
- Final commit hash(es): `pending`
