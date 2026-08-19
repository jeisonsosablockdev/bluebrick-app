---
type: SolutionArchitecture
title: EPIC-015 Decision-Complete Solution Architecture
description: Contrato canónico de arquitectura, autoridad, estados, persistencia, ejecución y verificación para Treasury Claims con Squads V4.
tags: [rfcs, solana, squads, treasury, architecture, security, devnet]
timestamp: 2026-07-26T14:00:00Z
---

# EPIC-015 — Arquitectura de Solución y Contrato de Implementación

## Estado y alcance de esta decisión

Este documento convierte los hallazgos de auditoría en la solución propuesta para EPIC-015. Es la fuente técnica para los subagentes. No autoriza escribir código hasta la aprobación humana explícita del diseño y la creación de la SPEC TDD correspondiente.

La solución elegida para las dispersiones masivas es un **programa `payout_settlement` con escrow PDA y Merkle proof enforcement on-chain**. Squads V4 no paga una leg por claim: una Vault Transaction aprobada por el comité inicializa, fondea y sella un `PayoutRun`. Después, cualquier cranker puede solicitar `settle_claim`, pero el programa sólo transfiere exactamente una leaf incluida en la raíz sellada. No se usará `SpendingLimit` para pagos de claims en este EPIC.

Esta es una decisión que reemplaza explícitamente la alternativa anterior de "Merkle root auditora" y el modelo de "Batch + una Vault Transaction por leg". Ambos son insuficientes frente a un agente de despacho malicioso: el primero no impone nada on-chain y el segundo entrega al executor un conjunto de transferencias que no se verifica por proof en el momento de liquidar.

## Justificación Arquitectónica y Análisis Comparativo de Alternativas (ADR)

### 1. Evaluación de Alternativas de Dispersión de Tesorería en Solana

| Criterio | Alternativa A: Sublotes Squads (20 legs/tx) | Alternativa B: Squads Spending Limits | Alternativa C (Seleccionada): **Squads + Anchor Merkle Settlement Program** |
| :--- | :--- | :--- | :--- |
| **Carga Operacional del Comité** | ❌ **Inviable a escala:** Requiere aprobar ~500 a 1,000 propuestas de lotes para 10,000–20,000 inversores. | ✅ 1 sola firma para fijar el límite periódico. | ✅ **Óptima (1 Firma):** El comité aprueba 1 única propuesta de setup para $N$ beneficiarios. |
| **Modelo de Confianza / Seguridad** | ⚠️ **Vulnerable:** Un worker off-chain podría ensamblar o alterar transferencias tras la aprobación general. | ❌ **Peligro Crítico:** La llave del worker tiene discreción total de transferir fondos a cualquier wallet arbitraria. | 🛡️ **Zero-Trust Criptográfico:** Los fondos van a una **Escrow PDA** y solo se liberan si la **Merkle Proof** valida la hoja sellada. |
| **Límites Físicos de Solana (MTU ~1232 bytes)** | ❌ Cada transferencia SPL Token añade ~150–200 bytes, saturando el límite de 1232 bytes por transacción. | ❌ Mismo cuello de botella de MTU en las transacciones del worker. | ✅ **Sin Límite de Escala:** Cada liquidación se procesa de forma individual o en minilotes concurrentes. |
| **Prevención de Doble Cobro / Replay** | ⚠️ Dependiente exclusivamente de locking y base de datos off-chain. | ⚠️ Dependiente de base de datos off-chain. | 🛡️ **Enforcement Nativo On-Chain:** Se crea un **`ClaimReceipt` PDA** único; Solana revierte ante cualquier colisión de cuenta. |
| **Rol y Autoridad del Cranker / Worker** | ⚠️ Requiere privilegios elevados de ejecución en Squads. | ⚠️ Requiere custodiar la clave privada del spending limit. | 🛡️ **Completamente Permissionless:** El cranker solo aporta gas; no puede alterar beneficiarios, montos ni robar fondos. |

### 2. Por qué los Contratos Anchor son Estrictamente Necesarios en el Alcance

1. **`programs/payout_settlement` (Liquidación Criptográfica y Custodia Escrow PDA):**
   - Squads v4 es un protocolo de gobernanza y tesorería multisig general, no un motor de validación de árboles de Merkle.
   - Permite que el comité apruebe atómicamente:
     1. La creación del `PayoutRun` con la `merkleRoot` inmutable.
     2. La transferencia del saldo total comprometido desde la Vault PDA al **Escrow PDA**.
     3. El sellado del run (`seal_run`).
   - El contrato garantiza matemáticamente que **ningún actor intermedio (worker, base de datos, hacker)** pueda desviar un solo centavo de la distribución aprobada.
   - La creación de la PDA `[b"receipt", run_pda, claim_id]` proporciona una barrera criptográfica irrevocable contra el doble gasto a nivel del runtime de Solana.

2. **`programs/project_config_notary` (PDA Notario On-Chain de Parámetros y Fechas):**
   - **Amenaza Mitigada:** Almacenar fechas críticas de cálculo de rendimientos (`project_start_at`, `project_end_at`) exclusivamente en Postgres permite que un atacante con acceso a la base de datos o mediante inyección SQL manipule los periodos y reclame rendimientos ilícitos.
   - **Garantía On-Chain:** La PDA Notario `[b"project_config", collection_address]` reside en Solana y su instrucción `update_project_dates` exige que `authority_vault` sea signer, que su clave coincida con la almacenada en el estado, y que la Vault PDA se re-derive contra el program ID de Squads v4 (`SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`). Como las PDAs carecen de clave privada, dicha firma solo puede originarse mediante **CPI desde la Vault PDA de Squads v4** cuando el comité vota y ejecuta la propuesta.
   - El motor de distribución (`distribution-engine.ts`) lee directamente del RPC de Solana mediante `@solana/kit`, degradando a Postgres al rol de caché informativo de solo lectura.

