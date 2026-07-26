---
type: RFC
title: STORY-015-03 Payout Overrides Governance Flow & Case Number Association
description: Especificación técnica para la gobernanza en 2 pasos de cambio de wallet con vinculación obligatoria de Número de Caso de Compliance.
tags: [rfcs, governance, security, claims, overrides, compliance, case-number]
timestamp: 2026-07-25T11:07:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-03-payout-overrides-governance.md
---

# STORY-015-03-payout-overrides-governance

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-03-payout-overrides-governance`
- Status: `draft`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Created: `2026-07-25`
- Last Updated: `2026-07-25`

## Context
- **Problem**: La función `submitPayoutOverride` aplica los cambios de wallet de forma inmediata, lo cual representa una brecha de seguridad contra secuestros de llaves o insider threats. Además, cuando se revisa un caso en `/admin/compliance` y se asigna una nueva wallet de pago a fondos retenidos, el sistema debe vincular un **Número de Caso / Ticket de Soporte** (`case_number`) para auditar la decisión antes de liberar los fondos hacia la tesorería.
- **Why now**: Garantizar trazabilidad legal y administrativa vinculando cada reasignación de wallet a un expediente de investigación auditado.
- **Constraints**: Migración SQL rastreable en `db/migrations/043_payout_overrides_governance.sql`.
- **Affected paths**: `db/migrations/`, `lib/claims/claim-flow.ts`, `app/api/claims/[claimId]/override/route.ts`, `components/admin/compliance-console.tsx`.

## Technical Specification

### 1. Modelo de Datos (`distribution_payout_overrides`)
```sql
CREATE TABLE IF NOT EXISTS distribution_payout_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id TEXT NOT NULL REFERENCES distribution_claims(id),
  case_number TEXT NOT NULL, -- Número de Caso / Ticket de Soporte (ej. CASE-2026-0891)
  original_wallet TEXT NOT NULL,
  requested_wallet TEXT NOT NULL, -- Nueva dirección de destino para la dispersión
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  requested_by TEXT NOT NULL,
  reviewed_by TEXT,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2. Flujo de Resolución e Inclusión en la Dispersión
1. **Asignación en `/admin/compliance`**: Tras revisar el expediente, el oficial de cumplimiento asigna la **nueva wallet de destino** e ingresa el **Número de Caso** (ej. `CASE-2026-0891`).
2. **Estado `PENDING`**: La solicitud queda registrada en estado `PENDING`. La reclamación retenida permanece en `compliance_hold`.
3. **Aprobación del Comité (`APPROVED`)**: Al ser aprobada la resolución por el comité:
   - El `payout_wallet` de la reclamación en `distribution_claims` se actualiza con la nueva wallet.
   - El estado de la reclamación cambia de `compliance_hold` a `queued_for_payout`.
   - La reclamación queda lista para ser incluida en la siguiente Propuesta Marco de Squads v4.
   - Se emite el evento auditado `CLAIM_OVERRIDE_APPROVED` asociando el `case_number` en `claim_or_payout_events`.

## Status
- **Current status**: `draft`
- **Exit criteria**:
  - [ ] Tabla `distribution_payout_overrides` migrada con la columna `case_number`.
  - [ ] Interfaz de resolución en `/admin/compliance` permitiendo ingresar la nueva wallet y el `case_number`.
  - [ ] Liberación automática de `compliance_hold` a `queued_for_payout` al aprobar la resolución.

## Traceability
- Related issue(s): BRI-8
- Related PR(s): TBD
- Final commit hash(es): TBD
