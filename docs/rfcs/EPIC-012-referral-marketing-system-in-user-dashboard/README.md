# EPIC-012-referral-marketing-system-in-user-dashboard

## Metadata
- Epic ID: `EPIC-012`
- Title: `Referral Marketing System In User Dashboard`
- Status: `approved`
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
| STORY-012-01 | Access to rewards and sharing | `STORY-012-01-access-to-rewards-and-sharing.md` | `approved` | `TBD` | Centro de mando, sharing y persistencia de atribución |
| STORY-012-02 | Tracking dashboard and retention | `STORY-012-02-tracking-dashboard-and-retention.md` | `approved` | `TBD` | Estados, notificaciones y gamificación |
| STORY-012-03 | Invitee arrival and conversion | `STORY-012-03-invitee-arrival-and-conversion.md` | `approved` | `TBD` | Captura del referido, bienvenida y compatibilidad mobile wallet |
| STORY-012-04 | Attribution validation and reward execution | `STORY-012-04-attribution-validation-and-reward-execution.md` | `approved` | `TBD` | Mapping de wallets, anti-duplicidad y payload de recompensas |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-05-02 | STORY-012-01..04 | El epic se divide en 4 historias: acceso/difusión, dashboard/retención, experiencia del invitado y backend de validación | jaymusicmachine | `README.md` |
| 2026-05-02 | STORY-012-01 / STORY-012-03 | La atribución debe persistir hasta 30 días entre entrada por link y registro efectivo del invitado | jaymusicmachine | `STORY-012-01-access-to-rewards-and-sharing.md` |
| 2026-05-02 | STORY-012-04 | No puede existir recompensa aprobada sin KYC y primer evento elegible confirmado | jaymusicmachine | `STORY-012-04-attribution-validation-and-reward-execution.md` |
| 2026-05-02 | STORY-012-01..04 | RFC Aprobado. DB Modelado ajustado con mitigaciones anti-Sybil, Wash Trading y estados zombie. | jaymusicmachine | `db/migrations/018_referral_system_schema.sql` |

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

## Critique (Staff Engineer Review)
- **3 Critical Weaknesses**:
  1. **Vectores de Ataque Sybil y Auto-Referidos**: En Web3 crear nuevas wallets es gratis e instantáneo. La regla de "atribución única por wallet referida" no evita que un usuario se refiera a sí mismo creando decenas de wallets nuevas. El sistema debe mitigar esto imponiendo requisitos económicos al evento elegible (e.g., volumen mínimo invertido) y limitando el pago de recompensas si se detecta un patrón de IPs o dispositivos sospechosos.
  2. **Pérdida de Atribución Cross-Device (Mobile a Desktop)**: Muchos usuarios de cripto descubren enlaces en aplicaciones móviles (ej. Twitter, Telegram), pero completan el registro en su computadora de escritorio usando una hardware wallet o extensión (ej. Phantom). La atribución por cookies o local storage se perderá en el cambio de dispositivo. Se debe contemplar un código de referido manual opcional como *fallback*, o aceptar y documentar esta pérdida como un *tradeoff* del MVP.
  3. **Ciclo de Vida de la Recompensa y Rollbacks**: ¿Qué ocurre si el "primer evento elegible" (ej. una compra fraccionada) se cancela, falla en la blockchain o se reembolsa posteriormente por soporte? La máquina de estados de la recompensa (`Reward`) necesita estados transaccionales como `pending_settlement`, `locked` o `clawback` antes de marcarse como definitiva para evitar repartir recompensas sobre conversiones fantasmas.

- **Execution Risks**:
  - **Privacidad de Usuarios (GDPR/Compliance)**: Mostrar alias o wallets en la "visibilidad de recompensas" del dashboard del referente puede exponer información de terceros (relacionando wallets con identidades KYC de forma indirecta). La ofuscación (ej. `3e89...d0f1`) debe ser obligatoria desde la consulta a base de datos.
  - **Condiciones de Carrera (Race Conditions)**: Si se emiten múltiples eventos concurrentes del invitado intentando confirmar su "evento elegible", el backend podría procesar el pago de recompensa por duplicado. Requiere *locking* pesimista `FOR UPDATE` en la tabla de atribuciones al hacer el claim.

- **Stack Alignment**:
  - Correcto enfoque de usar PostgreSQL como fuente de verdad. Se requiere una restricción estricta `UNIQUE (invitee_wallet_address)` en la base de datos para garantizar la consistencia en la atribución.
  - Se debe utilizar un modelo dirigido por eventos (event-driven) para consolidar las recompensas basado en los webhooks o logs de auditoría ya definidos en otros epics, desacoplando el frontend de la lógica de adjudicación.

- **Mandatory Tests**:
  1. **Prueba Anti-Sybil / Doble Registro**: Intentar registrar la misma wallet bajo dos referentes distintos de manera concurrente. Solo una (o ninguna, según la regla) debe prevalecer.
  2. **Prueba de Idempotencia de Recompensa**: Simular el envío del "evento elegible" dos veces para el mismo invitado y asegurar que la recompensa se otorga estrictamente una vez.
  3. **Prueba de Atribución Caducada**: Forzar un `timestamp` superior al TTL de 30 días en el handshake inicial y verificar que el referido se descarta.

- **Verdict**: `approved`

## Open Questions
- [ ] ¿La recompensa del MVP será fija, escalonada o dependiente del tipo de acción elegible?
- [ ] ¿El indicador de notificación interna se resuelve en el mismo sistema actual o requiere un store dedicado?
- [ ] ¿El mensaje de bienvenida mostrará la wallet completa, truncada o un alias derivado?

## Traceability
- Issue(s): `BRI-16`
- PR(s): `TBD`
- Final commit hash(es): `TBD`
