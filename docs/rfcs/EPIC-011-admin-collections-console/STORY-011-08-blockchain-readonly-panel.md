# STORY-011-08-blockchain-readonly-panel

## Metadata
- Epic: `EPIC-011-admin-collections-console`
- Story ID: `STORY-011-08-blockchain-readonly-panel`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-17`
- Last Updated: `2026-04-17`

## Context
- Problem:
  El editor de collections necesita exponer información blockchain útil para el admin, pero esa capa es de lectura y no debe mezclarse con la persistencia editable off-chain.
- Why now:
  Producto quiere que el admin vea claramente qué authorities controlan la candy machine/collection y qué datos relevantes del plugin económico ya existen on-chain.
- Constraints:
  - Solo lectura.
  - No editar authorities ni plugin data desde `/admin/collections`.
  - Reusar fuentes existentes (`asset_mint_snapshots`, `authority_registry`, estado on-chain/plugin).
  - Direcciones copiables y con salida a explorer/Solscan.
- Affected paths:
  - `app/api/admin/collections/[id]/route.ts`
  - `lib/core-candy-machine-snapshot-repository.ts`
  - `lib/*authority*`
  - `components/admin/*`

## Proposal
- Approach summary:
  Construir un panel read-only dentro del detalle de collection que muestre addresses, authorities, guard fields y payload económico AppData relevantes para el admin.
- Technical design:
  - Fuentes de datos propuestas:
    - `marketplace_entries`
    - `asset_mint_snapshots.blockchain_snapshot`
    - `authority_registry`
    - lectura/plugin data ya persistida o derivada del estado on-chain
  - Campos visibles v1:
    - `collection_address`
    - `candy_machine_address`
    - `asset_mint_address`
    - `third_party_signer`
    - `freeze_delegate`
    - `transfer_delegate`
    - `appdata_authority`
  - Guard fields visibles si existen:
    - `startDate`
    - `tokenPayment.mint`
    - `tokenPayment.destination`
  - AppData plugin fields visibles:
    - `revenue_share_bps`
    - `yield_bps`
    - `yield_mode`
    - `locked_at`
    - `eligible_from`
    - `earning_start_ts`
    - `distribution_enabled`
    - `economic_version`
    - `last_updated_at`
    - `updated_by`
  - UX:
    - copy icon por dirección
    - link a explorer/Solscan por address
    - layout de lectura, sin affordances de edición
- Alternatives considered:
  - Mezclar esta información dentro de `STORY-011-06` sin separación conceptual.
    - Rechazado: combina excesivamente concerns de UI editable con lectura blockchain.
- Tradeoffs:
  - Más stories, pero responsabilidades mucho más claras entre edición off-chain y lectura on-chain.

## Critique
- Reviewer(s):
  - `TBD`
- Critical findings:
1. Falta confirmar si `asset_mint_address` siempre existe para todas las entries a mostrar.
2. Falta definir fallback cuando `authority_registry` no tenga filas para una collection.
3. Falta confirmar si la lectura AppData vendrá desde snapshot, helper backend o fetch on-demand.
- Blocking concerns:
  - No producir implementación sin definir la estrategia de lectura AppData.

## Resolution
- Final approach after critique:
  Aprobado. La lectura de AppData se resolverá mediante helpers backend ya existentes en el ecosistema, no con edición.
- Changes accepted:
  - Panel blockchain separado y read-only.
  - Authorities copiables con link externo.
  - AppData visible sin edición.
- Changes rejected (with rationale):
  - Rechazado exponer controles de mutación blockchain desde collections.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-17`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Se aprueba la composición de información on-chain de forma read-only segura.

## Status
- Current status: `approved`
- Next action:
  Implementar agregadores y helpers de UI read-only.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Suggested Implementation Slices
- Slice A:
  agregación backend de addresses base
- Slice B:
  agregación de authorities
- Slice C:
  agregación de guard fields
- Slice D:
  agregación de AppData/plugin fields
- Slice E:
  UI read-only del panel blockchain
- Slice F:
  copy/link interactions y tests

## Test and Validation Plan
- Unit tests:
  - Mapeo correcto de authorities y plugin fields.
  - Fallback correcto cuando falten campos opcionales.
- Integration tests:
  - API detail devuelve blockchain panel read-only.
  - Direcciones incluyen metadata suficiente para copy/link UX.
- Devnet validation (if applicable):
  - Verificación de lecturas contra una collection real en devnet.
- Responsive QA (if applicable):
  - Panel usable en 320, 375, 768, 1024.

## Traceability
- Related issue(s): `TBD`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
