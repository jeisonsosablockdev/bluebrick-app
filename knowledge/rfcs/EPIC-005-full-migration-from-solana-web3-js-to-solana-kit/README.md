# EPIC-005-full-migration-from-solana-web3-js-to-solana-kit

## Metadata
- Epic ID: `EPIC-005`
- Title: `Migracion total de @solana/web3.js a stack moderno (@solana/kit)`
- Status: `approved` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-04-02`
- Last Updated: `2026-04-02`

## Scope
- Problem statement:
  Existen usos directos e indirectos de `@solana/web3.js` en frontend, backend, servicios, utilidades, tests y E2E. Esto dificulta estandarizar el stack moderno, incrementa deuda tecnica y complica boundaries de compatibilidad.
- Business goal:
  Reducir riesgo operativo y deuda tecnica mediante un stack Solana unificado (`@solana/kit`) sin impacto visible para el usuario final.
- Technical goal:
  Ejecutar migracion total por fases controladas (modulo/flujo), manteniendo compatibilidad temporal solo en adapters con `@solana/web3-compat`, hasta llegar a cero referencias directas a `@solana/web3.js` en codigo de producto.
- Out of scope:
  - Cambios de UX o comportamiento funcional de negocio.
  - Cambios de reglas de seguridad/autoridad/firma.
  - Cambios de cluster o politica devnet-only.

## Success Criteria
- [x] Existe RFC decision-complete por historias para rollout 100%.
- [x] Inventario base inicial de referencias `@solana/web3.js` definido para seguimiento.
- [x] Politica de compatibilidad temporal documentada: `@solana/web3-compat` solo en adapters de borde.
- [x] Criterio final de cierre definido: cero referencias directas a `@solana/web3.js` en codigo de producto.
- [x] Gates de validacion y regresion establecidos para ejecucion de historias (`validate`, unit/integration, Playwright, Synpress, devnet).
- [x] Existe barrera automatica para prevenir nueva deuda: lint rule para bloquear nuevas importaciones directas de `@solana/web3.js`.
- [x] Existe recetario operativo de migracion en `knowledge/guides/solana-kit-migration-recipes.md`.

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-005-01 | Kickoff + inventario tecnico completo | `STORY-005-01-kickoff-and-inventory.md` | `approved` | `TBD` | Baseline de migracion y matriz de riesgo por capa |
| STORY-005-02 | Foundation: RPC/address/signers + compat adapters | `STORY-005-02-foundation-rpc-address-and-compat-adapters.md` | `approved` | `TBD` | Capa base de migracion y regla de boundary estricto |
| STORY-005-03 | Migracion de auth/firma/verificacion/anti-bot | `STORY-005-03-auth-signature-and-anti-bot-migration.md` | `approved` | `TBD` | Sin cambio de seguridad ni SIWS |
| STORY-005-04 | Migracion de pipelines transaccionales (purchase/admin) | `STORY-005-04-transaction-pipelines-purchase-and-admin-migration.md` | `approved` | `TBD` | Migracion de serializacion, envio y reconciliacion |
| STORY-005-05 | Cleanup final + remocion dependencia + regresion final | `STORY-005-05-cleanup-dependency-removal-and-final-regression.md` | `approved` | `TBD` | Cierre tecnico, evidencia devnet y gates finales |

## Inventory Baseline (2026-04-02)
Referencias directas detectadas en codigo de trabajo (`app/lib/components/tests/e2e`): **19 archivos**.

- `app/api/admin/mint-orchestrator/jobs/[jobId]/reconcile/route.ts`
- `components/admin/core-candy-machine-panel.tsx`
- `components/admin/metaplex-core-mint-panel.tsx`
- `components/marketplace/PurchaseCta.tsx`
- `e2e/helpers/siws-local-wallet.ts`
- `lib/auth.ts`
- `lib/candy-guard-payment-config.ts`
- `lib/core-authority-lifecycle.ts`
- `lib/core-candy-machine-admin.ts`
- `lib/core-candy-machine-snapshot-service.ts`
- `lib/metaplex-core-admin.ts`
- `lib/property-marketplace-server.ts`
- `lib/purchase-anti-bot.ts`
- `lib/purchase-service.ts`
- `lib/purchase-third-party-signer.ts`
- `lib/solana.ts`
- `tests/lib/auth.test.ts`
- `tests/lib/purchase-anti-bot.test.ts`
- `tests/lib/solana.test.ts`

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-04-02 | EPIC-005 | Se adopta estrategia incremental “extending features until achieved” para migracion total por historias | jaymusicmachine | `README.md` |
| 2026-04-02 | EPIC-005 | Se aprueba policy de compatibilidad temporal solo en adapters (`@solana/web3-compat`) | jaymusicmachine | `README.md` |
| 2026-04-02 | STORY-005-01 | Inventario + matriz de riesgo definidos como baseline obligatorio previo a cambios de codigo | jaymusicmachine | `STORY-005-01-kickoff-and-inventory.md` |
| 2026-04-02 | STORY-005-02 | Capa foundation y boundary de compatibilidad aprobados | jaymusicmachine | `STORY-005-02-foundation-rpc-address-and-compat-adapters.md` |
| 2026-04-02 | STORY-005-03 | Migracion de auth/firma aprobada sin alterar SIWS ni trust boundaries | jaymusicmachine | `STORY-005-03-auth-signature-and-anti-bot-migration.md` |
| 2026-04-02 | STORY-005-04 | Migracion de pipelines transaccionales aprobada con rollout por flujo critico | jaymusicmachine | `STORY-005-04-transaction-pipelines-purchase-and-admin-migration.md` |
| 2026-04-02 | STORY-005-05 | Cierre final aprobado con criterio de cero referencias directas y remocion de dependencia | jaymusicmachine | `STORY-005-05-cleanup-dependency-removal-and-final-regression.md` |
| 2026-04-02 | EPIC-005 | Se agrega hardening automatico por ESLint para bloquear nuevas importaciones directas de `@solana/web3.js` fuera del allowlist legacy | jaymusicmachine | `README.md` |
| 2026-04-02 | EPIC-005 | Se agrega recetario de migracion en `knowledge/guides/solana-kit-migration-recipes.md` para estandarizar patrones de implementacion | jaymusicmachine | `README.md` |

## Risks and Dependencies
- Risks:
  - Riesgo medio-alto de regresion en serializacion/transacciones/RPC durante migracion.
  - Riesgo medio en wallet signing y verificaciones si boundaries no son estrictos.
  - Riesgo de coexistencia prolongada de stacks si no hay cleanup disciplinado.
- Dependencies:
  - Alineacion de versiones objetivo de librerias Solana.
  - Baseline de pruebas de regresion funcional.
  - Secuencia de rollout por modulo/flujo definida en Story Index.
- Mitigations:
  - Rollout por historias con gates por capa.
  - Compatibilidad temporal solo en adapters.
  - Validacion continua de flujos criticos (`auth`, `firma/verificacion`, `mint/purchase`, RPC clave).
  - Criterio final objetivo con grep estricto y remocion de dependencia.

## Open Questions
- [x] Policy de compatibilidad temporal definida (`@solana/web3-compat` solo en adapters).
- [x] Secuencia de rollout total definida por historias (`STORY-005-01` a `STORY-005-05`).
- [x] Criterio de cierre y gates de validacion definidos.

## Traceability
- Issue(s): `EPIC-005`
- PR(s): `TBD`
- Final commit hash(es): `TBD`
