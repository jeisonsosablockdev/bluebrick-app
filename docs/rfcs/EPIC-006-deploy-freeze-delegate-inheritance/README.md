# EPIC-006-deploy-freeze-delegate-inheritance

## Metadata
- Epic ID: `EPIC-006`
- Title: `Deploy Module Update: Permanent Delegates + Economic AppData`
- Status: `approved` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-03-28`
- Last Updated: `2026-03-29`

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
| STORY-006-01 | Deploy + Mint with Permanent Freeze Delegate Plugin | `STORY-006-01-deploy-and-mint-permanent-freeze-delegate-plugin.md` | `in-review` | `TBD` | Política freeze persistente |
| STORY-006-02 | Deploy + Mint with Permanent Transfer Delegate Plugin | `STORY-006-02-deploy-and-mint-permanent-transfer-delegate-plugin.md` | `in-review` | `TBD` | Diseño de recovery robustecido |
| STORY-006-03 | NFT Economic Data via AppData Plugin | `STORY-006-03-nft-economic-data-appdata-plugin.md` | `in-review` | `TBD` | Esquema JSON v1 y observabilidad |
| STORY-006-04 | On-chain Delegate Rotation/Revocation | `STORY-006-04-onchain-delegate-rotation-revocation.md` | `draft` | `TBD` | Lifecycle de autoridades críticas |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-03-28 | STORY-006-01 | RFC base creada para freeze delegate permanente | jaymusicmachine | `STORY-006-01-deploy-and-mint-permanent-freeze-delegate-plugin.md` |
| 2026-03-28 | STORY-006-02 | RFC base creada para transfer delegate y wallet recovery | jaymusicmachine | `STORY-006-02-deploy-and-mint-permanent-transfer-delegate-plugin.md` |
| 2026-03-28 | STORY-006-03 | RFC base creada para AppData económico | jaymusicmachine | `STORY-006-03-nft-economic-data-appdata-plugin.md` |
| 2026-03-29 | EPIC-006 | Review de seguridad emite `rejected`; se exige rediseño de recovery offline y plan de rotación/revocación on-chain | jaymusicmachine | `README.md` |
| 2026-03-29 | EPIC-006 | Aprobado por Staff Engineer tras robustecer el protocolo de recovery (EPIC-007) y añadir plan de rotación de autoridades (STORY-006-04). | staff-engineer | `README.md` |

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

## Traceability
- Issue(s): `TBD`
- PR(s): `TBD`
- Final commit hash(es): `TBD`
