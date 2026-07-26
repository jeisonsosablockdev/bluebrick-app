---
type: ImplementationSpec
title: STORY-015-03 Payout Overrides Governance Flow Implementation Spec
description: Especificación técnica atómica de implementación para la cola de aprobación en 2 pasos de cambio de wallet de pago con vinculación obligatoria de case_number.
tags: [specs, compliance, payout-overrides, governance, db, tdd]
timestamp: 2026-07-25T19:54:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-03-payout-overrides-governance-implementation.md
---

# STORY-015-03 Payout Overrides Governance Flow Implementation Spec

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-03`
- Atomic Branch: `SPEC/jaymusicmachine-BRI-8-s03-payout-overrides`
- Status: `draft`
- Owner: `jaymusicmachine`

## 1. 4-Layer Architecture Mapping

### Layer 1: Presentation Layer
- **`components/admin/compliance-console.tsx`**: Modal/formulario **"Resolución de Caso & Reasignación de Wallet"** con inputs `case_number` y `requested_wallet`.

### Layer 2: Application/Consumption Layer
- **`app/api/admin/compliance/overrides/route.ts`**: Endpoints GET (listar pendientes) y POST (crear solicitud `PENDING`).
- **`app/api/admin/compliance/overrides/[id]/approve/route.ts`**: Endpoint POST para aprobación multisig/admin.

### Layer 3: Domain/Pipelines/Services Layer
- **`lib/claims/payout-override-service.ts`**: Lógica de negocio que impide usar la nueva wallet hasta que el estado sea `APPROVED`.

### Layer 4: Infrastructure Layer
- **DB Migration (`scripts/db/migrations/*`)**: Adición de la columna `case_number VARCHAR(64)` en `distribution_payout_overrides`.

---

## 2. TDD Strategy (Test-Driven Development)

### Unit & Integration Test File
- `tests/lib/payout-override-governance.test.ts`

### Test Commands
```bash
pnpm test tests/lib/payout-override-governance.test.ts
```

### Assertions & Test Criteria
1. **RED (Fallo Inicial)**:
   - Intentar registrar un override sin `case_number` arroja `ERR_CASE_NUMBER_REQUIRED`.
   - Intentar transferir dinero a una wallet con override `PENDING` dispara `ERR_OVERRIDE_NOT_APPROVED`.
2. **GREEN (Paso)**:
   - El override se guarda como `PENDING` con el `case_number`.
   - Tras llamar al endpoint de aprobación, transiciona a `APPROVED` y permite la dispersión.

---

## 3. Definition of Done (DoD)
- [ ] Migración SQL de `case_number` ejecutada y validada.
- [ ] Endpoints API `/api/admin/compliance/overrides` implementados con esquemas Zod.
- [ ] Test `tests/lib/payout-override-governance.test.ts` en verde.
