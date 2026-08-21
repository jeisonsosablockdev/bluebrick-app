---
type: ImplementationSpec
title: STORY-015-01 Treasury Settlement Authorization Implementation Spec
description: Especificación atómica para que Squads v4 apruebe/fondee un PayoutRun y el programa settlement verifique cada pago con Merkle proof, escrow y receipt on-chain.
tags: [specs, solana, squads, settlement, merkle, escrow, implementation, tdd, refactor-clean]
timestamp: 2026-07-26T14:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-01-delegated-allowance-execution-implementation.md
---

# STORY-015-01 Treasury Settlement Authorization Implementation Spec

> [!IMPORTANT]
> **Decisión vinculante — 2026-07-26.** Este story reemplaza el supuesto de "delegated allowance", el motor `squads-batch.ts`, el máximo de 20 transferencias y la raíz Merkle meramente auditora. Squads aprueba una única transacción de setup que crea/fondea/sella un `PayoutRun`; `payout_settlement` verifica proof, monto, destino y no-reuso en cada pago. Ningún subagente puede restaurar el modelo anterior sin un RFC aprobado que sustituya esta decisión.

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-01`
- Parent Branch: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Status: `draft`
- Owner: `jaymusicmachine`

---

## 1. 4-Layer Architecture Mapping

### Layer 1: Presentation Layer
- No aplica (se integra en la UI en STORY-015-02).

### Layer 2: Application/Consumption Layer
- **`apps/web/src/app/api/admin/payout-runs/create-proposal/route.ts`**: Construye una propuesta Squads de setup desde dos attestationes coincidentes; no envía, firma ni acepta cuentas arbitrarias del cliente.

### Layer 3: Domain/Pipelines/Services Layer
- **`apps/web/src/features/staking-distribution/domain/payout-leaf.ts`**: Construye snapshot determinista, leaf canónica y Merkle root; cero dependencias de DB/framework.
- **`apps/web/src/features/staking-distribution/application/snapshot-verifier.ts`**: Recalcula independientemente root/total/cantidad desde el snapshot bloqueado.
- **`apps/web/src/features/staking-distribution/application/settlement-cranker.ts`**: Sólo presenta proof de una leaf ya comprometida y reconcilia `ClaimReceipt`; no posee autoridad de Vault.

### Layer 4: Infrastructure Layer
- **`apps/web/src/lib/solana-kit/compat/squads.ts`**: Adaptador aislado para `@sqds/multisig`; el program ID y cluster se configuran y se validan por RPC, nunca se asumen desde una constante no verificada.
- **`apps/web/src/lib/solana-kit/compat/payout-settlement.ts`**: Adaptador de IDL/Kit para `PayoutRun`, escrow y `ClaimReceipt`; valida owner, discriminador, seeds y token program antes de decodificar.
- **`packages/solana-client`**: Bindings tipados generados por Codama / Anchor IDL para programas de Solana.
- **`programs/payout_settlement`**: Programa Anchor on-chain para verificación de Merkle proofs, escrow PDA y receipts.

---

## 2. Subagent Orchestration (Gates & Cross-Cutting)

> **Protocolo Double-Gatekeeper (AGENTS.md)**

| Gate | Subagente | Momento |
| --- | --- | --- |
| **Gate 1: Pre-Implementation Architecture Review** | `architect` | Antes de SPEC-02 — inspecciona y aprueba file paths e imports del Solution Spec |
| **Gate 2: Post-Implementation Diff Audit** | `architect` | Después de SPEC-04 — audita diff, layer isolation, zero forbidden patterns |
| **Cross-Cutting: Security Review** | `security` | Revisa CPI authority, signer validation, replay protection en SPEC-03/04 |
| **Cross-Cutting: Docs Sync** | `docs` | Actualiza knowledge artifacts al cierre de la Story |

---

## 3. SPEC Delivery Structure (Atomic Branches)

### SPEC-01: TDD — Tests en Fallo (RED Phase)
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s01-tdd`
- **Subagente ejecutor**: `qa`
- **Subagentes de apoyo**: `solana` (definir assertions de protocolo Squads)
- **Objetivo**: Escribir los tests unitarios e integración en fase RED (fallo controlado) sin implementar lógica de negocio.
- **Archivos a Crear**:
  - `tests/lib/payout-snapshot.test.ts`
  - `tests/programs/payout-settlement.test.ts`
  - `tests/api/create-payout-run-proposal.test.ts`
