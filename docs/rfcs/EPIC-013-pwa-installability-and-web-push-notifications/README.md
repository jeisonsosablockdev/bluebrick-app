# EPIC-013-pwa-installability-and-web-push-notifications

## Metadata
- Epic ID: `EPIC-013`
- Title: `PWA Installability and Web Push Notifications`
- Status: `in-review`
- Owner: `jaymusicmachine`
- Created: `2026-05-09`
- Last Updated: `2026-05-11`

## Scope
- Problem statement:
  BRIDS hoy no tiene una capa PWA real ni un canal nativo de re-engagement desde la web. La idea original propone cerrar esa brecha con manifest, service worker, persistencia de suscripciones y un panel de envios admin. El problema es que el plan inicial esta ordenado al reves: empieza por cosmetica de instalacion y termina en la parte realmente peligrosa, que es autorizacion, consent, trazabilidad, limites operativos y abuso del canal.
- Business goal:
  Habilitar un canal de notificaciones web que sirva para eventos de alto valor y alta oportunidad temporal sin degradar confianza, seguridad ni operacion.
- Technical goal:
  Entregar una base PWA instalable y un pipeline de Web Push que:
  1. respete el modelo de sesion hibrido actual (`workos` de cuenta + `siws_session` de wallet),
  2. persista multiples suscripciones por wallet/dispositivo,
  3. entregue mensajes auditables y revocables,
  4. no dependa de un loop ingenuo dentro de una sola request,
  5. limite el alcance del broadcast admin hasta que existan guardrails serios.
- Out of scope:
  - Offline-first complejo.
  - Cache agresivo de rutas autenticadas.
  - Notificaciones promocionales abiertas desde el primer release.
  - Segmentacion basada en atributos no modelados o no auditables.
  - Cualquier confianza en estado cliente para autorizacion, consentimiento o targeting.

## Success Criteria
- [ ] La app puede instalarse de forma consistente en Android y en iOS Home Screen con metadata valida y UX de ayuda no invasiva.
- [ ] Un usuario autenticado con SIWS puede registrar y revocar varias suscripciones por dispositivo/browser/install sin duplicados silenciosos.
- [ ] El backend almacena consentimiento, estado, ultima entrega, ultimo fallo y razon de desactivacion por suscripcion.
- [ ] Los envios usan procesamiento asincrono o por lotes con idempotencia, pruning de endpoints invalidos y auditoria de resultado.
- [ ] El primer release se limita a notificaciones transaccionales o de cuenta de alto valor; el broadcast admin queda bloqueado hasta que existan preview, rate limits, dry-run y trazabilidad.
- [ ] Los cambios de `/app`, `/lib` y `/db` quedan cubiertos por `@frontend-cycle`, Playwright, Synpress si el flujo wallet entra en E2E, responsive QA, `npm run validate` y `validate:db` contra Postgres limpio cuando haya trabajo de schema/persistencia.

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-013-01 | Kickoff, threat model, and scope correction | `STORY-013-01-kickoff-threat-model-and-scope-correction.md` | `in-review` | `TBD` | Replantea la iniciativa y endurece los criterios de aprobacion |
| STORY-013-02 | Installability shell and capability-aware opt-in UX | `STORY-013-02-installability-shell-and-capability-aware-opt-in-ux.md` | `draft` | `TBD` | Manifest, icons, standalone UX, iOS fallback, sin cache agresivo |
| STORY-013-03 | Secure subscription contract and persistence model | `STORY-013-03-secure-subscription-contract-and-persistence-model.md` | `draft` | `TBD` | Multiple subscriptions per wallet/device with lifecycle metadata |
| STORY-013-04 | Delivery pipeline, pruning, and transactional sends | `STORY-013-04-delivery-pipeline-pruning-and-transactional-sends.md` | `draft` | `TBD` | Prioriza envios de sistema, no marketing |
| STORY-013-05 | Admin campaigns, segmentation, and abuse controls | `STORY-013-05-admin-campaigns-segmentation-and-abuse-controls.md` | `draft` | `TBD` | Solo despues de guardrails, auditoria y caps operativos |
| STORY-013-06 | QA, rollout, observability, and kill-switch | `STORY-013-06-qa-rollout-observability-and-kill-switch.md` | `draft` | `TBD` | E2E, responsive, MCP evidence, docs sync, rollback |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-05-09 | STORY-013-01 | El EPIC se redefine como canal consentido y auditable de eventos de alto valor, no como herramienta de spam generalista | jaymusicmachine | `STORY-013-01-kickoff-threat-model-and-scope-correction.md` |
| 2026-05-09 | STORY-013-01 | La descomposicion por plataforma (`Android primero`, `iOS despues`) se reemplaza por una descomposicion por riesgo y responsabilidad | jaymusicmachine | `STORY-013-01-kickoff-threat-model-and-scope-correction.md` |
| 2026-05-09 | STORY-013-03 | `PushSubscription` no puede modelarse como una sola fila por usuario; el contrato debe soportar multiples endpoints por wallet/dispositivo | jaymusicmachine | `STORY-013-03-secure-subscription-contract-and-persistence-model.md` |
| 2026-05-09 | STORY-013-04 | El envio masivo no puede depender de una sola request HTTP recorriendo todo el universo de suscripciones | jaymusicmachine | `STORY-013-04-delivery-pipeline-pruning-and-transactional-sends.md` |
| 2026-05-09 | STORY-013-05 | El broadcast admin queda bloqueado hasta tener preview, dry-run, rate limits, audience caps y trazabilidad | jaymusicmachine | `STORY-013-05-admin-campaigns-segmentation-and-abuse-controls.md` |
| 2026-05-11 | STORY-013-03 | El modelado de suscripciones debe alinearse al baseline hibrido de auth y al nuevo gate de migraciones `validate:db` | jaymusicmachine | `STORY-013-03-secure-subscription-contract-and-persistence-model.md` |

