# STORY-012-01-access-to-rewards-and-sharing

## Metadata
- Epic: `EPIC-012-referral-marketing-system-in-user-dashboard`
- Story ID: `STORY-012-01-access-to-rewards-and-sharing`
- Status: `draft` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-05-02`
- Last Updated: `2026-05-02`

## Context
- Problem:
  El usuario referente no tiene hoy un punto claro dentro del producto para compartir su link, entender su beneficio potencial ni confiar en que la atribución seguirá viva si el invitado no conecta su wallet de inmediato.
- Why now:
  Este es el entry point del programa de referidos. Sin un centro de mando usable y sin persistencia de atribución, el resto del sistema no convierte bien ni genera confianza.
- Constraints:
  - La atribución no puede depender solo de una sesión efímera.
  - La persistencia debe convivir con privacidad, consentimiento y una ventana máxima explícita.
  - La experiencia de share debe ser simple en web y consistente con metadata social.
- Affected paths:
  - `app/(dashboard)/...`
  - `app/api/...`
  - `lib/referrals/...`
  - metadata de páginas shareables / invite landing

## Proposal
- Approach summary:
  Construir el centro de mando inicial del referente y resolver el share loop completo con persistencia de atribución por 30 días.
- Technical design:
  - **Sub-story 1.1 (UX):** interfaz con bloque principal de referido, botón de `Copiar Enlace` y disparador de correo integrado.
  - **Sub-story 1.2 (Marketing Logic):** persistencias de sesión (`cookie` + `localStorage`) para recordar al referente por 30 días si el invitado entra por el link pero conecta su wallet después.
  - **Sub-story 1.3 (Social Graph):** metadatos dinámicos para previews en Twitter / Discord / Telegram con CTA y branding del programa.
  - El frontend debe emitir un único contrato de invitación reutilizable por dashboard, landing y flujos mobile.
- Alternatives considered:
  - Persistencia solo en `localStorage`.
  - Link simple sin disparador de correo.
  - Metadata estática igual para todos los links.
- Tradeoffs:
  - `cookie + localStorage` aumenta robustez, pero obliga a definir reconciliación y expiración clara.
  - El disparador de correo agrega fricción técnica, pero mejora difusión nativa.
  - Metadata dinámica mejora conversión social, pero exige más superficie de pruebas.

## Critique
- Reviewer(s):
  - `pending`
- Critical findings:
1. Verificar que la persistencia de 30 días no contradiga políticas de consentimiento y retención.
2. Definir si el disparador de correo usa cliente nativo, mailto o servicio propio.
3. Asegurar que el preview dinámico no exponga datos sensibles del referente.
- Blocking concerns:
  - Falta definir el contrato exacto entre la captura del link y el evento posterior de wallet sign-in.

## Resolution
- Final approach after critique:
  Pendiente de revisión formal del contrato de atribución persistente y del mecanismo de share por correo.
- Changes accepted:
  - Persistencia de atribución por 30 días.
  - Centro de mando explícito para share.
  - Metadata social dinámica.
- Changes rejected (with rationale):
  - Persistencia puramente efímera, porque rompe atribución diferida.

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-05-02`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Pendiente de aprobación junto con el contrato backend de atribución única.

## Status
- Current status: `draft` (`draft | in-review | approved | implemented | rejected`)
- Next action:
  Validar el contrato de persistencia/referral link y aprobar el shape de metadata social.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - TTL y expiración de persistencia de 30 días.
  - Construcción del link de share y payload de metadata.
- Integration tests:
  - Atribución conservada cuando el invitado vuelve después de varias sesiones.
  - Copiar enlace y disparador de correo generan el target correcto.
- Devnet validation (if applicable):
  - N/A
- Responsive QA (if applicable):
  - Estado del centro de mando en `320`, `375`, `768`, `1024`.

## Traceability
- Related issue(s): `BRI-16`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