- **Assertions**:
  - Dos calculadores sobre el mismo snapshot producen el mismo root, total, count y `snapshotHash`; una diferencia impide crear propuesta.
  - Rust y TypeScript consumen el mismo fixture `tests/fixtures/payout-settlement-v1.json` y reproducen preimage de 191 bytes, leaf, root, proof, `snapshotHash` y ClaimReceipt PDA para árboles de 1, 2 y 3 hojas; UUID no canónico, `index >= itemCount` y proof de longitud incorrecta fallan. El caso de 1 leaf exige profundidad 1 y hermano `EMPTY`.
  - Una proof alterada, recipient/ATA/monto/mint/token-program distintos o run no sellado fallan en `settle_claim`.
  - La segunda liquidación de la misma leaf falla porque el `ClaimReceipt` PDA ya existe.
  - Una Vault PDA firmante derivada de otro multisig, `vault_index`, `create_key`, programa o cuenta Multisig con owner/discriminator inválido no puede inicializar ni actualizar policy. Solo la Vault exacta configurada puede hacerlo.
  - `pause_run` acepta únicamente una instrucción Ed25519 inmediatamente anterior, con clave, mensaje, expiración y nonce exactos; firma vencida, key/version errónea o replay después de `resume_run` fallan. Una firma válida pausa aunque el relayer no sea miembro de Squads; no puede reanudar, cancelar, retirar ni cambiar policy.
  - La propuesta de setup contiene exactamente `initialize_run`, transferencia al escrow y `seal_run`; no contiene una transferencia directa a un beneficiario. La mint Token-2022 con cualquier extensión, incluida `TransferFee` o `TransferHook`, se rechaza.
- **Test Commands**:
  ```bash
  pnpm test tests/lib/payout-snapshot.test.ts
  pnpm test tests/programs/payout-settlement.test.ts
  pnpm test tests/api/create-payout-run-proposal.test.ts
  ```
- **DoD de SPEC-01**: Todos los tests compilando y fallando correctamente (RED).

---

### SPEC-02: Instalación SDK & Wrapper de Infraestructura Squads
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s02-squads-sdk`
- **Subagente ejecutor**: `solana`
- **Subagentes de apoyo**: `architect` (Gate 1 — validar ubicación en Layer 4)
- **Objetivo**: Instalar `@sqds/multisig` y construir el wrapper de infraestructura en la capa 4.
- **Archivos a Crear/Modificar**:
  - `package.json` (agregar `@sqds/multisig`)
  - `apps/web/src/lib/solana-kit/compat/squads.ts` (Layer 4 — Infrastructure wrapper con validación RPC del program ID en Devnet)
- **DoD de SPEC-02**: `@sqds/multisig` instalado, wrapper compilando limpiamente, `getAccountInfo(programId)` verificado en Devnet.

---

### SPEC-03: Contrato de Snapshot y Attestation Independiente
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s03-payout-snapshot`
- **Subagente ejecutor**: `solana`
- **Subagentes de apoyo**: `security` (encoding, inmovilidad e identidad de attestation), `db` (snapshot bloqueado)
- **Responsabilidad única**: convertir claims ya elegibles y bloqueadas en el artefacto determinista que el comité aprueba. No crea propuestas, no construye transacciones, no hace RPC y no liquida pagos.
- **Archivos a Crear/Modificar**:
  - `apps/web/src/features/staking-distribution/domain/payout-leaf.ts` (Layer 3 — Domain: snapshot determinista, leaf canónica, Merkle root)
  - `apps/web/src/features/staking-distribution/application/snapshot-verifier.ts` (Layer 3 — Application: recálculo independiente de root/total/count)
  - migración Drizzle/SQL para tabla `payout_snapshot_attestations`
- **Contrato de salida**: `{runId, snapshotHash, snapshotVersion, rulesVersion, merkleRoot, totalAmountMinor, itemCount, orderedLeafHashes, expiry}` y una firma Ed25519 sobre el mensaje binario canónico de `SOLUTION-ARCHITECTURE.md`, una por cada attester. La salida es inválida si ambas attestations no coinciden byte a byte, omiten `snapshotVersion`/policy/program ID, están vencidas o provienen de la misma public key.
- **DoD de SPEC-03**: tests RED de encoding, orden, root, discrepancia e inmutabilidad en verde; ningún import de Squads, RPC ni programa settlement.

