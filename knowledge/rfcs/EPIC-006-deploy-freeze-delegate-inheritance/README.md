# EPIC-006-deploy-freeze-delegate-inheritance

## Metadata
- Epic ID: `EPIC-006`
- Title: `Deploy Module Update: Permanent Delegates + Economic AppData`
- Status: `implemented` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-03-28`
- Last Updated: `2026-04-02`

## Scope
- Problem statement:
  El módulo de deploy/mint necesita una política explícita de delegados permanentes (freeze/transfer) y una fuente económica on-chain por NFT (`AppData`) para distribución auditable.
- Business goal:
  Fortalecer control operativo post-mint, habilitar wallet recovery y estandarizar datos económicos del NFT sin cambios de UI.
- Technical goal:
  Usar Metaplex Core Plugins para `Permanent Freeze Delegate`, `Permanent Transfer Delegate` y `AppData` con modelo de autoridad diferenciado por operación.
- Out of scope:
  - Cambios visuales en interfaz gráfica.
  - Migración retroactiva de todos los NFTs históricos.

## Implementation Gate
- Estado de gate multisig: `satisfecho` para firma de operaciones sensibles.
- Gate de seguridad recovery: `pendiente hardening`.
- Condición obligatoria previa a implementación:
  - Protocolo offline de recuperación (KYC/documentación legal/notarial + registro de evidencia + flujo de disputas).
  - Ruta on-chain de rotación/revocación para autoridades que sí dependen de multisig (transfer delegate y appData authority).

## Authority Matrix (Normativa)
- Freeze/Unfreeze del NFT:
  - Autoridad operativa: `Permanent Freeze Delegate`.
  - Multisig Squads: `obligatorio`.
- Wallet recovery / transfer delegado:
  - Autoridad operativa: `Permanent Transfer Delegate`.
  - Multisig Squads: `obligatorio`.
- Escritura de AppData económico:
  - Autoridad operativa: `AppData authority`.
  - Multisig Squads: `obligatorio`.

## Security Review Verdict
- Veredicto actual: `approved` (2026-03-29).
- Motivos:
  - Riesgos mitigados a través de un protocolo de recuperación robusto (`EPIC-007`) y una historia dedicada para el ciclo de vida de autoridades (`STORY-006-04`).
- Acción requerida:
  - Ninguna. El EPIC está aprobado para implementación.

## Success Criteria
- [x] Freeze/unfreeze persiste por `Permanent Freeze Delegate` sin depender del owner actual.
  - Nota: freeze/unfreeze se ejecuta por `Permanent Freeze Delegate` con aprobación multisig.
- [x] `Permanent Transfer Delegate` soporta wallet recovery controlado bajo protocolo offline documental y proceso de disputas (definido en `EPIC-007`).
- [x] El flujo de recovery incluye `unfreeze` operativo posterior a la transferencia hacia la nueva wallet (ejecutado vía multisig sobre `Permanent Freeze Delegate`).
- [x] `AppData` funciona como fuente de verdad económica (`v1`) por NFT, con esquema versionado.
- [x] Existe ruta on-chain de rotación/revocación para delegates permanentes gobernada por Squads multisig (definida en `STORY-006-04`).
- [x] Validación devnet con transacciones reales y evidencia on-chain.
- [x] Observabilidad de eventos críticos (`freeze`, `transfer`) vía Helius Webhooks.

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-006-01 | Deploy + Mint with Permanent Freeze Delegate Plugin | `STORY-006-01-deploy-and-mint-permanent-freeze-delegate-plugin.md` | `implemented` | `#81` (integración); `#67/#85` cerrados | Freeze delegate permanente en deploy/mint; evidencia compartida con STORY-006-02 |
| STORY-006-02 | Deploy + Mint with Permanent Transfer Delegate Plugin | `STORY-006-02-deploy-and-mint-permanent-transfer-delegate-plugin.md` | `implemented` | `#81` | Transfer delegate permanente + prueba devnet |
| STORY-006-03 | NFT Economic Data via AppData Plugin | `STORY-006-03-nft-economic-data-appdata-plugin.md` | `implemented` | `#82` | Esquema JSON v1 + pruebas y evidencia devnet |
| STORY-006-04 | On-chain Delegate Rotation/Revocation | `STORY-006-04-onchain-delegate-rotation-revocation.md` | `implemented` | `#86` | Lifecycle de autoridades críticas + evidencia devnet Alchemy |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-03-28 | STORY-006-01 | RFC base creada para freeze delegate permanente | jaymusicmachine | `STORY-006-01-deploy-and-mint-permanent-freeze-delegate-plugin.md` |
| 2026-03-28 | STORY-006-02 | RFC base creada para transfer delegate y wallet recovery | jaymusicmachine | `STORY-006-02-deploy-and-mint-permanent-transfer-delegate-plugin.md` |
| 2026-03-28 | STORY-006-03 | RFC base creada para AppData económico | jaymusicmachine | `STORY-006-03-nft-economic-data-appdata-plugin.md` |
| 2026-03-29 | EPIC-006 | Review de seguridad emite `rejected`; se exige rediseño de recovery offline y plan de rotación/revocación on-chain | jaymusicmachine | `README.md` |
| 2026-03-29 | EPIC-006 | Aprobado por Staff Engineer tras robustecer el protocolo de recovery (EPIC-007) y añadir plan de rotación de autoridades (STORY-006-04). | staff-engineer | `README.md` |
| 2026-04-01 | STORY-006-01/02 | Integración en `develop` de delegados permanentes para deploy/mint (`PermanentFreezeDelegate` + `PermanentTransferDelegate`) | jaymusicmachine | `PR #81` |
| 2026-04-01 | STORY-006-03 | Implementado `AppData v1` en mint flow con evidencia devnet de create/mint/add/write/update | jaymusicmachine | `STORY-006-03-nft-economic-data-appdata-plugin.md` |
| 2026-04-01 | STORY-006-04 | Implementado lifecycle de autoridad (`prepare/submit`) con evidencia devnet real en Alchemy (`emergency_rotate` + `rotate`), auditoría backend y reconciliación de registry | jaymusicmachine | `STORY-006-04-onchain-delegate-rotation-revocation.md` |
| 2026-04-02 | EPIC-006 | Auditoría final de cierre: commits/PRs/artefactos rastreados y documentación consolidada | jaymusicmachine | `FINAL-REVIEW-2026-04-02.md` |

