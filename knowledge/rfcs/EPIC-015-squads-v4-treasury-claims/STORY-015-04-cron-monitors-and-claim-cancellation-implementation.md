---
type: ImplementationSpec
title: STORY-015-04 Cron Monitors & Claim Cancellation Implementation Spec
description: Especificación técnica atómica de implementación para los endpoints de cronjobs de caducidad (48h y 12M) y la ruta API de cancelación de reclamaciones por el usuario.
tags: [specs, cron, claims, cancellation, api, tdd]
timestamp: 2026-07-25T19:54:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-04-cron-monitors-and-claim-cancellation-implementation.md
---

# STORY-015-04 Cron Monitors & Claim Cancellation Implementation Spec

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-04`
- Atomic Branch: `SPEC/jaymusicmachine-BRI-8-s04-cron-cancellation`
- Status: `draft`
- Owner: `jaymusicmachine`

## 1. 4-Layer Architecture Mapping

### Layer 1: Presentation Layer
- Botón **"Cancelar Reclamación"** en la interfaz de reclamaciones del inversor para registros en `CLAIM_REQUESTED`.

### Layer 2: Application/Consumption Layer
- **`app/api/cron/claims-expiry/route.ts`**: Tarea programada que marca como `EXPIRED` las reclamaciones en `CLAIM_REQUESTED` tras 48 horas.
- **`app/api/cron/compliance-ttl/route.ts`**: Tarea programada que marca como `RETAINED_COMPLIANCE` los fondos sin reclamar tras 12 meses.
- **`app/api/claims/[claimId]/cancel/route.ts`**: Endpoint REST de cancelación activa por el usuario.

### Layer 3: Domain/Pipelines/Services Layer
- **`lib/claims/compliance-monitor.ts`**: Queries SQL e invocado por los endpoints de cronjobs.

### Layer 4: Infrastructure Layer
- Autenticación por cabecera `Authorization: Bearer ${CRON_SECRET}`.

---

## 2. TDD Strategy (Test-Driven Development)

### Unit & Integration Test File
- `tests/api/cron-and-cancel-endpoints.test.ts`

### Test Commands
```bash
pnpm test tests/api/cron-and-cancel-endpoints.test.ts
```

### Assertions & Test Criteria
1. **RED (Fallo Inicial)**:
   - Llamar a los endpoints de cron sin `CRON_SECRET` retorna `401 UNAUTHORIZED`.
   - Cancelar una reclamación ya ejecutada (`EXECUTED`) retorna `400 INVALID_CLAIM_STATE`.
2. **GREEN (Paso)**:
   - `POST /api/cron/claims-expiry` expira correctamente los registros > 48h.
   - `POST /api/claims/[claimId]/cancel` cambia el estado a `CANCELED` y libera el lock de la wallet.

---

## 3. Definition of Done (DoD)
- [ ] Endpoints `/api/cron/*` creados y protegidos con token de seguridad.
- [ ] Endpoint `/api/claims/[claimId]/cancel` probando transiciones válidas.
- [ ] Test `tests/api/cron-and-cancel-endpoints.test.ts` en verde.