### SPEC-04: Programa `payout_settlement` — Run, Escrow y Sellado
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s04-settlement-program`
- **Subagente ejecutor**: `solana`
- **Subagentes de apoyo**: `security` (CPI/signer/SPL Token allowlist), `architect` (Gate 1 de paths e imports)
- **Responsabilidad única**: implementar `TreasuryPolicy`, `initialize_run` y `seal_run`. No construye snapshots, no crea propuestas y no ejecuta claims.
- **Archivos a Crear**:
  - `programs/payout_settlement/src/lib.rs`
  - `programs/payout_settlement/src/state.rs`
  - `programs/payout_settlement/src/instructions/initialize_policy.rs`
  - `programs/payout_settlement/src/instructions/update_policy.rs`
  - `programs/payout_settlement/src/instructions/initialize_run.rs`
  - `programs/payout_settlement/src/instructions/seal_run.rs`
- **DoD de SPEC-04**: sólo la Vault PDA signer exacta puede inicializar/actualizar `TreasuryPolicy` e inicializar/sellar un run: se re-derivan Vault y Multisig con `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`, `multisigPda=rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD`, `vaultIndex=0`, `vaultPda=D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB` y el `create_key` real leído/verificado por RPC; se valida `multisig.owner`, discriminator, longitud, `threshold=2`, cuatro miembros esperados y permisos. La identidad Squads/Vault queda inmutable. `TreasuryPolicy` guarda la clave pública/version de pausa de emergencia, rotables solo por Vault. En V1, `mint=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` y `tokenProgram=TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`; SOL, otros mints y Token-2022 se rechazan antes de construir o ejecutar la propuesta. `initialize_run` toma las public keys de la policy (nunca del request) y exige dos verificaciones Ed25519 del mensaje binario exacto; almacena `snapshotVersion`; valida escrow, owner, mint, token program y balance exacto. `refund_unclaimed` queda limitado al ATA canónico de la Vault; run no es reinitializable ni modificable tras sellado.

---

### SPEC-05: Programa `payout_settlement` — Liquidación de una Leaf
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s05-settle-claim`
- **Subagente ejecutor**: `solana`
- **Subagentes de apoyo**: `security` (proof, replay, cuentas token), `qa` (Mollusk/LiteSVM)
- **Responsabilidad única**: implementar `settle_claim` y `ClaimReceipt`. No administra el lifecycle de Squads ni modifica elegibilidad.
- **DoD de SPEC-05**: proof/leaf/ATA/mint/token program/expiry/status se validan; un receipt bloquea reuso; la transferencia sale sólo del escrow PDA y por el monto comprometido.

---

### SPEC-06: Propuesta Squads de Setup y Evidencia Devnet
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s06-squads-setup-proposal`
- **Subagente ejecutor**: `api`
- **Subagentes de apoyo**: `solana` (instrucción on-chain), `security` (validación/allowlist), `db` (idempotencia)
- **Responsabilidad única**: construir y persistir el paquete de propuesta que contiene las tres instrucciones de setup. No calcula roots ni hace cranking.
- **Archivos a Crear**:
  - `apps/web/src/app/api/admin/payout-runs/create-proposal/route.ts` (Layer 2 — Application: endpoint REST de creación de propuesta)
  - `apps/web/src/features/staking-distribution/application/squads-setup-proposal.ts` (Layer 3 — Application: orquestación de la propuesta Vault)
- **DoD de SPEC-06**: acepta sólo `runId`; resuelve server-side `treasury_id=brids-devnet-gov-treasury` contra el Authority Manifest de `SOLUTION-ARCHITECTURE.md`; nunca acepta `multisigPda`, `vaultPda`, mint, token program, attesters ni settlement program desde el cliente. Antes de proponer, valida por RPC el programa Squads, Multisig, Vault PDA, threshold `2/4`, miembros/permisos, `create_key`, USDC/SPL Token, `TreasuryPolicy` y programa `payout_settlement` desplegado. Exige dos attestationes coincidentes e independientes; simula y devuelve un paquete para firmar. Tras confirmación Devnet registra proposal, `PayoutRun`, escrow, signature, slot y evidencia RPC.

---

### SPEC-07: Cranker y Proyección de Receipts
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s07-settlement-cranker`
- **Subagente ejecutor**: `solana`
- **Subagentes de apoyo**: `security` (idempotencia/denegación de servicio), `db` (outbox/proyección)
- **Responsabilidad única**: seleccionar una item ya comprometida, presentar su proof y proyectar sólo receipts confirmados. No puede regenerar snapshot, alterar leaf ni enviar pagos directos.
- **Archivos a Crear/Modificar**:
  - `apps/web/src/features/staking-distribution/application/settlement-cranker.ts` (Layer 3 — Application: cranker sin privilegios)
  - `apps/web/src/lib/solana-kit/compat/payout-settlement.ts` (Layer 4 — Infrastructure: adaptador de comunicación RPC)
