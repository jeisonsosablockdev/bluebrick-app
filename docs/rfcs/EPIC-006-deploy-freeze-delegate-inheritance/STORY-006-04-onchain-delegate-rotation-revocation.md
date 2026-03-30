# STORY-006-04-onchain-delegate-rotation-revocation

## Metadata
- Epic: `EPIC-006-deploy-freeze-delegate-inheritance`
- Story ID: `STORY-006-04-onchain-delegate-rotation-revocation`
- Status: `approved` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-03-29`
- Last Updated: `2026-03-29`

## Context
- Problem:
  No existe diseño técnico cerrado para rotar/revocar autoridades críticas (`Permanent Transfer Delegate`, `AppData authority`) sin comprometer continuidad operativa.
- Why now:
  La crítica de seguridad exige eliminar dependencia de delegados permanentes sin lifecycle.
- Constraints:
  - Rotación/revocación solo por Squads multisig.
  - Devnet only para validación inicial.
  - Sin cambios UI de usuario final.

## Proposal
- Approach summary:
  Implementar un lifecycle on-chain auditable para autoridades de delegates multisig.
- Technical design:
  1. Introducir un registro de autoridad versionado por rol (`transfer_delegate`, `appdata_authority`).
  2. Operaciones permitidas:
     - `rotate(role, new_authority)`
     - `revoke(role)`
     - `emergency_rotate(role, new_authority)`
  3. Cada operación debe:
     - requerir aprobación de Squads multisig,
     - emitir evento de auditoría,
     - actualizar `authority_version` monotónica.
  4. Definir cadena de confianza:
     - Quién puede proponer rotación.
     - Quién puede aprobar.
     - Quién puede ejecutar.
  5. Definir políticas de seguridad:
     - cooldown para rotaciones no críticas,
     - bypass de cooldown en emergencia con umbral multisig superior.

## Critique
- Reviewer(s):
  - `Blockchain review (TBD)`
  - `Security review (TBD)`
- Critical findings:
1. Debe evitarse ventana de autoridad nula durante rotación.
2. Debe protegerse contra rotaciones maliciosas por compromiso parcial de firmas.
3. Debe quedar claro el comportamiento de assets en tránsito durante rotación.
- Blocking concerns:
  Sin esta historia aprobada, no debe aprobarse implementación final de recovery ni de escritura AppData sensible.

## Resolution
- Final approach after critique:
  Pendiente.
- Changes accepted:
  - Lifecycle versionado y auditable.
  - Multisig como único mecanismo de mutación de autoridad.
- Changes rejected (with rationale):
  - Rotación ad-hoc manual sin control on-chain: rechazada por riesgo operativo.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-29`
- Decision owner: `staff-engineer`
- Approval notes:
  Aprobado. El diseño propuesto es un excelente punto de partida para mitigar el riesgo de claves perpetuas.

## Status
- Current status: `approved`
- Next action:
  Ready for implementation.
- Exit criteria:
- [ ] Operaciones de rotate/revoke definidas
- [ ] Chain of trust documentada
- [ ] Pruebas de fallback/emergencia definidas
- [ ] Validación devnet con evidencia

## Test and Validation Plan
- Unit tests:
  - Validación de transiciones de `authority_version`.
  - Rechazo de operaciones sin quorum multisig.
  - Reglas de cooldown/emergency.
- Integration tests:
  - Rotación exitosa por rol con persistencia de estado.
  - Revocación + re-asignación.
  - Emergency rotate con umbral aumentado.
- Devnet validation:
  - Ejecución real de rotaciones/revocaciones y verificación on-chain.
  - Evidencia de signatures multisig y reconciliación backend.

## Traceability
- Related issue(s): `TBD`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
