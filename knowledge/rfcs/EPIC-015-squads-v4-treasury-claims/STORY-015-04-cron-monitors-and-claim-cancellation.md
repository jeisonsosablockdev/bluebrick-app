---
type: RFC
title: STORY-015-04 Cron Monitors & User Claim Cancellation
description: Especificación técnica para la automatización periódica de cronjobs (Expiración de Cotizaciones 48h y Compliance TTL 12 Meses) y cancelación por el usuario.
tags: [rfcs, cron, compliance, claims, cancellation, automation]
timestamp: 2026-07-25T18:24:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-04-cron-monitors-and-claim-cancellation.md
---

# STORY-015-04 Cron Monitors & Cancelación de Solicitudes por el Usuario

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-04-cron-monitors-and-claim-cancellation`
- Status: `draft`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Created: `2026-07-25`
- Last Updated: `2026-07-25`

## Contexto Alineado con la Arquitectura (BRI-7 / EPIC-014 SOP)

Siguiendo estrictamente las especificaciones del SOP de Distribución de BRIDS ([`EPIC-014-distribution-system-sop.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/guides/EPIC-014-distribution-system-sop.md)):

1. **Monitoreo de Expiración de Cotizaciones (48 Horas)**:
   - *Norma de Arquitectura*: Al cotizar un reclamo de rendimiento (Etapa 6), se establece un TTL de 48 horas (`quote_expires_at`).
   - *Frecuencia del Cronjob*: Invocación programada periódica (diaria o según el ciclo de refresco de Vercel Cron) que ejecuta `runQuoteExpiryMonitor()`.
2. **Monitoreo de Retenciones de Compliance (12 Meses)**:
   - *Norma de Arquitectura*: Un cronjob diario (Etapa 8) ejecuta `runComplianceHoldTtlMonitor()`. Cualquier reclamo retenido en `COMPLIANCE_HOLD` durante más de 12 meses transiciona a `clawback_to_treasury`.
3. **Cancelación Manual por el Usuario**:
   - Permite a un inversor en su panel `/protected/rentas` cancelar una solicitud en estado `CLAIM_REQUESTED` antes de que el lote sea empaquetado y firmado por el comité multisig.

---

## ⚙️ Especificación Técnica de los Endpoints API

### 1. Endpoint Expiración de Cotizaciones (`/api/cron/claims-expiry`)
- **Ruta**: `GET /api/cron/claims-expiry`
- **Autenticación**: Cabecera `Authorization: Bearer CRON_SECRET`.
- **Lógica**: Invoca `runQuoteExpiryMonitor()`. Transiciona reclamos expirados (`quote_expires_at < NOW()`) de `CLAIM_REQUESTED` a `EXPIRED`/`AVAILABLE`.

### 2. Endpoint Compliance TTL 12 Meses (`/api/cron/compliance-ttl`)
- **Ruta**: `GET /api/cron/compliance-ttl`
- **Autenticación**: Cabecera `Authorization: Bearer CRON_SECRET`.
- **Lógica**: Invoca `runComplianceHoldTtlMonitor()`. Audita retenciones de 12 meses y ejecuta el retorno de fondos a la reserva de tesorería (*clawback*).

### 3. Endpoint Cancelación de Reclamación por Usuario (`/api/claims/[claimId]/cancel`)
- **Ruta**: `POST /api/claims/[claimId]/cancel`
- **Autenticación**: Firma criptográfica SIWS de la wallet titular.
- **Lógica**: Cancela una solicitud activa en `CLAIM_REQUESTED` devolviendo el saldo al balance disponible del usuario, siempre que el lote no haya sido aprobado en Squads.

---

## Status
- **Current status**: `draft`
- **Exit criteria**:
  - [ ] Endpoints `/api/cron/claims-expiry` y `/api/cron/compliance-ttl` creados y protegidos con `CRON_SECRET`.
  - [ ] Endpoint `/api/claims/[claimId]/cancel` implementado con validación SIWS.

## Traceability
- Related issue(s): BRI-8 (basado en normas de BRI-7 / EPIC-014 SOP)
- Related PR(s): TBD
- Final commit hash(es): TBD
