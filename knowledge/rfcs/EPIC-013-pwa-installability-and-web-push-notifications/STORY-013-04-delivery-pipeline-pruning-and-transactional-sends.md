# STORY-013-04-delivery-pipeline-pruning-and-transactional-sends

## Metadata
- Epic: `EPIC-013-pwa-installability-and-web-push-notifications`
- Story ID: `STORY-013-04-delivery-pipeline-pruning-and-transactional-sends`
- Status: `implemented` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-05-09`
- Last Updated: `2026-05-12`

## Context
- Problem:
  La propuesta original usa una API route que recupera suscripciones y manda una por una. Eso sirve para una demo, no para un sistema confiable.
- Why now:
  Delivery es el verdadero centro del EPIC. Si esto nace mal, todo lo demas es UI encima de fragilidad.
- Constraints:
  - Funciones Vercel con duracion finita.
  - Fallos parciales y retries son inevitables.
  - Los endpoints muertos deben limpiarse automaticamente.
  - Los tipos de mensaje deben respetar el nuevo baseline de auth: algunos podran ser account-level y otros deben exigir wallet-bound ownership.
- Affected paths:
  - `app/api/notifications/send/*`
  - `lib/*notification*`
  - `db/*`
  - observabilidad y audit docs

## Proposal
- Approach summary:
  Implementar primero envios transaccionales o de cuenta, con una tuberia asincrona o por lotes e idempotencia. El caso “mandar a todos” no es el primer entregable.
- Technical design:
  - `POST /api/internal/notifications/enqueue` o equivalente server-only para publicar trabajos de envio.
  - Procesamiento por lotes con estado por job, reintento y pruning de `410 Gone`/errores equivalentes.
  - Si se usa Vercel Queues, dejar explicitado que hoy esta en beta y aislar la dependencia.
  - Log por campaña/job/delivery antes de habilitar casos masivos.
  - Clasificacion de mensajes permitidos para release 1:
    - cambios relevantes de cuenta,
    - hitos de onboarding,
    - estados criticos de checkout o reward,
    - eventos admin internos si existe caso claro.
  - El dispatch debe resolver audiencia desde identidad server-side (`account_id`, `wallet_public_key`) segun la clase del mensaje, no desde payload browser.
- Alternatives considered:
  - Loop sincrono dentro de `/api/notifications/send`.
    - Rechazado: fragil, opaco y dificil de reintentar bien.
- Tradeoffs:
  - Mayor complejidad operativa al inicio.
  - Mucha mas confiabilidad y trazabilidad.

## Critique
- Reviewer(s):
  - `security-auditor`
- Critical findings:
1. Un timeout en medio de un envio masivo sin job log te deja en tierra de nadie: no sabes a quien ya le mandaste ni a quien le vas a duplicar.
2. Un canal push sin pruning automatico convierte la base en un cementerio de endpoints.
3. Meter marketing broadcast antes de demostrar delivery y revoke en casos transaccionales es una mala apuesta de producto y de riesgo.
4. Si mensajes wallet-bound pueden salir por suscripciones tomadas solo desde sesion de cuenta, el canal queda semantica y regulatoriamente flojo.
- Blocking concerns:
  - No aprobar si el release 1 no limita scope a envios transaccionales y no define idempotencia/retry/pruning.

## Resolution
- Final approach after critique:
  La historia se enfoca en delivery confiable y casos transaccionales primero.
- Changes accepted:
  - Cola o batching durable.
  - Audit log y estado por job.
  - Auto-pruning como requisito, no “detalle”.
- Changes rejected (with rationale):
  - Rechazado el endpoint publico generico de envio masivo como base del sistema.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-05-12`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Se aprueba un pipeline transaccional wallet-targeted con jobs idempotentes, auth interna separada y fallback inline solo para entornos sin cola configurada.

## Status
- Current status: `implemented`
- Next action:
  Continuar con `STORY-013-05` solo sobre este pipeline ya endurecido.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - mapping de payload a push envelope y clasificacion de errores.
- Integration tests:
  - retry idempotente, pruning de endpoints invalidos, job status transitions.
- Devnet validation (if applicable):
  - No aplica.
- Responsive QA (if applicable):
  - No aplica.

## Traceability
- Related issue(s): `BRI-157`
- Related PR(s): `pending`
- Final commit hash(es): `pending`
