---
type: RFC
title: STORY- 005 04 Transaction Pipelines Purchase And Admin Migration
description: STORY- 005 04 Transaction Pipelines Purchase And Admin Migration - migrated from knowledge/
tags: [rfcs]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-005-full-migration-from-solana-web3-js-to-solana-kit/STORY-005-04-transaction-pipelines-purchase-and-admin-migration.md
---

# STORY-005-04-transaction-pipelines-purchase-and-admin-migration

## Metadata
- Epic: `EPIC-005-full-migration-from-solana-web3-js-to-solana-kit`
- Story ID: `STORY-005-04-transaction-pipelines-purchase-and-admin-migration`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-02`
- Last Updated: `2026-04-02`

## Context
- Problem:
  Los pipelines de transacciones de purchase/admin y reconciliacion usan primitives `web3.js` en frontend y backend (deserializacion, validacion payer, envio y confirmacion).
- Why now:
  Es la porcion de mayor complejidad funcional; requiere foundation consolidada y auth estable para minimizar riesgo.
- Constraints:
  - No cambiar UX de compra/mint/admin.
  - Mantener validaciones de seguridad de payer/signer y reglas server-side.
  - Mantener flujos criticos operando en devnet con pruebas reales.
- Affected paths:
  - `components/marketplace/PurchaseCta.tsx`
  - `components/admin/core-candy-machine-panel.tsx`
  - `components/admin/metaplex-core-mint-panel.tsx`
  - `lib/purchase-service.ts`
  - `lib/metaplex-core-admin.ts`
  - `lib/core-candy-machine-admin.ts`
  - `lib/core-authority-lifecycle.ts`
  - `lib/core-candy-machine-snapshot-service.ts`
  - `app/api/admin/mint-orchestrator/jobs/[jobId]/reconcile/route.ts`

## Proposal
- Approach summary:
  Migrar serializacion/transacciones/RPC de los pipelines core a `@solana/kit`, usando compatibilidad temporal minima en bordes donde exista dependencia de terceros.
- Technical design:
  - Reemplazar parseo directo de `VersionedTransaction` por utilidades foundation.
  - Migrar validaciones de payer/signer/address a primitives kit.
  - Migrar envio/confirmacion y consultas de estado a cliente RPC foundation.
  - Mantener contrato de API (payload base64/signatures) para no romper frontend ni jobs.
  - Ejecutar rollout por flujo:
    1. Purchase pipeline
    2. Admin mint pipeline
    3. Reconciliation/observer pipeline
- Alternatives considered:
  - Migrar todos los pipelines simultaneamente: rechazado por blast radius alto.
- Tradeoffs:
  - Rollout secuencial incrementa tiempo total, pero permite aislamiento de regresiones y rollback controlado.

## Critique
- Reviewer(s):
  - `jaymusicmachine`
- Critical findings:
1. Asegurar equivalencia de serializacion y validacion de firmas entre stacks.
2. Preservar checks de payer/signer/authority sin relajar seguridad.
3. Mantener evidencia on-chain de devnet para cada flujo critico migrado.
- Blocking concerns:
  Ninguno.

## Resolution
- Final approach after critique:
  Se aprueba migracion por subflujos con validacion incremental y evidencia devnet.
- Changes accepted:
  - Secuencia purchase → admin mint → reconciliation.
  - Contratos de API estables durante migracion.
- Changes rejected (with rationale):
  - Cambios de UI o reshaping de APIs en esta historia (rechazado por riesgo de regresion externa).

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-02`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Historia aprobada con enfoque de seguridad y rollout controlado por flujo.

## Status
- Current status: `approved`
- Next action:
  Ejecutar `STORY-005-05` para cleanup final y remocion total de dependencia.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Validacion de parseo/signature checks y helpers transaccionales.
- Integration tests:
  - Purchase/admin/reconcile end-to-end a nivel API.
- Devnet validation (if applicable):
  - Confirmacion de firmas reales y estado on-chain para purchase/mint/reconcile.
- Responsive QA (if applicable):
  - Verificar UI de purchase/admin en `320/375/768/1024` si hay impacto visual.

## Traceability
- Related issue(s): `EPIC-005`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
