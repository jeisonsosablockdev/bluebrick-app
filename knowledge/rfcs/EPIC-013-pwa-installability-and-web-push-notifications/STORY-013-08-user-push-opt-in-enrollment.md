---
type: RFC
title: STORY- 013 08 User Push Opt In Enrollment
description: STORY- 013 08 User Push Opt In Enrollment - migrated from knowledge/
tags: [rfcs]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-013-pwa-installability-and-web-push-notifications/STORY-013-08-user-push-opt-in-enrollment.md
---

# STORY-013-08-user-push-opt-in-enrollment

## Metadata
- Epic: `EPIC-013-pwa-installability-and-web-push-notifications`
- Story ID: `STORY-013-08-user-push-opt-in-enrollment`
- Status: `in-review` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-05-13`
- Last Updated: `2026-05-13`

## Context
- Problem:
  El epic ya tiene shell instalable, persistencia de suscripciones, delivery y panel admin, pero todavia no tiene el momento critico de consentimiento real del usuario. Hoy “tener BRIDS en el telefono” no garantiza nada: sin permiso browser y sin `pushManager.subscribe()`, no existe endpoint al cual enviar.
- Why now:
  Sin este story, el panel admin puede parecer listo mientras la audiencia real sigue en cero o queda limitada a suscripciones creadas manualmente.
- Constraints:
  - En iOS el opt-in solo es valido desde una Home Screen web app y desde interaccion directa del usuario.
  - No se debe tratar instalacion como consentimiento implicito.
  - El ownership de la suscripcion sigue siendo server-owned y wallet-bound.
  - El flujo debe convivir con el service worker minimo ya aprobado y no introducir caching de auth.
- Affected paths:
  - `components/pwa/*`
  - `app/api/notifications/subscriptions/*`
  - `lib/pwa/*`
  - `knowledge/features/feature-shared-pwa-web-push-bri-157.md`

## Proposal
- Approach summary:
  Agregar un CTA real de “Activar notificaciones” desde superficies protegidas con wallet, pedir permiso browser por tap directo, registrar el endpoint en PushManager y persistirlo contra el backend wallet-bound.
- Technical design:
  - Extender la card PWA para distinguir entre:
    - instalado pero no suscrito
    - suscrito en este dispositivo
    - bloqueado por browser
    - iOS aun no instalado en Home Screen
  - Crear un bootstrap route server-side que entregue:
    - `WEB_PUSH_VAPID_PUBLIC_KEY`
    - lista de suscripciones activas del wallet autenticado
  - Registrar o reusar el service worker existente antes de llamar `pushManager.subscribe()`.
  - Persistir el resultado en `POST /api/notifications/subscriptions`.
  - Permitir baja del dispositivo actual con `DELETE /api/notifications/subscriptions`.
  - Mantener el consentimiento ligado al dispositivo y al wallet real, no al simple hecho de abrir una tab.
- Alternatives considered:
  - Exponer el VAPID public key como `NEXT_PUBLIC_*`.
    - Rechazado por ahora: ya existe el secreto server-side y el bootstrap route evita introducir una segunda fuente de configuracion.
  - Pedir permiso automaticamente al abrir la pantalla.
    - Rechazado: rompe reglas de plataforma y degrada UX.
- Tradeoffs:
  - Un paso mas para el usuario.
  - Mucha mas claridad entre install shell, permission grant y enrollment persistido.

## Critique
- Reviewer(s):
  - `security-auditor`
  - `clean-code`
- Critical findings:
1. “App instalada” y “push habilitado” son estados distintos; si la UI los mezcla, el producto promete algo falso.
2. Pedir permiso sin dejar claro el valor del canal o sin contexto de wallet produce rechazo y baja tasa de opt-in.
3. Si el alta no puede revocarse desde la misma superficie, el consentimiento queda incompleto desde el punto de vista operativo.
- Blocking concerns:
  - Aprobar solo con CTA directo, revocacion local y persistencia wallet-bound del endpoint.

## Resolution
- Final approach after critique:
  El opt-in queda separado explicitamente del shell instalable y del panel admin. Instalar habilita el entorno; el consentimiento lo cierra un CTA directo en perfil protegido.
- Changes accepted:
  - Bootstrap route para VAPID + estado de suscripciones.
  - Enrollment y revoke del dispositivo actual desde la card PWA.
  - Copy explicito que separa instalacion y consentimiento.
- Changes rejected (with rationale):
  - Rechazado asumir que Home Screen install o manifest valido equivalen a permiso push.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-05-13`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Este story es obligatorio para que el canal push deje de ser solo una capacidad de backend y pase a ser una funcionalidad real de producto.

## Status
- Current status: `in-review`
- Next action:
  Implementar la slice `S08`, validarla en perfil protegido y mergearla a integracion.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - serializacion de suscripcion y flujo de enrollment client-side.
- Integration tests:
  - bootstrap route
  - enable/disable enrollment
  - mismatch entre app instalada y suscripcion ausente
- Devnet validation (if applicable):
  - No aplica.
- Responsive QA (if applicable):
  - `/protected/perfil` en 320px, 375px, 768px y 1024px con evidencia Playwright.

## Traceability
- Related issue(s): `BRI-157`
- Related PR(s): `pending`
- Final commit hash(es): `TBD`
