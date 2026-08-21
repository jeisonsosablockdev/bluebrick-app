---
type: Operation
title: BRIDS Devnet Squads v4 Governance and Treasury Multisig
description: Especificación canónica, cuentas on-chain, miembros, umbrales y procedimientos operativos para el Multisig Squads v4 desplegado en Solana Devnet.
tags: [operations, squads, multisig, treasury, governance, devnet, solana, zero-trust]
timestamp: 2026-08-20T08:20:00Z
resource: https://explorer.solana.com/tx/418eESq3jDrz4M7cFKUKoSN1qG9M2Gt22Jqk7RsphnCb2XTmR42ngW1PV9KiSnpTech6Jo9hy2K2LwHeg4YfZVvP?cluster=devnet
---

# BRIDS Devnet Squads v4: Governance & Treasury Multisig

Documento canónico de registro y operación del Squad multifirma desplegado en **Solana Devnet** para la administración de gobernanza, resguardo de tesorería y dispersión de recompensas del protocolo **BRIDS**.

---

## 1. Ficha Técnica y Cuentas On-Chain

| Parámetro / Cuenta | Valor / Dirección On-Chain | Enlace de Explorador |
| :--- | :--- | :--- |
| **Nombre del Squad** | `BRIDS Devnet Gov and Treasury` | — |
| **Descripción / Memo** | `Governance, Treasury and rewards distribution for BRIDS project.` | — |
| **Cluster** | `Solana Devnet` (`https://api.devnet.solana.com`) | — |
| **Programa On-Chain** | Squads Protocol v4 (`SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`) | [Ver Programa](https://explorer.solana.com/address/SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf?cluster=devnet) |
| **Multisig PDA** | `rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD` | [Ver Multisig PDA](https://explorer.solana.com/address/rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD?cluster=devnet) |
| **Vault PDA (Index 0)** | `D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB` | [Ver Vault PDA](https://explorer.solana.com/address/D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB?cluster=devnet) |
| **Create Key** | `AZGhDBuomd6cRf1LZoUNfk4fWn6HpoZjmp8dzZibZK7c` | [Ver Create Key](https://explorer.solana.com/address/AZGhDBuomd6cRf1LZoUNfk4fWn6HpoZjmp8dzZibZK7c?cluster=devnet) |
| **Config Authority** | `null` (Controlado 100% por el propio Multisig) | — |
| **Umbral (*Threshold*)** | **2 de 4 firmas requeridas** ($2/4$) | — |
| **Time Lock** | `0 segundos` (Ejecución inmediata tras alcanzar quórum) | — |
| **Transacción de Despliegue** | `418eESq3jDrz4M7cFKUKoSN1qG9M2Gt22Jqk7RsphnCb2XTmR42ngW1PV9KiSnpTech6Jo9hy2K2LwHeg4YfZVvP` | [Ver Tx en Solana Explorer](https://explorer.solana.com/tx/418eESq3jDrz4M7cFKUKoSN1qG9M2Gt22Jqk7RsphnCb2XTmR42ngW1PV9KiSnpTech6Jo9hy2K2LwHeg4YfZVvP?cluster=devnet) |

---

## 2. Registro de Miembros y Permisos

El Squad cuenta con **4 miembros activos** con permisos completos de propuesta, votación y ejecución (`Permissions.all()` con máscara de bits `7`):

| # | Dirección Solana (Public Key) | Rol / Identificador | Permisos On-Chain |
| :-: | :--- | :--- | :--- |
| **1** | `AdNNTBSMy4yndiSNVmgEBTkJJuXLBrb7PKFWCdEf8Kxi` | Firmante de Gobernanza 1 | `Full (Propose, Vote, Execute)` |
| **2** | `D4gcC27mX7qMqMGaszHdEjMLE3poC4jcpxm5nsGKPpRF` | Firmante de Gobernanza 2 | `Full (Propose, Vote, Execute)` |
| **3** | `DhJ5pUo513rUARqDTy9W7AXaG4ET9ryX78iHxUP4YBgU` | Phantom Wallet (Admin / Operador) | `Full (Propose, Vote, Execute)` |
| **4** | `3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd` | CLI Wallet (Desarrollo & Automatización) | `Full (Propose, Vote, Execute)` |

---

## 3. Acceso e Interacción

### A. Interfaz Web de Recuperación / Backup (UI)
Para interactuar visualmente con las propuestas, votaciones o ejecuciones:
* **URL:** [https://backup.app.squads.so](https://backup.app.squads.so)
* **Conexión:** Conectar wallet (ej. Phantom en modo Devnet).
* **Multisig Address:** `rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD`
* **Enlace Directo:** `https://backup.app.squads.so/#/multisig/rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD`

---

### B. Integración vía `@solana/kit` Compat (`squads.ts`)

```typescript
import { deriveSquadsPdasFromCreateKey } from '@/lib/solana-kit/compat/squads';

const { squadsMultisigPda, squadsVaultPda } = await deriveSquadsPdasFromCreateKey(
  'AZGhDBuomd6cRf1LZoUNfk4fWn6HpoZjmp8dzZibZK7c',
  0n,
  0
);
// squadsMultisigPda: "rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD"
// squadsVaultPda:    "D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB"
```

---

## 4. Propuesta de Setup e Integración con Programa `payout_settlement`

Para activar la gobernanza de dispersión de fondos sobre el programa [`payout_settlement`](https://explorer.solana.com/address/HLp7YXKZZ8uPuzwN3CtuDxtgYoWhc5Fb1FHj5bHEe9zE?cluster=devnet):

1. **Instrucción CPI:** `payout_settlement::initialize_policy(vault_index=0, attester_a, attester_b, emergency_pause)`.
2. **Firmante Autorizado:** Squads Vault PDA `D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB`.
3. **Cuenta Creada:** `TreasuryPolicy` PDA (`[b"treasury_policy", multisig_pda]`).
4. **Builder de Infraestructura:** [`squads-proposals.ts`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/apps/web/src/features/staking-distribution/infrastructure/squads-proposals.ts).
