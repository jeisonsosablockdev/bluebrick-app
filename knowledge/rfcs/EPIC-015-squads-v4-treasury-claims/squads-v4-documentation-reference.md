---
type: Reference
title: Squads V4 Protocol & SDK — Canonical Documentation Reference
description: Mapa de referencia canónica de la documentación oficial de Squads V4 para la implementación de EPIC-015. Cada sección mapea URLs, conceptos clave, code snippets y Program IDs verificados.
tags: [squads, solana, sdk, documentation, reference, canonical]
timestamp: 2026-07-25T20:51:00Z
resource: https://docs.squads.so/main
---

# Squads V4 Protocol & SDK — Canonical Documentation Reference

> [!IMPORTANT]
> **Fuente de verdad**: Este archivo es la referencia canónica de la documentación de Squads V4 para EPIC-015. Todos los Implementation Specs deben citar secciones de este documento. No asumir APIs, Program IDs ni Account Structures sin verificar contra este índice.

---

## 1. Program IDs Oficiales

> Fuente pública: [TypeScript overview](https://docs.squads.so/main/development/typescript/overview). La disponibilidad en Devnet se debe comprobar con RPC antes de cada despliegue o primera operación.

| Cluster | Program ID |
| --- | --- |
| **Solana Mainnet-Beta** | `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf` |
| **Solana Devnet** | `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf` (verificado por RPC de sólo lectura el 2026-07-25) |
| **Solana Testnet** | No asumir soporte ni reutilización sin verificar el despliegue RPC. |
| **Eclipse Mainnet** | `eSQDSMLf3qxwHVHeTr9amVAGmZbRLY2rFdSURandt6f` |

> [!CAUTION]
> El Program ID es **idéntico** en Mainnet-Beta, Devnet y Testnet. Validar siempre con `getAccountInfo(programId)` en el cluster objetivo antes de crear transacciones.

---

## 2. SDK v4 (`@sqds/multisig`)

> Fuente: [TypeScript overview](https://docs.squads.so/main/development/typescript/overview)

### Instalación
```bash
npm install @sqds/multisig
# o
pnpm add @sqds/multisig
```

### Peer Dependency
- `@solana/web3.js` >= `^1.73.0`

### API Surface
```typescript
import * as multisig from "@sqds/multisig";

// Namespaces disponibles:
multisig.rpc.*            // High-level RPC helpers (envían transacciones)
multisig.instructions.*   // Low-level instruction builders (retornan TransactionInstruction)
multisig.accounts.*       // Account deserializers (Borsh)
multisig.types.*          // Types, Permissions, enums
multisig.getMultisigPda() // PDA derivation helpers
multisig.getVaultPda()
multisig.getProposalPda()
multisig.getSpendingLimitPda()
```

---

## 3. Account Structures (On-Chain)

> Fuente: [Accounts reference](https://docs.squads.so/main/development/reference/accounts)

### 3.1 `Multisig`
| Field | Type | Description |
| --- | --- | --- |
| `createKey` | `PublicKey` | Random key used to seed the PDA |
| `configAuthority` | `PublicKey \| null` | Optional authority that can modify config without a vote |
| `threshold` | `u16` | Number of signatures required for approval |
| `timeLock` | `u32` | Mandatory delay in seconds before an approved proposal can be executed |
| `transactionIndex` | `u64 (bigint)` | Auto-incrementing counter of total transactions |
| `staleTransactionIndex` | `u64 (bigint)` | Invalidates older pending proposals on config change |
| `rentCollector` | `PublicKey \| null` | Account for rent reclamation |
| `members` | `Array<{ key, permissions }>` | List of members and their roles |

### 3.2 `Proposal`
| Field | Type | Description |
| --- | --- | --- |
| `multisig` | `PublicKey` | Parent multisig address |
| `transactionIndex` | `u64 (bigint)` | Corresponding transaction index |
| `status` | `ProposalStatus` | `Draft`, `Active`, `Approved`, `Rejected`, `Executed`, `Cancelled` |
| `approved` | `PublicKey[]` | List of voters who approved |
| `rejected` | `PublicKey[]` | List of voters who rejected |
| `cancelled` | `PublicKey[]` | List of voters who cancelled |

### 3.3 `VaultTransaction`
| Field | Type | Description |
| --- | --- | --- |
| `multisig` | `PublicKey` | Parent multisig address |
| `creator` | `PublicKey` | Proposer address |
| `vaultIndex` | `u8` | Vault PDA index (0 = default) |
| `index` | `u64 (bigint)` | Transaction index |
| `ephemeralSigners` | `u8` | Count of ephemeral signers |
| `message` | `TransactionMessage` | Encapsulated instructions for CPI execution |

### 3.4 `Batch`
| Field | Type | Description |
| --- | --- | --- |
| `multisig` | `PublicKey` | Parent multisig address |
| `index` | `u64 (bigint)` | Índice global del batch/propuesta marco; no confundir con el índice interno de una pierna. |
| `vaultIndex` | `u8` | Vault index |
| `size` | `u32` | Número de Vault Transactions que contiene el batch. |
| `executedTransactionIndex` | `u32` | Progreso canónico: última transacción interna ejecutada. Cada batch empieza en índice interno `1`. |

### 3.5 `SpendingLimit`
| Field | Type | Description |
| --- | --- | --- |
| `multisig` | `PublicKey` | Parent multisig address |
| `createKey` | `PublicKey` | Seed key for Spending Limit PDA |
| `vaultIndex` | `u8` | Target vault index |
| `mint` | `PublicKey` | SPL Token mint (or `11111...` for SOL) |
| `amount` | `u64 (bigint)` | Spending limit cap |
| `remainingAmount` | `u64 (bigint)` | Remaining allowance for the current period |
| `period` | Enum | `OneTime`, `Day`, `Week`, `Month` |
| `lastReset` | `i64 (bigint)` | Unix timestamp of last allowance reset |
| `members` | `PublicKey[]` | Authorized member keys |
| `destinations` | `PublicKey[]` | Optional whitelist (empty = any recipient) |

---

## 4. Protocol Instructions

> Fuente: [TypeScript instruction reference](https://docs.squads.so/main/development/typescript/instructions)

| Instruction | Purpose | Key Notes |
| --- | --- | --- |
| `multisigCreateV2` | Initialize a new multisig | Replaces deprecated `multisigCreate` |
| `configTransactionCreate` | Update config (members, threshold, timelock, spending limits) | Requires threshold votes |
| `proposalCreate` | Create proposal state account | Tracks votes for a transaction index |
| `proposalApprove` | Cast approval vote | Member needs `Permission.Vote` |
| `proposalReject` | Cast rejection vote | Member needs `Permission.Vote` |
| `proposalCancel` | Cancel a proposal | Also marks stale proposals invalid |
| `vaultTransactionCreate` | Store transaction message for Vault CPI | Associates instruction payload with a transaction index |
| `vaultTransactionExecute` | Execute approved tx via Vault CPI | Member needs `Permission.Execute`; proposal must be `Approved` |
| `batchCreate` | Container setup for multi-instruction batches | Groups multiple transactions under one proposal |
| `batchAddTransaction` | Append transaction to batch | Each sub-transaction added sequentially |
| `spendingLimitCreate` | Define spending limit | Created via `configTransactionCreate` |
| `spendingLimitUse` | Execute transfer under limit | No threshold needed; auto-resets per period |
| `spendingLimitRevoke` | Remove spending limit | Requires config transaction |

---

## 5. Permissions Model

> Fuente: [Accounts reference](https://docs.squads.so/main/development/reference/accounts)

```typescript
// Permission types:
multisig.types.Permission.Proposer  // Can create proposals
multisig.types.Permission.Voter     // Can approve/reject proposals
multisig.types.Permission.Executor  // Can execute approved proposals
multisig.types.Permissions.all()    // All permissions combined
multisig.types.Permissions.fromPermissions([...]) // Specific subset
```

---

## 6. Guides — Code Patterns (Canonical Snippets)

> [!CAUTION]
> Los fragmentos históricos inferiores son orientativos, **no contratos de implementación**. Los nombres de helpers y cuentas se deben tomar de la versión fijada de `@sqds/multisig`; el flujo y los invariantes obligatorios viven en `SOLUTION-ARCHITECTURE.md` y en los contratos registrados de cada `*-implementation.md`.

### 6.1 Crear un Multisig

> Fuente: [Accounts reference](https://docs.squads.so/main/development/reference/accounts)

```typescript
const createKey = Keypair.generate().publicKey;
const [multisigPda] = multisig.getMultisigPda({ createKey });

await multisig.rpc.multisigCreateV2({
  connection, createKey, creator, multisigPda,
  configAuthority: null, timeLock: 0, threshold: 2,
  members: [
    { key: creator.publicKey, permissions: multisig.types.Permissions.all() },
    { key: secondMember, permissions: multisig.types.Permissions.fromPermissions([multisig.types.Permission.Vote]) },
  ],
  rentCollector: null,
});
```

### 6.2 Crear una Propuesta (VaultTransaction + Proposal)

> Fuente: [Create Vault Transaction](https://docs.squads.so/main/development/typescript/instructions/create-vault-transaction)

```typescript
const [vaultPda] = multisig.getVaultPda({ multisigPda, index: 0 });
const multisigInfo = await multisig.accounts.Multisig.fromAccountAddress(connection, multisigPda);
const transactionIndex = multisigInfo.transactionIndex + 1n;

// 1. Create Vault Transaction
await multisig.rpc.vaultTransactionCreate({
  connection, feePayer: creator, multisigPda, transactionIndex,
  creator: creator.publicKey, vaultIndex: 0, ephemeralSigners: 0,
  transactionMessage,
});

// 2. Create Proposal
await multisig.rpc.proposalCreate({
  connection, feePayer: creator, multisigPda, transactionIndex,
  creator: creator.publicKey,
});
```

### 6.3 Votar en una Propuesta

> Fuente: [TypeScript instructions](https://docs.squads.so/main/development/typescript/instructions)

```typescript
// Aprobar
await multisig.rpc.proposalApprove({
  connection, feePayer: memberKeypair, multisigPda,
  transactionIndex, member: memberKeypair.publicKey,
});

// Rechazar
await multisig.rpc.proposalReject({
  connection, feePayer: memberKeypair, multisigPda,
  transactionIndex, member: memberKeypair.publicKey,
});
```

### 6.4 Ejecutar una Propuesta Aprobada

> Fuente: [Execute Vault Transaction](https://docs.squads.so/main/development/typescript/instructions/execute-vault-transaction)

```typescript
await multisig.rpc.vaultTransactionExecute({
  connection, feePayer: executorKeypair, multisigPda,
  transactionIndex, member: executorKeypair.publicKey,
});
```

> [!WARNING]
> - `member` debe tener `Permission.Execute`.
> - Proposal status debe ser `Approved`.
> - Las instrucciones se ejecutan atómicamente vía CPI; si una falla, toda la transacción revierte.

### 6.5 Batch Transactions (Lotes)

> Fuentes: [Create Batch](https://docs.squads.so/main/development/typescript/instructions/create-batch), [Add to Batch](https://docs.squads.so/main/development/typescript/instructions/add-to-batch)

```typescript
// 1. Crear Batch container
await multisig.rpc.batchCreate({
  connection, feePayer: memberKeypair, multisigPda,
  batchIndex: nextIndex, creator: memberKeypair.publicKey, vaultIndex: 0,
});

// 2. Agregar transacción al batch
await multisig.rpc.batchAddTransaction({
  connection, feePayer: memberKeypair, multisigPda,
  batchIndex: nextIndex, transactionIndex: 1n, vaultIndex: 0,
  transactionMessage,
});

// 3. Crear Proposal para el Batch
await multisig.rpc.proposalCreate({
  connection, feePayer: memberKeypair, multisigPda,
  transactionIndex: nextIndex, creator: memberKeypair.publicKey,
});
```

### 6.6 Spending Limits

> Fuente: [Spending limits](https://docs.squads.so/main/navigating-your-squad/settings/spending-limits)

```typescript
await multisig.rpc.spendingLimitUse({
  connection, feePayer: authorizedMemberKeypair, multisigPda,
  member: authorizedMemberKeypair.publicKey,
  spendingLimit: spendingLimitPda,
  mint: SOL_MINT, vaultIndex: 0,
  amount: BigInt(0.5 * LAMPORTS_PER_SOL),
  decimals: 9, destination: recipientPublicKey,
});
```

> Creado via `configTransactionCreate`. Se resetea automáticamente según `period`.

---

## 7. URL Index (Quick Reference)

| Topic | URL |
| --- | --- |
| Welcome | https://docs.squads.so/main |
| TypeScript overview | https://docs.squads.so/main/development/typescript/overview |
| Accounts reference | https://docs.squads.so/main/development/reference/accounts |
| TypeScript instructions | https://docs.squads.so/main/development/typescript/instructions |
| Create Batch | https://docs.squads.so/main/development/typescript/instructions/create-batch |
| Add to Batch | https://docs.squads.so/main/development/typescript/instructions/add-to-batch |
| Create Vault Transaction | https://docs.squads.so/main/development/typescript/instructions/create-vault-transaction |
| Execute Vault Transaction | https://docs.squads.so/main/development/typescript/instructions/execute-vault-transaction |
| Spending Limits | https://docs.squads.so/main/navigating-your-squad/settings/spending-limits |
| GitHub: `@sqds/multisig` | https://github.com/Squads-Protocol/v4 |
