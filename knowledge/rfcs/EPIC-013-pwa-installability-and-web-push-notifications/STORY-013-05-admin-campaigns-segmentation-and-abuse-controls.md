# STORY-013-05-admin-campaigns-segmentation-and-abuse-controls

## Metadata
- Epic: `EPIC-013-pwa-installability-and-web-push-notifications`
- Story ID: `STORY-013-05-admin-campaigns-segmentation-and-abuse-controls`
- Status: `implemented` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-05-09`
- Last Updated: `2026-05-12`

## Context
- Problem:
  La idea de un panel admin para redactar y enviar mensajes es atractiva, pero es tambien la parte mas facil de abusar y la mas cara de corregir si se lanza sin controles.
- Why now:
  Este story debe existir en el plan para que el EPIC no finja que el problema termina en “activar push”, pero no debe ser el primer bloque implementado.
- Constraints:
  - RBAC actual del repo es wallet-first para admin: `admin|user` por allowlist server-side de wallets.
  - Segmentacion propuesta usa campos reales (`country`) y otros no consolidados (`activity`).
  - Los mensajes pueden tocar flujos sensibles de negocio.
- Affected paths:
  - `/admin/*`
  - `app/api/admin/*notifications*`
  - auditoria/observabilidad

## Proposal
- Approach summary:
  Habilitar campañas admin solo despues de tener delivery estable y guardrails suficientes.
- Technical design:
  - Ruta admin protegida con re-check server-side, feature flag y wallet-auth admin real; sesion federada sola no alcanza.
  - Preview de audiencia antes de enviar.
  - Dry-run que calcule elegibles, excluidos y razones.
  - Límite duro por campaña y por ventana de tiempo.
  - Clasificacion de tipo de mensaje y plantilla aprobada.
  - Audit log con actor, query/segmento, payload, volumen, resultado y cancelacion.
  - Segmentacion inicial solo sobre atributos con fuente de verdad clara.
- Alternatives considered:
  - Enviar a todos por defecto y luego agregar filtros.
    - Rechazado: es exactamente como se construye un canal de spam.
- Tradeoffs:
  - El panel queda menos “libre”.
  - A cambio se vuelve gobernable y defendible.

## Critique
- Reviewer(s):
  - `security-auditor`
- Critical findings:
1. “Solo mi `userId` admin puede disparar” es un control muy pobre si no queda trazado que disparo, a quien, con que criterio y con que volumen.
2. La segmentacion por `activity` hoy no esta bien definida; prometerla en el EPIC es vender una capacidad inexistente.
3. Si el panel permite texto libre y URL libre sin politicas de payload, acabas construyendo un motor de phishing interno por accidente.
- Blocking concerns:
  - No aprobar sin preview, dry-run, auditabilidad y restricciones de contenido/segmentacion.

## Resolution
- Final approach after critique:
  El story se mantiene, pero su implementacion queda condicionada a que existan capas previas maduras.
- Changes accepted:
  - Panel admin solo con controls fuertes.
  - Segmentacion inicial conservadora.
- Changes rejected (with rationale):
  - Rechazado el broadcast libre a “todos los usuarios” como primer modo de operacion.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-05-12`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Se aprueba un primer panel admin fuertemente recortado: preview obligatorio, dry-run, rate limit, audience cap, URL interna y segmentos solo sobre atributos modelados hoy.

## Status
- Current status: `implemented`
- Next action:
  Continuar con `STORY-013-06` para QA final, observabilidad y kill-switch.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - validacion de filtros y payload permitidos.
- Integration tests:
  - acceso admin, dry-run, audience cap, rechazo de segmentos invalidos.
- Devnet validation (if applicable):
  - No aplica.
- Responsive QA (if applicable):
  - Obligatoria si el panel UI entra en scope.

## Traceability
- Related issue(s): `BRI-157`
- Related PR(s): `pending`
- Final commit hash(es): `pending`