- **DoD de SPEC-07**: reintentos consultan primero `ClaimReceipt`; RPC ambiguo deriva a `execution_unknown`; saldo, receipt, signature, slot y meta se verifican antes de marcar `executed`.

---

### SPEC-08: Clean Code Audit & Refactoring
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s08-refactor-clean`
- **Subagente ejecutor**: `reviewer`
- **Subagentes de apoyo**: `architect` (Gate 2 — diff audit, layer isolation), `docs` (JSDoc, knowledge sync)
- **Objetivo**: Auditoría de código limpio según skill `code-refactoring-refactor-clean`. Verificar naming, eliminación de dead code, cumplimiento del patrón de 4 capas, duplicaciones.
- **Verificaciones**:
  - `pnpm validate` ejecutándose con 0 errores y 0 warnings.
  - No hay `any` implícitos.
  - Naming claro y consistente en todo el feature `apps/web/src/features/staking-distribution/` y adaptadores `apps/web/src/lib/solana-kit/compat/`.
  - Archivos separados por responsabilidad (SRP).
  - Documentación JSDoc actualizada.
- **DoD de SPEC-08**: Suite completa en verde, `pnpm validate` limpio y cero hallazgos bloqueantes.

---

## 4. Canonical Documentation & Open-Source References (Squads V4 & Merkle Distributors)

> Fuente canónica: [`squads-v4-documentation-reference.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/squads-v4-documentation-reference.md)

