# EPIC-012-referral-marketing-system-in-user-dashboard

## Metadata
- Epic ID: `EPIC-012`
- Title: `Referral Marketing System In User Dashboard`
- Status: `draft`
- Owner: `jaymusicmachine`
- Created: `2026-05-02`
- Last Updated: `2026-05-02`

## Scope
- Problem statement:
  El producto no tiene hoy un sistema de referidos dentro del dashboard del usuario que conecte adquisición, atribución, elegibilidad y visibilidad de recompensas en un solo flujo auditable. Eso impide activar campañas orgánicas con trazabilidad real y deja huecos en la experiencia del invitado, la retención del referente y la validación backend de recompensas.
- Business goal:
  Aumentar adquisición y reinversión a través de referidos, con una experiencia clara para quien invita y para quien llega invitado, sin comprometer KYC, compliance ni controles antifraude.
- Technical goal:
  Definir un RFC ejecutable para un sistema de referidos que cubra:
  1. captura y persistencia de atribución,
  2. consola de usuario para compartir y seguir progreso,
  3. reconocimiento automático del invitado,
  4. validación backend y entrega de datos de recompensas.
- Out of scope:
  - payouts financieros reales fuera del cálculo y estado de recompensa,
  - programas multinivel,
  - campañas CRM externas no iniciadas desde el dashboard,
  - recompensas para usuarios sin KYC o sin evento elegible confirmado.

## Success Criteria
- [ ] El RFC define un flujo end-to-end de atribución desde el link compartido hasta la visualización de recompensa.
- [ ] Las 4 historias cubren entrada, seguimiento, conversión y backend sin solapamientos ambiguos.
- [ ] La elegibilidad de recompensa queda explícitamente bloqueada por KYC + primer evento elegible.
- [ ] El epic deja trazabilidad suficiente para dividir implementación posterior en slices pequeños.

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-012-01 | Access to rewards and sharing | `STORY-012-01-access-to-rewards-and-sharing.md` | `draft` | `TBD` | Centro de mando, sharing y persistencia de atribución |
| STORY-012-02 | Tracking dashboard and retention | `STORY-012-02-tracking-dashboard-and-retention.md` | `draft` | `TBD` | Estados, notificaciones y gamificación |
| STORY-012-03 | Invitee arrival and conversion | `STORY-012-03-invitee-arrival-and-conversion.md` | `draft` | `TBD` | Captura del referido, bienvenida y compatibilidad mobile wallet |
| STORY-012-04 | Attribution validation and reward execution | `STORY-012-04-attribution-validation-and-reward-execution.md` | `draft` | `TBD` | Mapping de wallets, anti-duplicidad y payload de recompensas |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-05-02 | STORY-012-01..04 | El epic se divide en 4 historias: acceso/difusión, dashboard/retención, experiencia del invitado y backend de validación | jaymusicmachine | `README.md` |
| 2026-05-02 | STORY-012-01 / STORY-012-03 | La atribución debe persistir hasta 30 días entre entrada por link y registro efectivo del invitado | jaymusicmachine | `STORY-012-01-access-to-rewards-and-sharing.md` |
| 2026-05-02 | STORY-012-04 | No puede existir recompensa aprobada sin KYC y primer evento elegible confirmado | jaymusicmachine | `STORY-012-04-attribution-validation-and-reward-execution.md` |

## Risks and Dependencies
- Risks:
  - Atribución incorrecta si el handshake frontend y la persistencia de sesión no convergen en un único contrato.
  - Riesgo de fraude si una wallet ya registrada puede volver a atribuirse.
  - Desalineación entre estado UI y cálculo backend de elegibilidad/recompensas.
  - Riesgo de fricción mobile si el enlace no funciona en navegadores integrados de wallets.
- Dependencies:
  - Sistema actual de autenticación y wallet sign-in.
  - PostgreSQL como fuente interna de verdad para mapping y eventos.
  - Infraestructura existente de notificaciones internas y metadata web cuando aplique.
- Mitigations:
  - Persistencia de atribución con TTL explícito y reconciliación server-side.
  - Regla de atribución única por wallet referida.
  - Payload backend único para reward status consumido por dashboard.
  - Validación explícita de compatibilidad en mobile wallet browsers.

## Open Questions
- [ ] ¿La recompensa del MVP será fija, escalonada o dependiente del tipo de acción elegible?
- [ ] ¿El indicador de notificación interna se resuelve en el mismo sistema actual o requiere un store dedicado?
- [ ] ¿El mensaje de bienvenida mostrará la wallet completa, truncada o un alias derivado?

## Traceability
- Issue(s): `BRI-16`
- PR(s): `TBD`
- Final commit hash(es): `TBD`