## Risks and Dependencies
- Risks:
  - Ambigüedad semántica de campos económicos si no se cierra contrato (`yield_mode`, `versioning`).
  - Errores de autorización en updates económicos.
- Dependencies:
  - Metaplex Core Plugins.
  - Squads multisig operativo para operaciones sensibles de autoridad.
  - RPC devnet estable.
- Mitigations:
  - Validación de esquema estricta y versionada.
  - Reglas de autorización server-side + multisig.
  - Trazabilidad de cambios (`updated_by`, `last_updated_at`).

## Final Audit (2026-04-02)
| Story | Estado final | PR / Commit | Artefactos clave |
| --- | --- | --- | --- |
| STORY-006-01 | `implemented` (integrado) | PR `#81` / `3e893036692459219ad46853c63d0f1d1acc9e95` | `lib/core-candy-machine-admin.ts`, `tests/lib/core-candy-machine-admin-validation.test.ts`, `knowledge/nft-spec.md` |
| STORY-006-02 | `implemented` | PR `#81` / `3e893036692459219ad46853c63d0f1d1acc9e95` | `knowledge/features/feature-nft-permanent-transfer-delegate.md`, `lib/core-candy-machine-admin.ts`, `tests/lib/core-candy-machine-admin-validation.test.ts` |
| STORY-006-03 | `implemented` | PR `#82` / `d179106114aa614c860c96c9b067137e5f076210` | `knowledge/features/feature-nft-economic-appdata-plugin.md`, `knowledge/devnet-proof.md`, `lib/core-candy-machine-admin.ts`, `components/admin/core-candy-machine-panel.tsx` |
| STORY-006-04 | `implemented` | PR `#86` / `3943c72b001fb4d49c9f6306090deaf584112e9b` | `app/api/admin/core-candy-machine/authorities/*`, `lib/core-authority-lifecycle.ts`, `db/migrations/017_authority_lifecycle_registry.sql`, `knowledge/rotation-spec.md` |

## Traceability
- Issue(s): `EPIC-006` (seguimiento vía RFC)
- PR(s):
  - `#66` `feat(shared): EPIC-006 RFC approved + EPIC-007 recovery protocol`
  - `#68` `docs(rfc): approve epic-006 story statuses`
  - `#81` `feat(nft): add permanent transfer delegate support for core collection deploy`
  - `#82` `feat(shared): implement STORY-006-03 economic appdata plugin flow`
  - `#86` `feat(nft): authority lifecycle rotation/revocation + devnet evidence`
  - Historial no mergeado/supersedido: `#67`, `#85`
- Final commit hash(es):
  - `402e6296104712614454a40ee2b33be061accc6b` (PR #66)
  - `f707ea2300979d05ec0f649a183cdc894a919204` (PR #68)
  - `3e893036692459219ad46853c63d0f1d1acc9e95` (PR #81)
  - `d179106114aa614c860c96c9b067137e5f076210` (PR #82)
  - `3943c72b001fb4d49c9f6306090deaf584112e9b` (PR #86)