### 4.1 Referencias Canónicas de la Industria (Merkle Distributor & Licenciamiento)
- 🏆 **Referencia Open-Source Permisiva Seleccionada (Commit Pinneado)**: **Helium Lazy Distributor & Circuit Breaker**
  - Repositorio: [Helium lazy-distributor en el commit fijado](https://github.com/helium/helium-program-library/tree/f3070dc43d7f76263e8e75631c812b5a61a31794/programs/lazy-distributor)
  - Release / Tag: [`program-lazy-distributor-0.3.8`](https://github.com/helium/helium-program-library/tree/program-lazy-distributor-0.3.8) (Anchor `0.31.1` / Rust 2021).
  - Commit inmutable: [`f3070dc43d7f76263e8e75631c812b5a61a31794`](https://github.com/helium/helium-program-library/commit/f3070dc43d7f76263e8e75631c812b5a61a31794). El tag no sustituye este SHA para revisiones de seguridad, atribución o comparación de divergencias.
  - Manifests: `programs/lazy-distributor/Cargo.toml` y `programs/circuit-breaker/Cargo.toml`
  - Licencia: Permisiva **Apache-2.0** (compatible 100% con uso comercial y sin copyleft).
  - **Estado de Auditoría:** Se adopta como **referencia de código open-source permisiva**, no como contrato auditado para BRIDS. No existe reporte de auditoría externa aportado para este commit ni para `payout_settlement`; se requerirá auditoría independiente formal previa a Mainnet.
- 🚫 **Alternativa Rechazada (GPL-3.0 Copyleft)**: Jito Foundation Distributor ([github.com/jito-foundation/distributor](https://github.com/jito-foundation/distributor)) y Saber HQ (`merkle-distributor`).
- 🚫 **Alternativa Rechazada (AGPL-3.0 Copyleft)**: Goki Protocol (`merkle-distributor`).

#### Desglose de Primitivas Técnicas de Helium Adoptadas vs. Excluidas:
- **✅ Primitivas EXACTAS Adoptadas:**
  1. Verificación de Merkle Proofs en Rust (`solana_program::keccak::hashv`).
  2. Custodia de Tokens en Escrow PDA con transferencias CPI firmadas por las seeds de la PDA del `PayoutRun`.
  3. Recibo Único de Liquidación (`ClaimReceipt` PDA) como barrera atómica contra doble reclamo y reentrancy.
  4. Patrón de Circuit Breaker (pausa de emergencia multisig).
- **❌ Componentes y Dependencias Excluidos:**
  1. Red de oráculos en vivo de Helium (sustituido por Doble Attestation Ed25519 con sysvar check).
  2. Bubblegum / Compressed NFTs (`spl-account-compression`, `mpl-bubblegum`).
  3. Recompensas acumulativas continuas de Hotspots/Epochs (BRIDS usa runs atómicos cerrados).
  4. Gobernanza y tokenomics de subDAOs de Helium (HNT/MOBILE/IOT).

> [!IMPORTANT]
> **Estrategia Clean-Room & Requisitos de Auditoría:**
> `programs/payout_settlement` se implementa bajo licencia permisiva **Apache-2.0 / MIT** adoptando de forma aislada las primitivas matemáticas y de seguridad de Helium Network, garantizando 0 copyleft y cumplimiento de [`knowledge/governance/license-policy.json`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/governance/license-policy.json). Toda atribución de "contrato auditado" queda reservada a la entrega del informe formal de auditoría independiente con auditor, fecha, commit SHA, scope, hallazgos resueltos y matriz de diferencias respecto a BRIDS.

### 4.2 Matriz de Documentación Técnica por SPEC

| SPEC | Documentación Requerida | URL / Sección |
| --- | --- | --- |
| SPEC-01 (TDD) | Contrato de `PayoutRun`, leaf y `ClaimReceipt` | `SOLUTION-ARCHITECTURE.md` §Contrato on-chain de `payout_settlement` |
| SPEC-02 (SDK) | PDA derivation, Multisig, Proposal y Vault Transaction | [Accounts reference](https://docs.squads.so/main/development/reference/accounts) |
| SPEC-02 (SDK) | Program ID Devnet y API de TypeScript | [TypeScript overview](https://docs.squads.so/main/development/typescript/overview) |
| SPEC-03 (Snapshot) | Hashing, encoding, proof y modelo de amenaza | `SOLUTION-ARCHITECTURE.md` §Contrato de snapshot y doble verificación |
| SPEC-07 (Cranker) | RPC, simulación, confirmación y cuentas no confiables | `solana-dev` §Agent safety guardrails |
| SPEC-08 (Clean Code) | Auditoría de Clean Code, In-Code Commentary y Tipado Estricto | `clean-code` §Implementation Checklist |
| SPEC-09 (Fuzzing) | Property-Based Fuzzing con fast-check y validación de invariantes | `solana-dev` §Security & Invariants |

---

## 5. Blocking Design Contract
- Squads V4 modela `Multisig`, `VaultTransaction` y `Proposal`; no es un allowance genérico. Su única responsabilidad de pagos en este story es aprobar y ejecutar la transacción de setup que llama al programa settlement y fondea el escrow.
- `TreasuryPolicy` fija on-chain la Vault, mint/token-program permitidos y public keys de attestation. `PayoutRun` contiene el compromiso íntegro: policy/version, root, snapshot, reglas, total, mint, token program, Vault, expiry y escrow. Es inmutable después de `seal_run`.
- Cada `settle_claim` debe comprobar proof, encoding, recipient wallet/ATA, mint, token program, monto, expiry, estado del run y ausencia previa de `ClaimReceipt`. No hay endpoint ni worker con facultad de saltar esas comprobaciones.
- El servicio de cálculo no es autoridad de tesorería: se limita a producir una attestation Ed25519. Se exige segunda attestation independiente, con public key/custodia distinta, y un snapshot bloqueado; el programa valida ambas y el comité aprueba explícitamente sus hashes y total dentro de la propuesta Squads.
- Cada intento usa `idempotency_key(runId, leafHash)`, receipt PDA, signature, slot, meta y estado de confirmación. Nunca se reintenta un settlement confirmado con un mensaje nuevo.
- Devnet debe incluir `getAccountInfo` del programa Squads y del programa settlement, lectura de `Multisig`, simulación, confirmación, saldo de Vault/escrow/ATA y receipt PDA; sin esa evidencia el story no está completo.

## 6. Acceptance and Failure Matrix
| Condition | Required result |
| --- | --- |
| Program ID no existe en Devnet | Fail closed; no crear propuestas |
| Proposal no `Approved` | No ejecutar; mantener `awaiting_threshold` |
| Dos attestations no coinciden | No crear propuesta; conservar evidencia de la discrepancia |
| Proof, leaf, ATA, mint o amount no coinciden | `settle_claim` revierte; el escrow no cambia |
| Receipt ya existe | `settle_claim` revierte; no hay doble pago |
| Worker pierde RPC | Consultar primero receipt y firma con backoff; no duplicar envío |
| Circuit breaker local activo | Bot propio no crea ni ejecuta; cranker externo aún puede settle. Requiere `pause_run` on-chain |
| Pausa de emergencia retransmitida | Solo se congela si la instrucción Ed25519 inmediatamente anterior verifica el mensaje canónico, nonce y expiración vigentes; el relayer no recibe otros privilegios |
| Setup no deja escrow con total exacto | `seal_run` revierte y la transacción atómica no deja run activo |
