# STORY-006-04-onchain-delegate-rotation-revocation

## Metadata
- Epic: `EPIC-006-deploy-freeze-delegate-inheritance`
- Story ID: `STORY-006-04-onchain-delegate-rotation-revocation`
- Status: `implemented` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-03-29`
- Last Updated: `2026-04-01`

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
  Se implementa lifecycle backend-admin con persistencia de estado/versionado, validación de quorum regular/emergencia, cooldown y auditoría de operación (`prepared`/`submitted`) por colección y rol.
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
- Current status: `implemented`
- Next action:
  Cerrar commit final de historia y abrir PR a `develop` con evidencia devnet enlazada.
- Exit criteria:
- [x] Operaciones de rotate/revoke definidas
- [x] Chain of trust documentada
- [x] Pruebas de fallback/emergencia definidas
- [x] Validación devnet con evidencia

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

## Devnet Evidence (2026-04-01)
- RPC: `https://solana-devnet.g.alchemy.com/v2/0yIenKKNLWTTAWxKRcUvB`
- Collection (proof-only): `DZ7sRMPFCPm5SFeEAc7JN8LQPRtcfi1JFor4QuWRvR1F`
- Transaction signatures:
  - Create collection: `3mHGgtnoDyzzS89fGEpaKgY6oWPEruniRffBn6VkbfADU5L6i7YyTVj3ArHbKBZBsWKp5ZPrfYiFGpCGxsBHwxxi`
  - `emergency_rotate` (`appdata_authority`): `DWJkjKQeaeXUXAJdXHmWtZjmsHdqmRcTyGRSHZ5wWyA7Aa1EnNZMwq3kWMmYebfQE8BQxQzZZz2e6QbBcZWcsXg`
  - Temporary authority funding tx: `5gKJwVDA7Z81p95uY2fW5rQWjKx3oazoSYMzXPqkZXqDB5Y3Xwiq7Xq8QJSxw3ux9Qvw8noLutaVzYqvbuRZHDNF`
  - `rotate` restore (`appdata_authority`): `38enfrc4UXg3s7WEBzoeAsx29tRChFmuVZhvWGGEibnbs7k6Nw1tERv8imma9iDgh4idFEe7xJcN4SznFDzsDBy`
- Backend audit evidence (`authority_audit_events`):
  - `ccedf55f-7f75-4088-8e81-7faaf2220da1` (`emergency_rotate`) status `submitted`
  - `817d5ef3-10a0-4c87-b1f5-21052a7232b4` (`rotate`) status `submitted`
- Registry final state (`authority_registry`):
  - role `appdata_authority`
  - authority `3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd`
  - `authority_version = 3`
- Full evidence: `docs/devnet-proof.md` section `EPIC-006 STORY-006-04 Proof (On-chain Authority Lifecycle)`.

## Traceability
- Related issue(s): `EPIC-006 / STORY-006-04`
- Related PR(s): `nft/program-delegate-rotation-revocation` (pending open PR to `develop`)
- Final commit hash(es): `TBD`
