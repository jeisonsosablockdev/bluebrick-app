# STORY-013-02-installability-shell-and-capability-aware-opt-in-ux

## Metadata
- Epic: `EPIC-013-pwa-installability-and-web-push-notifications`
- Story ID: `STORY-013-02-installability-shell-and-capability-aware-opt-in-ux`
- Status: `draft` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-05-09`
- Last Updated: `2026-05-11`

## Context
- Problem:
  BRIDS no expone manifest ni una UX coherente para instalacion/standalone. Tampoco comunica claramente cuando push es soportado, cuando no, o cuando el usuario debe instalar primero la app.
- Why now:
  Sin shell instalable y sin feature detection seria imposible tener una UX clara de opt-in a push.
- Constraints:
  - iOS Web Push depende de Home Screen install y accion directa del usuario.
  - No se debe introducir cache offline agresivo en rutas autenticadas como efecto colateral.
  - La UX debe distinguir entre usuario con sesion de cuenta, usuario con wallet step-up y usuario anonimo.
  - Debe mantenerse UX responsive y sin prompts invasivos.
- Affected paths:
  - `app/layout.tsx`
  - `public/manifest.json`
  - `public/*icons*`
  - componentes de perfil o settings

## Proposal
- Approach summary:
  Implementar manifest, iconos y metadata PWA, junto con una UX de capability detection que explique el camino correcto segun plataforma y estado (`browser`, `standalone`, `permission`, `unsupported`).
- Technical design:
  - Agregar manifest con `display: standalone` y `id` estable.
  - Declarar iconos estandar y `apple-touch-icon`.
  - Extender metadata de Next.js sin introducir side effects en cache.
  - Crear `InstallPrompt` y `NotificationCapabilityCard` con feature detection y copy especifico por estado.
  - Si el producto decide que ciertas notificaciones son wallet-bound, la UI debe pedir wallet step-up antes del opt-in final en esos casos.
  - Registrar service worker minimo, sin cache de navegacion como objetivo inicial.
- Alternatives considered:
  - Meter `next-pwa` desde el principio.
    - Rechazado por ahora: el release 1 necesita push, no una estrategia offline ambiciosa.
- Tradeoffs:
  - Menos “magia” automatizada al inicio.
  - Mas control y menos superficie accidental.

## Critique
- Reviewer(s):
  - `Build Web Apps`
  - `security-auditor`
- Critical findings:
1. Un `InstallPrompt` por si solo no resuelve nada si aparece antes de que el usuario entienda el valor del canal.
2. Mezclar instalacion y permiso en un mismo CTA seria un error UX. Son decisiones distintas y, en iOS, incluso ocurren en momentos distintos.
3. Si el service worker empieza a cachear respuestas autenticadas demasiado pronto, puedes crear bugs de sesion, stale UI y confusion dificil de depurar.
- Blocking concerns:
  - Aprobar solo con service worker minimo y con UX basada en capacidad real, no browser sniffing fragil.

## Resolution
- Final approach after critique:
  Story orientado a installability + capability UX, sin offline caching complejo y sin prompt en frio.
- Changes accepted:
  - UX especifica por estado de soporte.
  - Metadata PWA minima pero correcta.
- Changes rejected (with rationale):
  - Rechazado tratar esta historia como si ya entregara valor de negocio por si sola.

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-05-09`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Requiere copy de valor y feature detection clara antes de implementarse.

## Status
- Current status: `draft`
- Next action:
  Definir estados UX exactos y contrato de registro del service worker minimo.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - helpers de feature detection y state mapping.
- Integration tests:
  - render por estado soportado/no soportado.
- Devnet validation (if applicable):
  - No aplica.
- Responsive QA (if applicable):
  - Validar 320px, 375px, 768px y 1024px.

## Traceability
- Related issue(s): `TBD`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
