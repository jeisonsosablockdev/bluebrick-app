---
type: RFC
title: STORY-015-01 Treasury Settlement Authorization & Squads SDK Integration
description: Especificación técnica para que Squads apruebe/fondee un payout run y un programa Solana liquide únicamente leaves verificadas.
tags: [rfcs, solana, squads, sdk, settlement, merkle, escrow]
timestamp: 2026-07-25T10:27:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-01-delegated-allowance-execution.md
---

# STORY-015-01-treasury-settlement-authorization

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-01-delegated-allowance-execution`
- Status: `draft`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Created: `2026-07-25`
- Last Updated: `2026-07-26`

## Context
- **Problem**: Las firmas de transacciones en Squads están simuladas y el diseño previo permitía que un worker seleccionara transferencias después de una aprobación marco. Eso no prueba on-chain que un monto, destinatario y claim pertenezcan exactamente a la corrida aprobada.
- **Why now**: Es necesario habilitar la ejecución real on-chain en Solana Devnet con una experiencia fluida para el comité.
- **Constraints**: Ningún agente recibe autoridad de Vault ni puede modificar una leaf tras el voto. Cada payout debe validarse on-chain contra una root sellada y debe ser imposible liquidarlo dos veces. Se usa `@solana/kit` en clientes/adaptadores y `@sqds/multisig` sólo en el borde de compatibilidad.
- **Affected paths**: `package.json`, `lib/solana-kit/compat/squads.ts`, `lib/payouts/*`, `programs/payout_settlement/*`.

## Proposal
- **Approach summary**: Dos servicios independientes calculan el mismo snapshot bloqueado. Si sus root/hash/total/count/reglas coinciden, el comité aprueba una propuesta Squads que, atómicamente, crea `PayoutRun`, transfiere el total al escrow PDA y sella el run. Un cranker no privilegiado liquida hojas individuales presentando proofs; el programa valida todo y registra un receipt PDA no reutilizable.
- **Technical design**:
  - `initialize_run + transfer_to_escrow + seal_run`: tres instrucciones dentro de una Vault Transaction Squads aprobada; `seal_run` exige que el balance de escrow coincida con el total comprometido.
  - `settle_claim(proof, leaf)`: instrucción permissionless que sólo puede transferir al ATA/monto/mint incluidos en una leaf válida y no usada.
- **Invariante Cero-Confianza (elegibilidad, root y umbral multisig)**:
  1. Únicamente las wallets que poseen/compraron NFTs válidos en la Candy Machine aprobada (`approved_candy_machine_address`) son elegibles por defecto en el snapshot.
  2. Ningún cambio de wallet de pago se aplica sin pasar por una solicitud en estado `PENDING` y requerir aprobación expresa en `/admin/compliance`.
  3. Ningún pago sale del escrow a menos que la root haya sido sellada dentro de una propuesta Squads con umbral $N$ de $M$; ningún cranker puede alterar la leaf.
- **Alternatives considered**: Batch con leg directa (rechazada: no verifica proof por payout); Merkle auditora (rechazada: detecta pero no evita); firmas manuales de 1,000 pagos (rechazada: inviabilidad UX).
- **Tradeoffs**: Requiere desarrollar y auditar un programa de settlement y mantener pruebas/proofs por leaf. A cambio, elimina la autoridad de pago del agente de despacho.

## Critique
- **Reviewer(s)**: `architect`, `solana`, `security`
- **Critical findings**:
  1. La autoridad debe terminar en un escrow PDA, no en una wallet ejecutora.
  2. La validación on-chain garantiza pertenencia al root aprobado, no la legitimidad off-chain de la claim; por eso son obligatorios snapshot bloqueado y doble attestation.
- **Blocking concerns**: El Authority Manifest y el formato exacto de `claimId` binario deben aprobarse antes del primer SPEC de código.

## Resolution
- **Final approach after critique**: `PayoutRun` + escrow + root/proof/receipt on-chain; `runId` se hashea para derivar la PDA, pero los parámetros de pago son la leaf canónica aprobada.
- **Changes accepted**: Squads se limita a aprobar/fondear/sellar; el cranker carece de privilegios de tesorería.

## Decision
- **Decision**: `rejected-and-reopened`
- **Decision date**: `2026-07-26`
- **Decision owner**: `jaymusicmachine`
- **Approval notes**: La decisión previa queda invalidada porque confundía batch con allowance, asumía 20 transferencias y dejaba una raíz auditora sin enforcement. La resolución aprobable es `payout_settlement` con escrow, proof y receipt PDA.

## Status
- **Current status**: `in-review`
- **Next action**: Aprobar Authority Manifest y contrato binario de leaf; crear suite TDD en `tests/lib/payout-snapshot.test.ts` y `tests/programs/payout-settlement.test.ts`.
- **Exit criteria**:
  - [ ] Tests en verde.
- [ ] Setup de `PayoutRun` y settlement de una proof válida confirmados en Solana Devnet.

## Test and Validation Plan
- **Unit tests**: snapshot, root, proof, receipt duplicado y estado de run.
- **Integration tests**: propuesta Squads de setup, escrow sellado, proof válida/inválida, pause/cancel y refund de no reclamados.
- **Devnet validation**: proposal, `PayoutRun`, escrow ATA, receipt PDA, signature de settlement y saldos antes/después.

## Traceability
- Related issue(s): BRI-8
- Related PR(s): TBD
- Final commit hash(es): TBD
