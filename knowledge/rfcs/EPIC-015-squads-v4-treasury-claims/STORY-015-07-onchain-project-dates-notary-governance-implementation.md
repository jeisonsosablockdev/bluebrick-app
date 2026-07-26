---
type: ImplementationSpec
title: STORY-015-07 On-Chain Project Dates Notary Governance Implementation Spec
description: Especificación técnica atómica de implementación para la lectura directa del PDA Notario en el motor de cálculo, prohibición de campos de fecha en API HTTP y sincronización de caché en Postgres.
tags: [specs, distribution-engine, notary, api-security, read-model, tdd]
timestamp: 2026-07-25T19:54:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-07-onchain-project-dates-notary-governance-implementation.md
---

# STORY-015-07 On-Chain Project Dates Notary Governance Implementation Spec

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-07`
- Atomic Branch: `SPEC/jaymusicmachine-BRI-8-s07-notary-engine-integration`
- Status: `draft`
- Owner: `jaymusicmachine`

## 1. 4-Layer Architecture Mapping

### Layer 1: Presentation Layer
- Botón **"Solicitar Cambio de Fecha"** en `/admin/collections/[id]` que dispara la modal de motivo y solicitud multisig.

### Layer 2: Application/Consumption Layer
- **`app/api/admin/collections/[id]/date-change-request/route.ts`**: Registra la solicitud `PENDING_MULTISIG` en `/admin/notifications`.
- **`lib/admin/collection-patch-payload.ts`**: Inmutabilidad explícita. Rechaza peticiones HTTP con campos de fechas con `400 IMMUTABLE_PROJECT_DATE_FIELD`.

### Layer 3: Domain/Pipelines/Services Layer
- **`lib/distributions/distribution-engine.ts`**:
  - Consulta `fetchProjectConfigPDAOnChain` directamente vía Solana RPC.
  - Ignora los valores de fechas provenientes de Postgres DB.

### Layer 4: Infrastructure Layer
- Postgres DB configurado como réplica de lectura informativa (*Read-Model Cache*).

---

## 2. TDD Strategy (Test-Driven Development)

### Unit & Integration Test File
- `tests/lib/distribution-engine-pda-read.test.ts`

### Test Commands
```bash
pnpm test tests/lib/distribution-engine-pda-read.test.ts
```

### Assertions & Test Criteria
1. **RED (Fallo Inicial)**:
   - Alterar manualmente el campo `project_start_at` en Postgres no altera el resultado del cálculo en `distribution-engine.ts`.
   - Enviar `project_start_at` en un payload PATCH a la API de colecciones retorna `400 IMMUTABLE_PROJECT_DATE_FIELD`.
2. **GREEN (Paso)**:
   - `calculateDistributionPreparation` obtiene las fechas directamente desde Solana Devnet RPC y realiza la distribución ponderada en tiempo exacta.

---

## 3. Definition of Done (DoD)
- [ ] `distribution-engine.ts` probado con lectura directa RPC en verde.
- [ ] Validador `collection-patch-payload.ts` rechazando mutaciones de fechas.
- [ ] Test `tests/lib/distribution-engine-pda-read.test.ts` en verde.
