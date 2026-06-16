---
type: RFC
title: STORY- 012 02 Tracking Dashboard And Retention
description: STORY- 012 02 Tracking Dashboard And Retention - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-012-referral-marketing-system-in-user-dashboard/STORY-012-02-tracking-dashboard-and-retention.md
---

# STORY-012-02-tracking-dashboard-and-retention

## Metadata
- Epic: `EPIC-012-referral-marketing-system-in-user-dashboard`
- Story ID: `STORY-012-02-tracking-dashboard-and-retention`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-05-02`
- Last Updated: `2026-05-02`

## Context
- Problem:
  El referente necesita ver a quién ha invitado y el estado de sus recompensas para fomentar la retención y la gamificación.
- Technical design (Draft):
  - Tabla de referidos en el dashboard con identidad ofuscada.
  - Notificaciones in-app cuando una recompensa queda acumulada o lista para distribución admin.
  - Estados visibles alineados al backend: `joined`, `kyc_verified`, `nft_purchase_confirmed`, `pending_settlement`, `accrued`, `pending_admin_distribution`, `paid`, `clawbacked`, `rejected`, `risk_hold`.

## Critique (Staff Engineer)
- **Reviewer(s)**: `Gemini Code Assist (Staff Engineer)`
- **Critical findings**:
  1. **Ofuscación Estricta de Identidad**: Si la tabla de seguimiento muestra a los invitados, JAMÁS debemos mostrar la wallet completa ni el correo electrónico del invitado al referente, por razones de GDPR y privacidad Web3. Se debe estandarizar un formato como `Wallet 3e89...d0f1` o seudónimos generados aleatoriamente (ej. "Anon Badger").
  2. **Paginación Mandatoria**: Aunque sea un MVP, un ataque Sybil o una campaña muy exitosa podría generar miles de registros de "Pendiente" para un solo usuario. El endpoint del backend DEBE implementar cursor-based pagination o limit+offset desde el día 1.
  3. **Estados Claros de Recompensa**: El frontend debe manejar los estados de forma determinista. Sugiero: `joined` (registrado), `kyc_verified` (KYC superado), `qualifying_event` (evento completado), `reward_claimed` (recompensa liquidada).
  4. **[STRICT] Vector de Ataque por Correlación On-Chain**: Si el dashboard muestra al referente la fecha/hora exacta en la que el invitado completó el evento (ej. "Compró a las 14:03:02"), el referente puede usar Solscan para buscar transacciones en ese segundo exacto y des-ofuscar la wallet del invitado. Las fechas mostradas al referente deben ser truncadas al día (ej. "Completado el 14 de Mayo") o tener un *jitter* (retraso aleatorio).

- **Blocking concerns**:
  - La query a la base de datos debe truncar u ofuscar la información PII del invitado *en el backend*, no depender de que el frontend oculte los datos.
  - Restringir la granularidad temporal de los eventos expuestos al referente.

## Resolution
- Final approach after critique:
  - La UI mostrará estados derivados del ledger real de recompensas, no un modelo abstracto de `claimable`.
  - El referente verá cuándo un invitado compró NFTs elegibles, cuándo la recompensa quedó acumulada en DB y cuándo quedó pendiente de distribución admin.
  - La granularidad temporal expuesta al referente se truncará al día para evitar correlación on-chain.
- Changes accepted:
  - Identidad ofuscada en backend.
  - Paginación obligatoria.
  - Estados visibles alineados a `accrued` y `pending_admin_distribution`.
  - Timestamps truncados al día.
- Changes rejected (with rationale):
  - Exponer horas exactas o timestamps precisos, porque facilitan desanonimización.
  - Mantener `claimable` como estado UI principal, porque el payout no es automático en este modelo.

## Decision
- Decision: `approved`
- Decision date: `2026-05-02`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action:
  Iniciar desarrollo del endpoint `GET /api/users/me/referrals` con paginación y ofuscación de UI.

## Traceability
- Related issue(s): `BRI-16`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
