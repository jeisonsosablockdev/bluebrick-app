---
type: RFC
title: STORY- 013 01 Kickoff Threat Model And Scope Correction
description: STORY- 013 01 Kickoff Threat Model And Scope Correction - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-013-pwa-installability-and-web-push-notifications/STORY-013-01-kickoff-threat-model-and-scope-correction.md
---

# STORY-013-01-kickoff-threat-model-and-scope-correction

## Metadata
- Epic: `EPIC-013-pwa-installability-and-web-push-notifications`
- Story ID: `STORY-013-01-kickoff-threat-model-and-scope-correction`
- Status: `in-review` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-05-09`
- Last Updated: `2026-05-11`

## Context
- Problem:
  La propuesta inicial mezcla tres iniciativas distintas como si fueran una sola: instalabilidad PWA, delivery infra para Web Push y una herramienta de marketing/admin broadcast. Eso produce un plan atractivo en slides pero debil como sistema.
- Why now:
  Si el equipo implementa este EPIC en el orden original, va a quemar tiempo en manifest, iconos y prompts antes de fijar el contrato de consentimiento, autorizacion, almacenamiento y operacion. Ese orden crea deuda muy rapido.
- Constraints:
  - Repo con baseline de auth hibrido (`WorkOS` account session + `SIWS` wallet session) y roles server-side ya establecidos.
  - Frontend en Next.js App Router.
  - Backend en funciones Vercel + Postgres.
  - Las historias con cambios de schema/persistencia ahora pasan por `validate:db`.
  - Gobernanza del repo obliga Playwright, responsive QA, docs canonicamente actualizados y no confiar en estado cliente.
- Affected paths:
  - `app/*`
  - `lib/*`
  - `db/migrations/*`
  - `docs/auth-flow.md`
  - `docs/session-model.md`

## Proposal
- Approach summary:
  Replantear el EPIC como una iniciativa de mensajeria de alta confianza, en la que el canal push se habilita primero para eventos transaccionales y solo mas tarde, y de forma restringida, para campañas admin.
- Technical design:
  - Separar el trabajo por riesgo:
    1. contrato y threat model,
    2. shell instalable y UX de capacidad,
    3. persistencia segura de suscripciones,
    4. envio transaccional y pruning,
    5. broadcast admin con control de abuso,
    6. rollout y observabilidad.
  - Mantener el service worker minimo para push y notification click handling.
  - Posponer cualquier cache offline compleja.
  - Exigir consentimiento explicito y opt-in contextual, no prompt en frio.
  - Resolver desde el inicio si la suscripcion vive a nivel `account_id`, `wallet_public_key`, o ambos, segun la semantica real de cada tipo de notificacion.
- Alternatives considered:
  - Mantener las fases originales.
    - Rechazado: optimiza lo visible y posterga lo dificil, justo donde mas puede romperse el sistema.
  - Lanzar solo manifest/installability sin push.
    - Rechazado como objetivo de negocio principal: instalabilidad sin re-engagement util no paga el costo operativo.
- Tradeoffs:
  - El plan corregido se ve menos “rápido” al inicio.
  - A cambio reduce deuda, baja superficie de abuso y produce una base reutilizable.

## Critique
- Reviewer(s):
  - `security-auditor`
  - `Build Web Apps`
- Critical findings:
1. La historia de valor esta mal definida. “Notificaciones para anunciar novedades” no es un caso de uso suficiente; es exactamente el tipo de uso que degrada confianza y empuja al usuario a bloquear permisos.
2. El corte por plataforma es pobre. Android vs iOS es un detalle de compatibilidad, no una unidad de negocio ni de arquitectura. Cortar asi el EPIC produce historias cosmeticas sin cerrar riesgos.
3. `PushSubscription` ligada a `UserId` es demasiado simplista para este repo. Un wallet puede tener varios dispositivos, varios browsers y varias instalaciones. Un unico registro por usuario garantiza sobrescrituras, inconsistencia y targeting incorrecto.
4. `/api/notifications/send` como endpoint generico es un mal nombre y una mala frontera. Mezcla autorizacion, targeting y delivery en una sola superficie peligrosa.
5. El panel admin planteado es una herramienta de abuso si se implementa pronto. Sin preview, limites, clasificacion de mensajes, audit log e idempotencia, es una máquina de spam con UI bonita.
6. El consejo de “usa `next-pwa` para que te gestione el ciclo” es prematuro. Aqui el riesgo real no es versionar `sw.js`; es no romper auth, cache, UI y permisos con una capa offline innecesaria.
7. La segmentacion propuesta es en parte ficticia. `country` existe en perfil, pero `role` es solo `admin|user` via allowlist de wallets y `activity` no aparece como modelo operativo estable. Hablar de segmentacion quirurgica sin fuente de verdad es humo.
8. El loop “SELECT * y mandar uno por uno” dentro de una API route es diseño frágil, no plataforma de notificaciones. Si la request cae a mitad, no tienes una historia clara de reintento, dedupe ni auditoria.
9. El baseline de auth ya no es solo wallet-first. Si el EPIC no decide explicitamente que se puede hacer con sesion de cuenta y que exige step-up de wallet, va a mezclar autoridades y terminar enviando mensajes desde una semantica de identidad inconsistente.
- Blocking concerns:
  - No aprobar implementacion mientras no exista una decision explicita sobre:
    - canal transaccional vs marketing,
    - contrato de consentimiento,
    - `account_id` vs `wallet_public_key` como ownership real de la suscripcion,
    - modelo multi-dispositivo,
    - estrategia de delivery asincrono,
    - limites operativos del admin sender.

## Resolution
- Final approach after critique:
  El EPIC queda en `in-review` y se aprueba solo si su primer release se limita a casos transaccionales o de cuenta de alto valor, con el broadcast admin como fase posterior condicionada.
- Changes accepted:
  - Reordenar el EPIC por riesgo y responsabilidad.
  - Forzar modelado multi-endpoint por wallet/dispositivo.
  - Tratar installability como parte del shell, no como historia “fundacional” autosuficiente.
  - Introducir restriccion explicita sobre payloads sensibles y sobre targeting sin fuente de verdad.
- Changes rejected (with rationale):
  - Rechazado lanzar el panel de broadcast en el mismo primer bloque que manifest/service worker.
  - Rechazado asumir `next-pwa` como dependencia inicial obligatoria.

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-05-09`
- Decision owner: `jaymusicmachine`
- Approval notes:
  El story se considera aprobado solo cuando la iniciativa se redefina formalmente como canal de eventos de alto valor y no como herramienta de marketing abierta.

## Status
- Current status: `in-review`
- Next action:
  Aprobar o ajustar el replanteamiento del EPIC y fijar el alcance del primer release.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - N/A en esta fase documental.
- Integration tests:
  - N/A en esta fase documental.
- Devnet validation (if applicable):
  - No aplica.
- Responsive QA (if applicable):
  - No aplica en esta fase; se exige en `STORY-013-06`.

## Traceability
- Related issue(s): `TBD`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
