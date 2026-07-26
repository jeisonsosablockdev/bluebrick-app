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

### 2. Veto Granular de Ítems Individuales (`Item Veto`)
- En la tabla de beneficiarios, el administrador puede vetar una fila individual antes de autorizar la propuesta marco.
- La reclamación pasa a estado `compliance_hold` o `disputed`.
- Al vetar un ítem, el backend reconstruye el **Árbol de Merkle de la corrida**, excluyendo la hoja del ítem vetado y emitiendo una nueva raíz criptográfica (`merkleRoot`).

### 3. Freno de Emergencia (`Emergency Circuit Breaker`)
- Botón destacado en el monitor de ejecución para pausar de inmediato el worker desatendido.
- Detiene el despacho de los sublotes de 20 restantes.
- Los sublotes ya confirmados en Devnet se marcan como `executed`; los pendientes quedan como `partially_failed` o `paused` para auditoría.

### 4. Modelo de Amenazas Cero-Confianza (Paranoia Security Shield)

| Vector de Ataque Potencial | Análisis de Vulnerabilidad | Mecanismo de Mitigación Criptográfica (Escudo) |
| :--- | :--- | :--- |
| **1. Alteración Maliciosa en Postgres DB** (Un atacante modifica una wallet o monto en la DB tras aprobar la propuesta). | **IMPOSIBLE**. | **Ancla de Merkle en Squads PDA**: En el momento de la firma multisig, la `merkleRoot` se graba inmutablemente en Solana. Si 1 solo bit cambia en Postgres, el Árbol de Merkle no coincide y Solana aborta la transacción. |
| **2. Inyección de Sublote por Bot Ejecutor** (El worker desatendido intenta enviar un pago a su propia wallet). | **IMPOSIBLE**. | **Restricción de la Vault PDA de Squads v4**: La PDA de la Vault solo ejecuta instrucciones cuya tupla exacta `(destino, monto)` fue aprobada dentro del Batch de Squads por el comité. El bot NO TIENE AUTORIDAD para cambiar destinatarios. |
| **3. Inyección por API Directa de Override** (Un usuario o hacker altera su wallet llamando a la API backend). | **IMPOSIBLE**. | **Verificación Dual SIWS + Voto Multisig**: Exige firma criptográfica de la wallet original (SIWS) + estado `PENDING` obligatorio + aprobación formal del comité en `/admin/compliance`. |
| **4. Ataque de Reintegración o Duplicación (Replay Attack)**. | **IMPOSIBLE**. | **Indexación de Transacción Única e Invariable**: Squads v4 asigna un `transactionIndex` incremental de 64 bits en la PDA de la propuesta, impidiendo que una transacción sea ejecutada más de una vez. |

## Status
- **Current status**: `draft`
- **Exit criteria**:
  - [ ] Auditoría de seguridad sin hallazgos críticos.
  - [ ] 4 Escudos criptográficos verificados en pruebas de integración.

## Traceability
- Related issue(s): BRI-8
- Related PR(s): TBD
- Final commit hash(es): TBD