## Risks and Dependencies
- Risks:
  - El plan original subestima riesgo de abuso del canal: un panel de envio sin auditoria, limites ni aprobacion es una fuente directa de spam y de erosion de confianza.
  - iOS no permite tratar Web Push como si fuera igual a Android/desktop: requiere instalacion en Home Screen y permiso desde interaccion directa del usuario.
  - `next-pwa` puede introducir complejidad innecesaria si el objetivo inicial es push y no offline caching; mezclar autenticacion, cache y service worker demasiado pronto es receta para bugs de consistencia.
  - La segmentacion propuesta usa atributos (`actividad`) que hoy no tienen un modelo operativo claro en el repo.
  - El loop sincronico para enviar a todos los usuarios es fragil frente a timeouts, duplicados y fallos parciales.
- Dependencies:
  - Next.js App Router actual del repo.
  - Modelo de sesion hibrido actual (`WorkOS` account session + `SIWS` wallet session).
  - Postgres/Neon via `pg`.
  - Infra de Vercel para funciones, cron y/o queues.
  - Capacidad de agregar secretos VAPID y feature flags.
- Mitigations:
  - Mantener el primer release centrado en notificaciones transaccionales.
  - Introducir cola o batching durable antes de broadcast admin.
  - Diseñar el schema como entidad por endpoint/dispositivo y resolver ownership desde la sesion hibrida del servidor, no desde payload cliente.
  - Agregar logs de campaña/entrega, kill-switch y audience caps.
  - Pasar cualquier historia con migraciones por `validate:db` y por el nuevo guard de migraciones del repo.
  - Tratar service worker como capa minima de push, no como proyecto offline total.

## Open Questions
- [ ] El objetivo real es transaccional (`KYC`, `reward`, `checkout`, `mint`, `admin review`) o marketing (`novedades`, `recordatorios`, `promociones`)? Mezclar ambas cosas desde el inicio es un error.
- [ ] Las suscripciones deben exigir wallet step-up (`siws_session`) o permitiremos opt-in desde sesion de cuenta WorkOS sin wallet?
- [ ] Queremos depender de `Vercel Queues` beta o preferimos una estrategia propia de lotes/cron para el primer rollout?
- [ ] Que clases de payload quedan prohibidas por sensibilidad de negocio o compliance?
- [ ] Que metrica define exito: install rate, opt-in rate, delivery success, CTR, retorno a flujo critico?

## Traceability
- Issue(s): `TBD`
- PR(s): `TBD`
- Final commit hash(es): `TBD`