### 3. Base Canónica de Referencia de Código & Análisis Legal de Licencias por Contrato

Para el diseño e implementación de los dos contratos Anchor del monorepo, se definen formalmente sus bases canónicas de referencia y su marco de licenciamiento:

| Contrato Anchor en Monorepo | Base Canónica de Referencia | Licencia | Rol y Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **`programs/payout_settlement`** | **Helium Network (`helium-program-library / lazy-distributor` & `circuit-breaker`)** | **Apache-2.0** | 🏆 **Base Canónica:** Custodia en Escrow PDA, validación de Merkle Proofs y Freno de Emergencia (Circuit Breaker) para pausar corridas anómalas. |
| **`programs/project_config_notary`** | **Patrón idiomático de Anchor (`init` + `has_one` + PDA seeds)** — No es un repositorio independiente; es la combinación estándar de constraints del framework [`coral-xyz/anchor`](https://github.com/coral-xyz/anchor) documentada en [Account Constraints](https://www.anchor-lang.com/docs/references/account-constraints) y [PDA Accounts](https://solana.com/docs/core/pda/pda-accounts). | **MIT OR Apache-2.0** (licencia del framework Anchor) | 🏛️ **Patrón Idiomático:** Contrato de gobernanza atómico (~60 líneas Rust) para fechas inmutables con firma CPI de la Vault de Squads v4. No requiere circuit breaker ni dependencia externa más allá de `anchor-lang` y `anchor-spl`. |

#### 3.1 Desglose de Primitivas Técnicas de Helium Network (Commit Pinneado)

- **Repositorio Canónico Pinneado:** `https://github.com/helium/helium-program-library`
- **Release / Tag Pinneado:** `program-lazy-distributor-v0.3.8` (Anchor `0.31.1` / Rust 2021)
- **Manifests de Referencia:**
  - `programs/lazy-distributor/Cargo.toml`
  - `programs/circuit-breaker/Cargo.toml`

Dado que `lazy-distributor` es un distribuidor especializado para oráculos y compresión de NFTs de Helium, BRIDS **no importa la librería como caja negra**, sino que adopta de forma quirúrgica sus primitivas matemáticas y de seguridad mediante una **implementación Clean-Room bajo Apache-2.0 / MIT**:

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│              PRIMITIVAS ADOPTADAS VS. EXCLUIDAS DE HELIUM LAZY-DISTRIBUTOR            │
├───────────────────────────────────────────┬───────────────────────────────────────────┤
│ ✅ Primitivas EXACTAS Adoptadas           │ ❌ Componentes y Dependencias Excluidos   │
├───────────────────────────────────────────┼───────────────────────────────────────────┤
│ 1. Verificación de Merkle Proofs en Rust  │ 1. Red de Oráculos en Vivo (Oracle Signs) │
│    usando solana_program::keccak::hashv   │    -> Sustituido por Doble Attestation    │
│    para combinar hashes de hojas y nodos. │    Ed25519 con verificación en sysvar.    │
├───────────────────────────────────────────┼───────────────────────────────────────────┤
│ 2. Custodia de Tokens en Escrow PDA       │ 2. Compressed NFTs & Bubblegum            │
│    con transferencias SPL Token /         │    (spl-account-compression, mpl-bubblegum│
│    Token-2022 mediante CPI firmado por    │    -> BRIDS liquida hojas estándar        │
│    las seeds de la PDA del PayoutRun.     │    (claim_id, wallet, ata, amount, mint). │
├───────────────────────────────────────────┼───────────────────────────────────────────┤
│ 3. Recibo Único de Liquidación            │ 3. Ventanas de Recompensa Acumulativas    │
│    (ClaimReceipt PDA) para prevenir       │    -> BRIDS usa corridas cerradas (runId) │
│    atómicamente doble cobro y reentrancy. │    con total y hojas fijas inmutables.    │
├───────────────────────────────────────────┼───────────────────────────────────────────┤
│ 4. Patrón de Circuit Breaker              │ 4. Tokenomics de subDAOs (HNT/MOBILE/IOT) │
│    (Emergency Pause / Unpause) gobernado  │    -> BRIDS opera con USDC, SOL y tokens  │
│    por la Vault PDA de Squads v4.         │    configurados en TreasuryPolicy.        │
└───────────────────────────────────────────┴───────────────────────────────────────────┘
```

#### Comparativa Legal de Alternativas Abiertas (Merkle Distributors):

| Proyecto / Repositorio | Licencia | Evaluación Legal & Compatibilidad Comercial | Veredicto para BRIDS |
| :--- | :--- | :--- | :--- |
| **Helium Network (`lazy-distributor` & `circuit-breaker`)** | **Apache-2.0** | ✅ **Permisiva y Comercial:** Permite uso libre, comercial y desarrollo propietario sin copyleft ni exigencia de apertura de código backend. | 🏆 **BASE CANÓNICA SELECCIONADA** |
| **Goki Protocol (`merkle-distributor`)** | **AGPL-3.0** | ❌ **Copyleft Viral (Sección 13):** Obligaría por ley a publicar el código fuente completo del backend, APIs privadas y servicios de BRIDS a cualquier usuario que interactúe por red. | 🚫 **RECHAZADO (Prohibido por `license-policy.json`)** |
| **Saber HQ / Jito (`merkle-distributor`)** | **GPL-3.0** | ❌ **Copyleft Fuerte:** Prohibida en la política de licencias del monorepo por incompatibilidad con software comercial y SaaS. | 🚫 **RECHAZADO (Prohibido por `license-policy.json`)** |

> [!IMPORTANT]
> **Estrategia Clean-Room & Declaración de Estado de Auditoría:**
> - **Clasificación Formal:** Helium Network (`lazy-distributor` / `circuit-breaker`) se adopta estrictamente como **referencia open-source permisiva (Apache-2.0)**, **NO como contrato auditado** aplicable al alcance de BRIDS.
> - **Sin Prueba de Alcance de Auditoría Externa:** No existe un informe de auditoría independiente que cubra el commit específico de Helium en relación con la arquitectura de BRIDS, ni mucho menos el futuro código de `payout_settlement`.
> - **Requisitos Normativos para Calificar como "Auditado":** Para que un contrato sea catalogado como auditado en la gobernanza de BRIDS, se debe adjuntar el informe técnico formal que contenga:
>   1. **Firma / Auditor:** Entidad de seguridad independiente reconocida.
>   2. **Fecha & Commit Pinneado:** SHA exacto auditado.
>   3. **Alcance (Scope):** Lista exhaustiva de contratos e instrucciones evaluadas.
>   4. **Findings & Resolución:** Vulnerabilidades detectadas y prueba de fix.
>   5. **Matriz de Diferencias:** Desglose de cambios entre el código auditado y la implementación en producción.
> - **Garantía para BRIDS:** Tanto `programs/payout_settlement` como `programs/project_config_notary` son desarrollos clean-room bajo Apache-2.0 / MIT que deberán someterse a auditoría estricta previa a cualquier despliegue en Mainnet.

## Decisiones propuestas que requieren Human Design Approval

| Decisión | Propuesta | Motivo |
| --- | --- | --- |
| Mecanismo de pago | `payout_settlement` + escrow PDA; Squads crea, fondea y sella el run | El programa sólo libera una leaf incluida en la raíz aprobada y sólo una vez |
| Spending limit | Prohibido para payouts de claims | No preserva el umbral multisig por corrida ni un snapshot de beneficiarios |
| Merkle | Root, snapshot hash y reglas guardadas en `PayoutRun`; proof enforcement on-chain | Vincula criptográficamente cada pago a la corrida aprobada y bloquea doble pago |
| Multisig | `configAuthority = Pubkey::default()`, N-de-M configurable, vault index explícito | Evita una llave que pueda reconfigurar unilateralmente la tesorería |
| Cranker de settlement | Cuenta no privilegiada; puede presentar proof, nunca elegir una leaf válida | La autorización de fondos procede del escrow y de la raíz aprobada, no del cranker |
| Time lock | Configurable; valor inicial recomendado: 900 segundos | Permite cancelar o investigar una propuesta antes de mover tesorería |
| Fuente de verdad | Squads y `ProjectConfigPDA` on-chain; Postgres es proyección | Ninguna mutación HTTP/local declara un hecho on-chain |

No se fija N-de-M, integrantes ni vault index en código. Antes de SPEC de implementación debe existir un **Authority Manifest** revisado por el comité con: cluster, RPC HTTP/WSS, program ID, `multisigPda`, `createKey`, `vaultIndex`, `vaultPda`, N-de-M, miembros y permisos, time lock, mint, token program, signers de proposer/executor y política de rotación.

### Selección explícita del Squad

El sistema apunta al Squad mediante una configuración de entorno por cluster/proyecto; no lo descubre a partir del wallet del usuario, del `treasury_vault`, del `runId` ni del payout. La configuración mínima debe ser:

```text
SOLANA_CLUSTER=devnet
SOLANA_RPC_HTTP_URL=<endpoint-devnet>
SOLANA_RPC_WS_URL=<endpoint-devnet-wss>
SQUADS_V4_PROGRAM_ID=SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf
TREASURY_MULTISIG_PDA=<PDA-de-la-multisig-v4>
TREASURY_MULTISIG_CREATE_KEY=<createKey-usado-para-derivarla>
TREASURY_VAULT_INDEX=0
TREASURY_VAULT_PDA=<PDA-de-la-vault-correspondiente>
TREASURY_POLICY_PDA=<PDA-de-politica-de-tesoreria>
TREASURY_MINT=<mint-autorizado>
TREASURY_TOKEN_PROGRAM_ID=<Token-Program-o-Token-2022-segun-el-mint>
PAYOUT_ATTESTER_A_PUBKEY=<clave-publica-calculador>
PAYOUT_ATTESTER_B_PUBKEY=<clave-publica-verificador-independiente>
```

Reglas obligatorias de esa configuración:

1. Las variables anteriores son un **manifest de despliegue**, no un secreto; nunca contienen private keys ni seed phrases. Los firmantes usan wallets externas o un mecanismo de custodia aprobado.
2. `TREASURY_MULTISIG_PDA`, `TREASURY_MULTISIG_CREATE_KEY` y `TREASURY_VAULT_PDA` deben ser coherentes entre sí según `@sqds/multisig`; si no coinciden, el proceso falla cerrado.
3. El arranque valida `cluster`, `programId` mediante `getAccountInfo`, existencia y owner de la Multisig, `threshold`, miembros/permisos, `vaultIndex`, y que la Vault PDA sea la cuenta que posee/controla los activos. Las variables no son prueba de autoridad.
4. Toda consulta y toda propuesta debe llevar el contexto resuelto `{cluster, programId, multisigPda, vaultIndex, vaultPda}`. No se permite un singleton global que cambie de Squad dentro del mismo proceso.
5. La configuración debe incluir `TREASURY_POLICY_PDA`. El arranque comprueba que owner, seeds, Vault, mint, token program y claves de attestation de esa cuenta on-chain coinciden con el manifest. El backend nunca entrega las claves de attestation como parámetros de `initialize_run`.
6. Si el producto soporta varios Squads, se usa un registro explícito `treasury_id -> Authority Manifest`; `runId` referencia `treasury_id` y nunca una dirección arbitraria enviada por el cliente. El cliente no puede elegir `multisigPda`.
7. `PAYOUT_ATTESTER_A_PUBKEY` y `PAYOUT_ATTESTER_B_PUBKEY` pertenecen a identidades y custodias separadas; no pueden apuntar a la misma clave ni a una clave controlada por el worker/cranker. Son valores de la `TreasuryPolicy` PDA, no inputs de una request.
8. El cambio de Squad o de attesters requiere un `update_policy` firmado por la Vault dentro de una nueva propuesta Squads, configuración versionada, comprobación RPC, revisión del comité y migración explícita de fondos/claims. No es un cambio dinámico de una request.

## Identidades y límites de confianza

| Identidad | Puede hacer | No puede hacer |
| --- | --- | --- |
| Usuario beneficiario | Crear/cancelar su claim mientras sea cancelable; solicitar override con prueba SIWS | Aprobar pago, cambiar un payout run, elegir monto o ejecutar Squads |
| Proposer | Construir y proponer el setup inmutable del payout run | Aprobar como otro miembro, ejecutar si carece de permiso, cambiar root o leaves tras activar proposal |
| Voter | Aprobar/rechazar/cancelar según el estado de Squads | Editar mensaje o enviar pago fuera de una proposal |
| Executor worker | Ejecutar proposals `Approved` y reconciliar hechos on-chain | Votar, crear nuevos destinos/montos, inventar firmas o saltar time lock |
| Vault PDA | Autoridad de transferencias e instrucciones CPI ya aprobadas | Ser sustituida por la Multisig PDA o por una wallet HTTP |
| Backend/DB | Construir DTOs, persistir intención y proyectar estado | Declarar una proposal aprobada o un pago ejecutado sin evidencia RPC |

Nunca se deposita ni se asigna autoridad a la **Multisig PDA**. La autoridad de activos y del programa notario es exclusivamente la **Vault PDA** derivada de esa multisig.

## Arquitectura de pagos

```mermaid
flowchart LR
  A[Claims elegibles] --> B[Snapshot determinista]
  B --> C[Calculador A + verificador B]
  C --> D{Misma root y snapshot?}
  D -->|No| X[Rechazar corrida]
  D -->|Sí| E[Proposal Squads: init + fund + seal]
  E --> F[Proposal Active]
  F --> G{Umbral N-de-M}
  G -->|No| F
  G -->|Sí| H[Approved + time lock]
  H --> I[Vault CPI: init + fund escrow + seal root]
  I --> J[Cranker: proof + settle_claim]
  J --> K[Receipt PDA + RPC projection]
```

### Contrato de snapshot y doble verificación

Antes de crear una propuesta, el servicio construye un snapshot ordenado por `claimId` binario. Cada hoja usa encoding binario versionado, sin JSON ni números flotantes:

```text
domain = "brids:epic015:payout:v1"
leaf = keccak256(domain || runId || claimId || mint || tokenProgram || recipientWallet || recipientAta || amountMinor)
```

> [!IMPORTANT]
> **Codec Canónico Único (P0 — Especificación Completa e Implementable)**
>
> #### A. Encoding binario de cada campo (orden estricto de concatenación)
>
> | # | Campo | Tipo | Encoding | Bytes |
> |---|---|---|---|---|
> | 1 | `domain` | string literal | UTF-8: `"brids:epic015:payout:v1"` | 22 |
> | 2 | `runId` | UUID v4 | 16 bytes big-endian (RFC 4122 binary, sin guiones) | 16 |
> | 3 | `claimId` | UUID v4 | 16 bytes big-endian (RFC 4122 binary, sin guiones) | 16 |
> | 4 | `mint` | Pubkey | 32 bytes raw (Solana Pubkey) | 32 |
> | 5 | `tokenProgram` | Pubkey | 32 bytes raw (SPL Token o Token-2022 program ID) | 32 |
> | 6 | `recipientWallet` | Pubkey | 32 bytes raw | 32 |
> | 7 | `recipientAta` | Pubkey | 32 bytes raw (ATA derivada) | 32 |
> | 8 | `amountMinor` | u64 | 8 bytes **little-endian** (`u64::to_le_bytes()`) | 8 |
> | | **Total por leaf** | | | **190** |
>
> La leaf hash es: `keccak256(buffer_190_bytes)` → `[u8; 32]`.
> Implementación Rust: `solana_program::keccak::hashv(&[&buffer])`.
> Implementación TypeScript: `keccak_256(buffer)` de `@noble/hashes/sha3` (o `@ethersproject/keccak256`).
>
> #### B. Reglas del árbol de Merkle (Helium `lazy-transactions` pattern)
>
> | Regla | Especificación | Referencia |
> |---|---|---|
> | **Hash function** | `solana_program::keccak::hashv` (Keccak-256) | Helium `merkle_proof.rs` |
> | **Nodos internos** | `keccak256(left_child || right_child)` — **sin prefijo de dominio** en nodos internos. Solo la leaf tiene domain separator. | Helium `hash_to_parent()` |
> | **Proof direction** | **Index-based directional** (NO sorted-pair). `is_left = (index >> depth) & 1 == 0`. Si la leaf está en posición par (bit=0), va a la izquierda; si impar (bit=1), va a la derecha. | Helium `recompute()` |
> | **Hojas impares** | Pad con `EMPTY = [0u8; 32]` hasta la próxima potencia de 2. Las hojas vacías NO se duplican; se usa el nodo nulo. | SPL `merkle-tree-reference` |
> | **Ordenamiento de hojas** | Por `claimId` binario (16 bytes big-endian, comparación lexicográfica). El index de cada leaf en el array ordenado determina su posición en el árbol. | Diseño BRIDS |
> | **Profundidad máxima** | `ceil(log2(itemCount))`. Sin límite fijo de MAX_DEPTH; se dimensiona al número de hojas. | — |
> | **Verificación on-chain** | `settle_claim` reconstruye la leaf desde los parámetros, la hashea, ejecuta `recompute(leaf_hash, proof, index)` y compara contra `merkle_root` almacenada en `PayoutRun`. | — |
>
> #### C. Vectores de prueba normativos (hex)
>
> Estos vectores son **canónicos y ejecutables en Rust y TypeScript**. Cualquier implementación que no reproduzca exactamente estos valores tiene un bug.
>
> ```yaml
> # --- Input: 2 leaves ---
> domain: "brids:epic015:payout:v1"
> runId:            "550e8400-e29b-41d4-a716-446655440000"
> runId_bytes:      550e8400e29b41d4a716446655440000
>
> leaf_0:
>   claimId:        "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
>   claimId_bytes:  6ba7b8109dad11d180b400c04fd430c8
>   mint:           "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"  # USDC devnet
>   mint_bytes:     c6fa7af3bedbad3a3d65f36aabc97431b1bbe4c2d2f6e0e47ca60203452f5d61
>   tokenProgram:   "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"   # SPL Token
>   tokenPgm_bytes: 06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9
>   recipientWallet: "BrEAK7zGZ6dM71zUDACDqJnekihmwF15noTddWTsknjC" # example
>   wallet_bytes:   9c46f1d3f25a43e7a8b6b8b3c2f01d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c
>   recipientAta:   (derived from wallet + mint + token program)
>   ata_bytes:      (32 bytes of derived ATA)
>   amountMinor:    1000000  # 1 USDC
>   amount_le:      40420f0000000000
>
> leaf_1:
>   claimId:        "f47ac10b-58cc-4372-a567-0e02b2c3d479"
>   claimId_bytes:  f47ac10b58cc4372a5670e02b2c3d479
>   # (same mint, tokenProgram, different wallet/ata/amount)
>   amountMinor:    2500000  # 2.5 USDC
>   amount_le:      a025260000000000
>
> # --- Expected outputs ---
> leaf_0_hash:      (keccak256 of 190-byte buffer for leaf_0)
> leaf_1_hash:      (keccak256 of 190-byte buffer for leaf_1)
>
> # Tree: leaf_0 (index=0, left) || leaf_1 (index=1, right)
> # root = keccak256(leaf_0_hash || leaf_1_hash)
>
> # Proof for leaf_0: [leaf_1_hash], index=0
> # Proof for leaf_1: [leaf_0_hash], index=1
>
> # ClaimReceipt PDA for leaf_0:
> #   seeds = [b"claim_receipt", payout_run_pda.as_ref(), leaf_0_hash.as_ref()]
> #   program_id = payout_settlement program ID
> ```
>
> > **Implementación obligatoria:** El primer SPEC de TDD DEBE incluir un test que construya ambas leaves byte a byte, genere el árbol, verifique las proofs y derive las PDAs de receipt. Los valores hex exactos se calcularán al implementar y se congelan como golden vectors. Tanto Rust (`#[test]`) como TypeScript (`vitest`) deben producir resultados idénticos.
>
> #### D. Construcción de `snapshotHash`
>
> ```text
> snapshotHash = keccak256(
>   "brids:snapshot:v1"            // domain separator (17 bytes UTF-8)
>   || runId                       // 16 bytes (UUID binary)
>   || merkleRoot                  // 32 bytes
>   || totalAmountMinor            // 8 bytes LE
>   || itemCount                   // 4 bytes LE (u32)
>   || rulesVersion                // 2 bytes LE (u16)
>   || mint                        // 32 bytes
>   || tokenProgram                // 32 bytes
> )
> ```
> Total: 143 bytes. Este hash es lo que firman los attesters en la attestation canónica.

El snapshot produce `merkleRoot`, `snapshotHash`, `snapshotVersion`, `rulesVersion`, `itemCount` y `totalAmountMinor`. El calculador de pagos y un verificador independiente deben consumir el mismo snapshot inmutable, por identidades de ejecución distintas, y emitir exactamente ese conjunto. Cada uno firma `payout-attestation:v1 || run_id_hash || snapshot_hash || merkle_root || total_amount_minor || item_count || rules_version || mint || token_program || expiry`. Si uno difiere, no se puede construir la propuesta.

La propuesta Squads contiene las dos verificaciones Ed25519 y una instrucción `initialize_run` con esos compromisos; después, en la misma Vault Transaction, las instrucciones de transferencia desde la Vault ATA al escrow ATA y `seal_run`. `initialize_run` lee el sysvar de instrucciones y falla si no encuentra ambas verificaciones contra las public keys configuradas y el mensaje exacto. El programa no permite settlement hasta que esté sellado y comprueba que el escrow contiene exactamente `totalAmountMinor`. `merkleRoot` deja de ser evidencia auditora: es la condición criptográfica de autorización de cada transferencia.

### Contrato on-chain de `payout_settlement`

> [!CAUTION]
> **Validación de Vault PDA (P0 — Requisito de Seguridad):**
> `authority_vault.is_signer` **solo no es suficiente**. Una PDA firmante de un programa atacante podría invocar `initialize_policy` vía CPI antes que la tesorería legítima. **Todas** las instrucciones que exigen `authority_vault` DEBEN verificar las 3 capas:
>
> | Capa | Verificación | Rust pseudocódigo |
> |---|---|---|
> | **1. Firma** | `authority_vault.is_signer == true` | Anchor `Signer<'info>` |
> | **2. Re-derivación PDA** | `authority_vault.key() == get_vault_pda(multisig_pda, vault_index, SQUADS_V4_PROGRAM_ID)` | `Pubkey::find_program_address(&[b"multisig", multisig_pda.as_ref(), b"vault", &[vault_index]], &SQUADS_V4_ID)` |
> | **3. Owner check** | `multisig_account.owner == SQUADS_V4_PROGRAM_ID` | `constraint = multisig_account.owner == &SQUADS_V4_ID` |
>
> **Seeds exactos de Squads v4** (fuente: [`v4/sdk/rs/src/pda.rs`](https://github.com/Squads-Protocol/v4/blob/HEAD/sdk/rs/src/pda.rs)):
> - Vault PDA: `[b"multisig", multisig_pda.as_ref(), b"vault", &[vault_index]]` con program_id `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`
> - Multisig PDA: `[b"multisig", b"multisig", create_key.as_ref()]` con el mismo program_id
>
> **Instrucciones afectadas:** `initialize_policy`, `update_policy`, `initialize_run`, `seal_run`, `pause_run`, `cancel_run`, `resume_run`, `refund_unclaimed`.

`TreasuryPolicy` es una PDA derivada de `[b"treasury_policy", treasury_id_hash]`, inicializada y actualizable sólo por `authority_vault` verificada con las 3 capas anteriores. Guarda `authority_vault`, `multisig_pda`, `vault_index`, mint/token program permitidos, `attester_a`, `attester_b`, `policy_version`, `paused` y bump. En `initialize_policy`, los valores `multisig_pda` y `vault_index` se almacenan y la re-derivación confirma que `authority_vault` corresponde exactamente a esa Vault de Squads v4. Es la ancla on-chain del Authority Manifest.

`PayoutRun` es una PDA por corrida, derivada de `[b"payout_run", run_id_hash]`. Almacena: `treasury_policy`, `policy_version`, `authority_vault`, `multisig_pda`, `vault_index`, `mint`, `token_program`, `merkle_root`, `snapshot_hash`, `rules_version`, `total_amount_minor`, `item_count`, `expires_at`, `status`, `escrow_ata` y `bump`. El escrow es un ATA cuyo owner es la PDA del run.

La única secuencia que activa una corrida es una Vault Transaction de Squads, atómica y revisable:

1. Dos instrucciones Ed25519 verifican las attestationes canónicas antes de cualquier instrucción del programa.
2. `initialize_run`: exige `authority_vault` con las 3 capas de validación (signer + PDA re-derivation + multisig owner check), recibe la `TreasuryPolicy` PDA, verifica que `authority_vault == policy.authority_vault`, toma de ella las claves permitidas y comprueba ambas verificaciones en el instructions sysvar; crea el `PayoutRun` inmutable y el escrow ATA.
3. Transferencia SPL/Token-2022 desde la ATA de la Vault al escrow por exactamente `total_amount_minor`.
4. `seal_run`: exige la misma Vault signer (con re-derivación), verifica el balance exacto del escrow y cambia `status` a `Active`.

`settle_claim` recibe `leaf`, `proof`, recipient ATA y amount. Recalcula la leaf con el encoding anterior, verifica la proof contra `merkle_root`, comprueba mint/token-program/ATA/expiración/estado y crea `ClaimReceipt` PDA derivada de `[b"claim_receipt", payout_run, leaf_hash]`. Si el receipt ya existe, falla. Sólo después transfiere el monto exacto del escrow al ATA comprometido. El cranker no firma como Vault ni recibe un parámetro que pueda sustituir recipient, mint, amount o root.

`pause_run`, `cancel_run` y `refund_unclaimed` exigen `authority_vault` con las 3 capas de validación (signer + PDA re-derivation + multisig owner check) y por ello sólo son invocables mediante otra propuesta Squads aprobada. Ninguna operación revierte un receipt ni un pago ya confirmado.

> [!IMPORTANT]
> **Regla de Veto Pre-Seal Only (P0 — Decisión Cerrada):**
> El contrato `payout_settlement` **no incluye instrucción `revoke_leaf` ni PDA de revocación individual**. La `merkleRoot` es inmutable tras `seal_run`. El veto granular solo opera antes del sellado:
> 1. **Pre-seal:** Admin veta fila → se excluye del snapshot → se recalculan root + attestations → se crea nueva propuesta Squads. El ciclo completo (snapshot → attestation → proposal) se repite.
> 2. **Post-seal:** El mecanismo es: circuit breaker (detiene al cranker off-chain) → `pause_run` (propuesta Squads, bloquea `settle_claim` on-chain) → `cancel_run` (propuesta Squads) → `refund_unclaimed` → nuevo run excluyendo leaves vetadas + ya liquidadas.
> 3. **Post-ejecución:** Un `ClaimReceipt` es irrevocable. Solo aplica flujo de auditoría/disputa.
>
> Un `VETOED_BY_ADMIN` en Postgres sin `pause_run` on-chain **no impide** que un cranker con proof válida liquide la leaf. La defensa en profundidad es: DB flag → circuit breaker → `pause_run` on-chain.

**Límite de garantía honesto:** el programa garantiza que cada salida corresponde a una leaf del root N-de-M aprobado, doblemente attestada y que no se repite. No puede demostrar que una claim era legítima fuera de cadena. Para ello el snapshot se bloquea, se recalcula independientemente, sus firmantes están separados del cranker y se presenta al comité con `snapshotHash`, reglas versionadas, total y muestra/auditoría de hojas antes del voto.

### Planificación y ciclo Squads obligatorio

No existe `MAX_LEGS_PER_BATCH` ni un batch de payout legs. Sólo se planifica la transacción de setup del run (`initialize_run` + fund + `seal_run`), que se simula en Devnet con sus cuentas, tamaño serializado, compute units, mint y token program. Los payouts posteriores son una instrucción `settle_claim` por leaf; si la operación excede límites por proof o cuentas, se rechaza antes de envío y no se sustituye por un pago directo.

1. Bloquear el snapshot y obtener dos resultados independientes; persistir ambos hashes y el dictamen de coincidencia.
2. Leer `Multisig`, Vault y balances; reservar el índice de propuesta de forma optimista.
3. Construir una Vault Transaction inmutable con `initialize_run`, transferencia exacta al escrow y `seal_run`; incluir los compromisos de snapshot en `initialize_run`.
4. Crear y activar la propuesta Squads sólo después de simular y validar todas las cuentas.
5. Los voters firman desde sus wallets; el servidor sólo observa y proyecta el voto.
6. Tras `Approved` y vencido `timeLock`, un miembro `Executor` ejecuta el setup. El indexer comprueba signature, cuentas invocadas, logs, balance del escrow y estado `Active` antes de habilitar cranking.
7. El cranker procesa leaves en cualquier orden, siempre con proof. El indexer comprueba cada `ClaimReceipt` y movimiento token antes de proyectar `executed`.

## Estado canónico

### Claims

```text
quote_created -> claim_requested -> approved_for_dispersion
approved_for_dispersion -> run_proposed -> awaiting_threshold -> run_funded -> settling -> executed
quote_created|claim_requested -> expired|canceled|compliance_hold
compliance_hold -> approved_for_dispersion|clawback_to_treasury
run_proposed|awaiting_threshold -> rejected|canceled|stale
settling -> partially_executed|executed|execution_unknown
```

`canceled` solo es válido antes de que exista un `ClaimReceipt`. Si el `PayoutRun` ya está sellado, la cancelación debe ser una propuesta Squads que pause/cancele el run; las leaves sin receipt no se pueden liquidar mientras esté pausado. Nunca se revierte un pago confirmado.

### Payout run projection

```text
snapshot_verifying -> proposal_draft -> active -> awaiting_threshold -> approved
approved -> time_locked -> funding_confirmed -> settling -> partially_executed|executed
proposal_draft|active|awaiting_threshold|approved -> rejected|canceled|stale
any RPC-ambiguous execution -> execution_unknown
```

Los estados de propuesta se derivan de Squads; `funding_confirmed`, `settling`, los receipts y el progreso se derivan de `PayoutRun` y `ClaimReceipt`. La DB puede usar estados de trabajo (`snapshot_verifying`, `execution_unknown`), pero no sustituye evidencia on-chain.

## Persistencia requerida

La migración de EPIC-015 debe crear entidades de `PayoutRun`; no puede reutilizar valores simulados de batch. Campos mínimos:

| Entidad | Campos obligatorios |
| --- | --- |
| `payout_runs` | `run_id`, `payout_run_pda`, `escrow_ata`, `squads_program_id`, `multisig_pda`, `multisig_create_key`, `vault_pda`, `vault_index`, `proposal_pda`, `snapshot_hash`, `snapshot_version`, `rules_version`, `merkle_root`, `total_amount_minor`, `onchain_status`, `funding_signature`, `funding_slot`, `last_reconciled_slot`, `idempotency_key`, `time_lock_seconds` |
| `payout_run_items` | `run_id`, `claim_id` unique entre items activas, `canonical_leaf_hash` único por run, `expected_recipient_ata`, `token_program`, `amount_minor`, `merkle_proof_ciphertext_or_uri`, `receipt_pda`, `settlement_signature`, `settlement_slot`, `projection_status` |
| `payout_snapshot_attestations` | `run_id`, `calculator_identity`, `snapshot_hash`, `merkle_root`, `total_amount_minor`, `item_count`, `rules_version`, `artifact_uri`, `verified_at`, `result` |
| `distribution_payout_overrides` | `claim_id`, `case_number` normalizado, `requested_wallet`, `effective_wallet`, `status`, `version`, `proposal_pda`, `run_id`, `onchain_signature`, `onchain_slot`, actor y timestamps |
| `claim_or_payout_events` | `idempotency_key` único por evento externo, actor, source (`api`, `rpc-indexer`, `cron`), signature, slot y metadata versionada |

Restricciones obligatorias: no se puede tener dos items activas para un claim; no se crea propuesta sin dos attestations coincidentes; los montos son enteros de unidades mínimas; receipt PDA y leaf son únicos; signatures no son nullable una vez que un estado se proyecta como ejecutado; los eventos de origen RPC son idempotentes por signature e índice.

## Overrides y cancelación

Un override de wallet nunca cambia `distribution_claims.payout_wallet` directamente. El flujo es:

1. Beneficiario prueba control de la wallet original mediante SIWS con nonce, audiencia, expiración y `claimId` enlazado.
2. Backend crea `distribution_payout_overrides` en `PENDING`; valida wallet destino y exige `case_number`.
3. El comité crea una proposal que autoriza el override para **ese claim, destino, mint y versión**.
4. Solo después de leer ejecución confirmada, la proyección fija `effective_wallet` para un snapshot aún no bloqueado.
5. Si la claim ya pertenece a un payout run sellado, no se modifica su leaf; se pausa/cancela el run mediante Squads cuando proceda y se crea una corrida de reemplazo para los no liquidados.

## ProjectConfigPDA notarial

El programa Anchor `project_config_notary` es la fuente de verdad de fechas on-chain. Usa el patrón idiomático de Anchor: `#[account(init)]` para creación con PDA seeds, `#[account(has_one = authority_vault)]` para validación de autoridad, y CPI signer seeds para actualizaciones. No se basa en un repositorio externo ni en un "estándar" con nombre propio; es la combinación documentada de constraints del framework [`coral-xyz/anchor`](https://github.com/coral-xyz/anchor) (licencia MIT OR Apache-2.0), referenciada en [Account Constraints](https://www.anchor-lang.com/docs/references/account-constraints) y [PDA Accounts](https://solana.com/docs/core/pda/pda-accounts). No requiere circuit breaker por tratarse de un estado de gobernanza inmutable:

- seeds: `[b"project_config", collection_address.as_ref()]`;
- estado: `collection_address`, `authority_vault`, `multisig_pda`, `vault_index`, `project_start_at`, `project_end_at`, `version`, `updated_at`, `bump`;
- `initialize` protege contra reinitialization y solo acepta una configuración de bootstrap aprobada;
- `update_project_dates` exige que `authority_vault` coincida con el estado y sea signer; ese signer llega por CPI desde la Vault PDA durante `vaultTransactionExecute`;
- valida rango temporal, overflow, `start <= end` y política explícita para `end = None`;
- incrementa versión y emite evento con valores anterior/nuevo, signature y slot indexables.

`has_one` no prueba firma. Una wallet HTTP, la Multisig PDA o Postgres no pueden actualizar fechas. El motor de distribución valida owner del programa, seeds, discriminator, longitud y versión antes de decodificar; ante RPC inválido, ausente o stale falla cerrado.

## Reglas de implementación no negociables

- Usar `@solana/kit` para RPC/cliente y encapsular la dependencia web3.js de `@sqds/multisig` en `apps/web/src/lib/solana-kit/compat/squads.ts` mediante `@solana/web3-compat` si es necesario.
- Estructuración estricta en el estándar **Monorepo Workspaces & 4-Layer Feature-Driven Design (FDD)** establecido en PR #327:
  * Presentación en `apps/web/src/features/{admin,staking-distribution}/presentation/`
  * Aplicación en `apps/web/src/app/api/` y `apps/web/src/features/staking-distribution/application/`
  * Dominio en `apps/web/src/features/staking-distribution/domain/` (0 dependencias externas)
  * Infraestructura en `apps/web/src/features/staking-distribution/infrastructure/`, `apps/web/src/lib/solana-kit/compat/`, `packages/solana-client` y `programs/`
- El adaptador nunca devuelve strings de fallback para PDAs, ATAs, signatures o slots. Un address inválido es error tipado y fail-closed.
- No aceptar `executionSignature`, `executionSlot`, `blockTime`, estado de proposal ni aprobadores desde HTTP como evidencia.
- Cada envío se simula; la confirmación se verifica con firma, slot, error de meta y cuentas esperadas antes de proyectar DB.
- RPC debe tener endpoint HTTP y WSS explícitos, timeout, retry con backoff y estado `execution_unknown` para incertidumbre. Reintentar consulta; nunca recrear un mensaje ya enviado.
- Token program, mint, ATA de escrow/destino, owner del ATA y decimales se validan antes de sellar el run y antes de cada settlement.
- El executor usa un signer gestionado fuera del repositorio; no se pide, guarda ni imprime una clave privada.

## Evidencia y tests por entrega

Cada SPEC comienza RED y termina con evidencia proporcional:

1. Unit: seeds correctas, encoding de leaf, state machine, planner, idempotencia y validación de cuentas.
2. Integration: bloquear snapshot, crear proposal Squads, votos, time lock, `initialize_run + fund + seal`, proof válida/inválida, receipt duplicado y cancelación con estado real.
3. Program: LiteSVM/Mollusk para invariantes de `payout_settlement` y del notario; Devnet para la transacción real.
4. E2E: UI solo habilita acciones coherentes con el DTO on-chain y nunca firma/envía de forma automática.
5. Devnet: program IDs, PDAs, signatures, slots, estados de Proposal/PayoutRun, escrow/ATA balances y events quedan registrados en `docs/devnet-proof.md`.

## Antipatrones explícitamente prohibidos

- derivar una Multisig desde `treasury_vault`;
- usar la Multisig PDA como autoridad de activos;
- `MAX_LEGS_PER_BATCH` o una transferencia directa por batch como mecanismo de seguridad;
- aprobar, fondear o ejecutar un payout cambiando solo Postgres;
- generar signatures, slots, block times o PDAs ficticios;
- permitir `proposed` como estado ejecutable;
- mutar la wallet de payout después de bloquear el snapshot;
- usar una Merkle root auditora sin `PayoutRun`, proof, escrow y receipt on-chain;
- permitir que un cranker elija recipient, amount, mint, token program, root o un leaf sin proof;
- fallback a fechas de Postgres cuando falle la lectura de `ProjectConfigPDA`;
- vetar una leaf post-seal usando solo un flag de Postgres (`VETOED_BY_ADMIN`) sin `pause_run` on-chain — una proof válida liquidaría la leaf igualmente;
- confiar en el circuit breaker local (flag DB/Redis) como garantía de detención de settlement — un cranker externo o comprometido puede llamar `settle_claim` directamente; `pause_run` on-chain es la única garantía autoritativa;
- validar `authority_vault` con solo `is_signer` sin re-derivar la Vault PDA contra el Squads v4 program ID (`SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`) y sin verificar `multisig.owner == SQUADS_V4_ID` — una PDA firmante de un programa atacante podría inicializar `TreasuryPolicy` antes que la tesorería legítima.
