---
type: RFC
title: STORY-015-05 Exception Handling, Granular Item Veto, Emergency Circuit Breaker & Paranoia Threat Model
description: Especificación técnica para el rechazo global de propuestas, veto individual de ítems, freno de emergencia y Modelo de Amenazas de Cero Confianza (Paranoia Security Shield).
tags: [rfcs, governance, veto, circuit-breaker, merkle-tree, solana, security, zero-trust, threat-model]
timestamp: 2026-07-25T11:12:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-05-exception-handling-veto-and-circuit-breaker.md
---

# STORY-015-05-exception-handling-veto-and-circuit-breaker

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-05-exception-handling-veto-and-circuit-breaker`
- Status: `draft`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Created: `2026-07-25`
- Last Updated: `2026-07-25`

## Context
- **Problem**: Si el comité detecta una discrepancia antes de votar o durante la ejecución desatendida, necesita mecanismos explícitos para rechazar la propuesta marco, vetar un ítem individual, detener la ejecución de emergencia y garantizar bajo un **Modelo de Amenazas de Cero Confianza (Modo Paranoico)** que ningún atacante interno o externo pueda inyectar datos o alterar wallets sin pasar por la firma multisig de Squads.
- **Why now**: Cumplir con las normas de seguridad más estrictas (`security-policy.md`), eliminando cualquier punto único de falla o vector de inyección de datos.
- **Constraints**: 100% verificabilidad criptográfica en Solana Devnet.

## Technical Specification

### 1. Mecanismo de Rechazo Global (`proposalReject`)
- Cualquier signatario del comité puede rechazar la Propuesta Marco en `/admin/treasury/squads`.
- Emite `proposalReject` mediante el SDK `@sqds/multisig` en Solana Devnet.
- Libera todas las reclamaciones del lote a estado `queued_for_payout` o `draft` y registra `BATCH_REJECTED` en `claim_or_payout_events`.

### 2. Veto Granular de Ítems Individuales (`Item Veto`) — Pre-Seal Only
- En la tabla de beneficiarios, el administrador puede vetar una fila individual **antes de sellar** el payout run (`seal_run`).
- La reclamación pasa a estado `compliance_hold` o `disputed`.
- Al vetar un ítem, el backend reconstruye el **Árbol de Merkle de la corrida**, excluyendo la hoja del ítem vetado y emitiendo una nueva raíz criptográfica (`merkleRoot`). Se invalida la propuesta previa y se genera un nuevo ciclo (snapshot → attestation → proposal).
- **Post-seal:** La root es inmutable on-chain. No existe instrucción `revoke_leaf` ni PDA de revocación. El mecanismo post-seal es: circuit breaker → `pause_run` con firma de emergencia previamente autorizada por Squads → `cancel_run` N-de-M → nuevo run.

### 3. Freno de Emergencia (`Emergency Circuit Breaker`) — Defensa de Dos Capas con Firma de Pausa Delegada
- Botón destacado en el monitor de ejecución para pausar de inmediato el worker desatendido **(capa local)**.
- Detiene el despacho de los sublotes restantes del bot propio en ~50ms.
- **Capa on-chain (Fast-Pause inmediata, sin umbral):** una propuesta Squads N-de-M configura una clave pública `emergency_pause_authority` en `TreasuryPolicy`. Cualquier persona o servicio puede retransmitir `pause_run`, pero debe adjuntar la firma Ed25519 vigente de esa clave sobre el mensaje canónico de pausa. Una Vault PDA de Squads no puede emitir una firma suelta: solo firma al ejecutar una propuesta, por lo que no se finge un “1-de-M” directo.
- La firma solo es válida durante un máximo de 300 segundos, está ligada a policy, run, programa, versión de clave y `pause_nonce`, y queda registrada con `paused_at`/`paused_by`. La clave privada vive fuera del backend y su rotación requiere Vault N-de-M.
- **Asimetría de Seguridad:** La clave delegada solo puede pausar. Reanudar (`resume_run`), cancelar (`cancel_run`), retirar fondos o cambiar/rotar la clave exige estrictamente una propuesta multisig N-de-M de la Vault.
- **Antireplay:** `pause_run` exige la verificación Ed25519 inmediatamente anterior en la transacción, `expires_at` vigente y `pause_nonce` exacto. Al pausar consume/incrementa el nonce; una firma anterior no puede reutilizarse tras reanudar.
- Los pagos ya confirmados con `ClaimReceipt` son inmutables; los pendientes quedan congelados on-chain.

### 4. Modelo de Amenazas Cero-Confianza (Paranoia Security Shield)

| Vector de Ataque Potencial | Análisis de Vulnerabilidad | Mecanismo de Mitigación Criptográfica (Escudo) |
| :--- | :--- | :--- |
| **1. Alteración en Postgres tras aprobar** | **Mitigable, no imposible** | El mensaje de Vault aprobado es inmutable; la aplicación debe comparar hash/root antes de ejecutar. Solo un programa de settlement propio puede hacer que Solana verifique proofs y aborte on-chain. |
| **2. Inyección por bot ejecutor** | **Mitigable** | Squads ejecuta el mensaje aprobado; el bot necesita permiso `Executor`. El servicio debe validar proposal, mensaje, presupuesto y circuit breaker antes de enviar. |
| **3. Override no autorizado** | **Mitigable** | Schema + ownership + estado PENDING + propuesta Squads ejecutada; SIWS por sí solo no sustituye gobernanza ni prueba de ejecución. |
| **4. Replay/duplicación** | **Mitigable** | `transactionIndex` y estado on-chain impiden re-ejecutar la misma transacción; DB debe usar idempotency keys y reconciliación por firma, nunca inventar reversals. |

## Status
- **Current status**: `draft`
- **Exit criteria**:
  - [ ] Auditoría de seguridad sin hallazgos críticos.
  - [ ] 4 Escudos criptográficos verificados en pruebas de integración.

## Traceability
- Related issue(s): BRI-8
- Related PR(s): TBD
- Final commit hash(es): TBD
