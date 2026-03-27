# EPIC-002-core-candy-machine-mint-module

## Metadata
- Epic ID: `EPIC-002`
- Title: `Core Candy Machine Mint Module`
- Status: `implemented`
- Owner: `jaymusicmachine`
- Created: `2026-03-16`
- Last Updated: `2026-03-27`

## Scope
- Problem statement:
  El flujo actual de `/admin/assets/new` no cierra el ciclo de mint en un solo módulo visual continuo, y falta una definición RFC clara para mint real en devnet con Metaplex Core Candy Machine.
- Business goal:
  Permitir que un admin complete mint end-to-end (desde datos pre-cargados hasta NFTs minteados) con cobro simbólico mínimo para validar funcionalidad.
- Technical goal:
  Implementar módulo de mint usando **Core Candy Machine** (no Candy Machine v3), con guards mínimos `startDate + solPayment`, ejecución real en devnet, persistencia mínima de job y reconciliación on-chain.
- Out of scope:
  - Marketplace listing.
  - Tesorería avanzada/distribuciones.
  - Recovery avanzado multi-escenario.
  - Analytics/comercial extras.
  - Batch mint como requisito funcional obligatorio de cierre.

## Success Criteria
- [x] Desde `Create Asset` se completa un mint end-to-end en **devnet** dentro del mismo flujo visual.
- [x] Se valida mint real en cantidad operativa definida por producto (sin exigir batch mint para cierre).
- [x] Se registran tx signatures confirmadas y estado final reconciliado con RPC/DAS.
- [x] Guard mínimo aplicado: `startDate + solPayment(0.00001 SOL)`; cobro simbólico validado.

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-002-01 | Technical Decision: Core Candy Machine | `STORY-002-01-technical-decision.md` | `implemented` | `#17, #19` | Decisión base ejecutada en implementación de flujo mint admin |
| STORY-002-02 | Continuous UI Flow: Create Asset -> Continue to Mint | `STORY-002-02-create-asset-to-mint-flow.md` | `implemented` | `#28, #41` | Paso 2 inline en `/admin/assets/new` con prefill y validación visual |
| STORY-002-03 | Deploy Core Candy Machine | `STORY-002-03-deploy-core-candy-machine.md` | `implemented` | `#19, #41` | Deploy Core CM + guards mínimos + carga de items en devnet |
| STORY-002-04 | Mint Execution and Progress | `STORY-002-04-mint-execution-and-progress.md` | `implemented` | `#22, #24` | Ejecución mint/progreso/reconciliación cerrada sin batch mint obligatorio |
| STORY-002-05 | On-chain Reconciliation and Minimal Job Persistence | `STORY-002-05-onchain-reconciliation-and-job-persistence.md` | `implemented` | `#17, #22, #24` | Persistencia relacional mínima + reconciliación RPC/DAS |
| STORY-002-06 | Mint Snapshot Persistence + Create Asset Gate | `STORY-002-06-mint-snapshot-persistence-and-create-asset-gate.md` | `implemented` | `#40` | Snapshot final + gate `Create Asset` con verificación DAS (`getAssetsByGroup`) |


## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-03-16 | STORY-002-01 | Aprobado uso de Core Candy Machine (no v3) con plugins | jaymusicmachine | `STORY-002-01-technical-decision.md` |
| 2026-03-16 | STORY-002-02 | Flujo continuo inline implementado en `/admin/assets/new` | jaymusicmachine | `STORY-002-02-create-asset-to-mint-flow.md` |
| 2026-03-16 | STORY-002-03 | Implementado prepare/submit deploy Core Candy Machine con guards mínimos y load de items | jaymusicmachine | `STORY-002-03-deploy-core-candy-machine.md` |
| 2026-03-16 | STORY-002-04 | Implementado mint por lotes con progreso y firmas en UI (Core Candy Machine) | jaymusicmachine | `STORY-002-04-mint-execution-and-progress.md` |
| 2026-03-16 | STORY-002-05 | Persistencia snapshot relacional integrada en rutas de orquestador | jaymusicmachine | `STORY-002-05-onchain-reconciliation-and-job-persistence.md` |
| 2026-03-18 | STORY-002-06 | Propuesta RFC para persistencia completa de snapshot (form + on-chain) y gate `Create Asset` post-verificación | jaymusicmachine | `STORY-002-06-mint-snapshot-persistence-and-create-asset-gate.md` |
| 2026-03-18 | STORY-002-06 | Refinamiento técnico incorporado: FK+UNIQUE con `mint_jobs`, política strict para `partial`, error estructurado y verificación DAS principal | jaymusicmachine | `STORY-002-06-mint-snapshot-persistence-and-create-asset-gate.md` |
| 2026-03-18 | STORY-002-06 | RFC aprobado para implementación en rama stacked | jaymusicmachine | `STORY-002-06-mint-snapshot-persistence-and-create-asset-gate.md` |
| 2026-03-18 | STORY-002-06 | Implementado snapshot final persistente + verificación DAS/fallback + gate `Create Asset` en `/admin/assets/new` | jaymusicmachine | `STORY-002-06-mint-snapshot-persistence-and-create-asset-gate.md` |
| 2026-03-27 | EPIC-002 | Decisión de producto: batch mint deja de ser requisito de cierre; epic se cierra con mint operativo en devnet + reconciliación | jaymusicmachine | `README.md` |

