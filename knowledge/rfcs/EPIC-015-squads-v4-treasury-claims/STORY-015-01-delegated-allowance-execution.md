---
type: RFC
title: STORY-015-01 Delegated Allowance Execution & Squads SDK Integration
description: Especificación técnica para la integración del SDK @sqds/multisig en Solana Devnet con el modelo Delegated Allowance.
tags: [rfcs, solana, squads, sdk, allowance]
timestamp: 2026-07-25T10:27:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-01-delegated-allowance-execution.md
---

# STORY-015-01-delegated-allowance-execution

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-01-delegated-allowance-execution`
- Status: `draft`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Created: `2026-07-25`
- Last Updated: `2026-07-25`

## Context
- **Problem**: Las firmas de transacciones en Squads están actualmente simuladas sin interactuar con la red Devnet real. Además, firmar manualmente 1,000 sublotes por corrida es operacionalmente inviable.
- **Why now**: Es necesario habilitar la ejecución real on-chain en Solana Devnet con una experiencia fluida para el comité.
- **Constraints**: El límite de transacción, cuentas y compute units debe medirse por mensaje serializado y simulación; no existe un máximo protocolario fijo de 20 transferencias. Regla `@solana/kit` para RPC/cliente, con adaptador aislado para el SDK de Squads.
- **Affected paths**: `package.json`, `lib/solana-kit/compat/squads.ts`, `lib/squads/squads-batch.ts`.

## Proposal
- **Approach summary**: Instalar `@sqds/multisig`. El comité crea y aprueba **una sola Propuesta Marco** en Squads por el presupuesto total de la corrida `runId`. Una vez aprobada on-chain, el worker en `squads-batch.ts` procesa desatendidamente los sublotes de 20 en 20 usando la wallet ejecutora autorizada.
- **Technical design**:
  - `createSquadsBatch(...)`: Crea el batch, sus Vault Transactions y la Proposal con los índices globales/ internos correctos.
  - `executeSquadsTransaction(...)`: Ejecuta solo una transacción cuyo Proposal esté `Approved` y cuyo executor tenga permiso `Executor`; el tamaño del plan lo decide el planificador.
- **Invariante Cero-Confianza (Whitelist por Candy Machine & Umbral Multisig)**:
  1. Únicamente las wallets que poseen/compraron NFTs válidos en la Candy Machine aprobada (`approved_candy_machine_address`) son elegibles por defecto en el snapshot.
  2. Ningún cambio de wallet de pago se aplica sin pasar por una solicitud en estado `PENDING` y requerir aprobación expresa en `/admin/compliance`.
  3. Ninguna transferencia sale de la Vault a menos que la Propuesta Marco supere el umbral estricto de firmas multisig ($N$ de $M$) con Squads v4 en Solana.
- **Alternatives considered**: Firmas manuales de 1,000 sublotes (Rechazada por inviabilidad UX). Reclamación pura del usuario por Merkle Tree (Rechazada por mayor complejidad de contratos custom en esta fase).
- **Tradeoffs**: Requiere mantener una wallet ejecutora del bot de BRIDS con fondos suficientes para pagar los fees de gas de las transacciones.

## Critique
- **Reviewer(s)**: `architect`, `solana`, `security`
- **Critical findings**:
  1. La wallet ejecutora autorizada solo debe poder disponer del saldo asignado expresamente a la corrida marco.
- **Blocking concerns**: Ninguno.

## Resolution
- **Final approach after critique**: Batch de Squads con mensaje inmutable, umbral N-de-M y reconciliación por índices/firma; `runId` es correlación de aplicación, no autoridad on-chain.
- **Changes accepted**: Límites estrictos de presupuesto por propuesta marco.

## Decision
- **Decision**: `rejected-and-reopened`
- **Decision date**: `2026-07-25`
- **Decision owner**: `jaymusicmachine`
- **Approval notes**: La decisión previa queda invalidada porque confundía batch con allowance, asumía 20 transferencias y fijaba un program ID no verificado.

## Status
- **Current status**: `in-review`
- **Next action**: Crear suite de tests TDD en `tests/lib/squads-batch.test.ts`.
- **Exit criteria**:
  - [ ] Tests en verde.
  - [ ] Transacción de prueba confirmada en Solana Devnet.

## Test and Validation Plan
- **Unit tests**: `tests/lib/squads-batch.test.ts`
- **Integration tests**: Simulación de creación y despacho de sublotes de 20 transferencias.
- **Devnet validation**: Confirmación del hash de transacción y saldos ATA en Solana Devnet Explorer.

## Traceability
- Related issue(s): BRI-8
- Related PR(s): TBD
- Final commit hash(es): TBD
