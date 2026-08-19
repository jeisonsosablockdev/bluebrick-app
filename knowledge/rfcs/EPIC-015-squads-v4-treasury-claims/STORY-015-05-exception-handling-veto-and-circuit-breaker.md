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
- **Post-seal:** La root es inmutable on-chain. No existe instrucción `revoke_leaf` ni PDA de revocación. El mecanismo post-seal es: circuit breaker → `pause_run` (propuesta Squads) → `cancel_run` → nuevo run.

### 3. Freno de Emergencia (`Emergency Circuit Breaker`) — Defensa de Dos Capas
- Botón destacado en el monitor de ejecución para pausar de inmediato el worker desatendido **(capa local)**.
- Detiene el despacho de los sublotes restantes del bot propio.
- **Capa on-chain (obligatoria):** El endpoint debe iniciar automáticamente una propuesta Squads para `pause_run`, que es la **única** garantía de que un cranker externo o comprometido no pueda ejecutar `settle_claim`. Sin `pause_run` on-chain, la pausa local no tiene efecto fuera del bot propio.
- Los sublotes ya confirmados en Devnet se marcan como `executed`; los pendientes quedan como `partially_failed` o `paused` para auditoría.

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
