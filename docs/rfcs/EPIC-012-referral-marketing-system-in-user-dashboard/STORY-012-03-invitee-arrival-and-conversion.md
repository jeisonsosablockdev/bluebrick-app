# STORY-012-03-invitee-arrival-and-conversion

## Metadata
- Epic: `EPIC-012-referral-marketing-system-in-user-dashboard`
- Story ID: `STORY-012-03-invitee-arrival-and-conversion`
- Status: `draft` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-05-02`
- Last Updated: `2026-05-02`

## Context
- Problem:
  La persona invitada necesita una llegada fluida donde el sistema reconozca silenciosamente el referral sin obligarla a completar todo el registro de inmediato.
- Why now:
  Si el handshake de entrada falla, la atribución completa se rompe antes de llegar al backend y el programa pierde credibilidad.
- Constraints:
  - La captura del parámetro referral debe ser silenciosa, determinista y resistente a navegación posterior.
  - La bienvenida debe ser sutil y no invasiva.
  - El flujo debe funcionar en mobile wallet browsers y deep linking.
- Affected paths:
  - páginas de entrada/landing
  - `app/...` con query params `?ref=...`
  - estado global de app / auth bootstrap
  - comportamiento mobile wallet browser

## Proposal
- Approach summary:
  Implementar el handshake del invitado desde la URL hasta el estado global de la aplicación y acompañarlo con una bienvenida contextual.
- Technical design:
  - **Sub-story 3.1 (Handshake):** capturar `?ref=wallet_address` y guardarlo silenciosamente en el estado global.
  - **Sub-story 3.2 (UI/UX de Bienvenida):** banner o mensaje sutil del tipo: `Has sido invitado por [Wallet_Address]. Conecta tu wallet para comenzar`.
  - **Sub-story 3.3 (Web3 Bridge):** compatibilidad de enlace con navegadores integrados de wallets en mobile.
  - Este handshake debe dejar listo el valor para la persistencia/reforwarding de Story 1 y el mapping backend de Story 4.
- Alternatives considered:
  - No mostrar mensaje de bienvenida.
  - Resolver compatibilidad mobile más tarde.
  - Guardar el referral solo después del sign-in.
- Tradeoffs:
  - Guardar temprano mejora robustez, pero obliga a definir limpieza/expiración.
  - Mostrar banner mejora claridad, pero puede introducir ruido si se diseña mal.

## Critique
- Reviewer(s):
  - `pending`
- Critical findings:
1. Definir dónde vive el estado global del referral entre rutas y reloads.
2. Validar el fallback cuando el parámetro referral es inválido o expiró.
3. Confirmar la estrategia de deep linking para mobile wallet browsers.
- Blocking concerns:
  - Falta definir el contrato entre el handshake frontend y la persistencia real de atribución.

## Resolution
- Final approach after critique:
  Pendiente de cerrar el contrato de estado global y la estrategia mobile wallet browser.
- Changes accepted:
  - Captura silenciosa del referral.
  - Bienvenida contextual.
  - Compatibilidad mobile wallet.
- Changes rejected (with rationale):
  - Captura tardía solo al sign-in, porque debilita la atribución diferida.

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-05-02`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Pendiente de validar la estrategia cross-device / mobile wallet browser.

## Status
- Current status: `draft` (`draft | in-review | approved | implemented | rejected`)
- Next action:
  Aprobar el handshake URL -> state -> persistence y el comportamiento de bienvenida mobile.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Parseo y saneamiento del parámetro `ref`.
- Integration tests:
  - El valor referral sobrevive navegación y llega al punto de registro/sign-in.
  - El banner se muestra solo cuando existe referral válido.
- Devnet validation (if applicable):
  - N/A
- Responsive QA (if applicable):
  - Validación explícita en mobile wallet browser y breakpoints `320`, `375`, `768`, `1024`.

## Traceability
- Related issue(s): `BRI-16`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