## Risks and Dependencies
- Risks:
  - Costo/tiempo de minteo puede crecer si se intenta escalar cantidad en una sola corrida.
  - Fallos RPC intermitentes en devnet durante deploy/mint/reconciliación.
  - Desalineación entre estado UI y estado real on-chain si no hay reconciliación robusta.
- Dependencies:
  - Wallet Phantom conectada y firmando transacciones reales.
  - RPC devnet estable.
  - Metaplex Core Candy Machine program disponible en devnet.
- Mitigations:
  - Persistencia mínima de job + reintentos acotados por etapa.
  - Confirmación explícita de tx y verificación de estado final on-chain.
  - Progreso transaccional visible por etapas con fallos explícitos.

## Open Questions
- [x] ¿Cantidad máxima permitida por ejecución inicial para no degradar UX en browser wallet?
- [x] ¿La carga de items se hará en batchs fijos o variable por capacidad RPC/compute budget?
- [x] ¿Formato final de persistencia mínima de job (`table` única vs `json` state store)?

## Traceability
- Issue(s): `EPIC-002`
- PR(s): `#17`, `#19`, `#22`, `#24`, `#28`, `#40`, `#41`
- Final commit hash(es): `TBD` (consolidar hash final de cierre en próximo corte de release)

---

## Architectural Review & Guidance (Gemini)

This epic is well-structured and addresses the critical path for enabling on-chain functionality. The breakdown into discrete stories is logical. The decision to use **Core Candy Machine** is sound and aligns with the future of the Metaplex standard.

The following points constitute the official architectural guidance for the implementation of this epic. All child stories must adhere to these principles.

### 1. Authority Model: Server-Side Authority is Mandatory
- **Principle**: The client (browser) is a hostile environment and cannot be trusted.
- **Implementation**: The backend server is the **sole authority** for determining *if* a mint can proceed and for constructing the transactions.
- **Flow**:
    1. Client requests to mint `N` items for a given `jobId`.
    2. Server validates the user's session, permissions (RBAC), and business logic (e.g., are there items left?).
    3. Server constructs the mint transaction(s) for the user.
    4. Server sends the serialized, unsigned transaction(s) to the client.
    5. Client wallet prompts the user to sign.
    6. Client sends the signed transaction back to the server.
    7. Server verifies the transaction and submits it to the chain.
- **Rationale**: This prevents any client-side manipulation of mint parameters (e.g., price, destination wallet, etc.).

### 2. Job Persistence: Relational Model for Atomicity
- **Decision**: The open question regarding the persistence format is resolved. A relational model with at least two tables is required.
    - `mint_jobs`: Stores the overall state of the mint operation (`id`, `status`, `candy_machine_id`, `requested_quantity`, `success_count`, `failure_count`).
    - `mint_job_items`: Stores the status of each individual mint (`id`, `job_id`, `item_index`, `status`, `mint_address`, `tx_signature`, `error_message`).
- **Rationale**: A single JSON blob is not suitable for tracking the status of thousands of individual mints. A relational structure allows for atomic updates, easier querying for partial failures, and better reporting/reconciliation.

### 3. Reliability: Batching, Throttling, and Idempotency
- **Item Loading (`STORY-002-03`)**: Loading items into the Candy Machine must be done in batches to respect Solana's transaction size limits. The server-side orchestrator must manage this, tracking which batches succeed or fail.
- **Mint Execution (`STORY-002-04`)**: Minting must be throttled to avoid RPC rate limits. A server-side queue (e.g., using QStash, BullMQ) or a client-side library with concurrency control (e.g., `p-limit`) is mandatory. The server-side approach is preferred for greater control.
- **Idempotency**: All state-changing API endpoints (`deploy`, `mint`) must be idempotent. The client should generate a UUID (`idempotencyKey`) for each logical operation. The server must use this key to prevent re-processing the same request.

### 4. Stack Alignment: Use DAS for Reconciliation
- **Decision**: For `STORY-002-05`, the primary reconciliation method should not be iterating through transaction signatures.
- **Implementation**: Use a Digital Asset Standard (DAS) API (e.g., Helius) and the `getAssetsByGroup` method, using the collection's mint address as the grouping key.
- **Rationale**: This is vastly more efficient and reliable than confirming N individual signatures. It provides the definitive on-chain state of what was minted into the collection, simplifying the reconciliation logic and reducing RPC load. Checking signatures should be a secondary fallback or debugging tool.
