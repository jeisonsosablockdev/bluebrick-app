---
type: RFC
title: STORY- 006 03 Nft Economic Data Appdata Plugin
description: STORY- 006 03 Nft Economic Data Appdata Plugin - migrated from knowledge/
tags: [rfcs]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-006-deploy-freeze-delegate-inheritance/STORY-006-03-nft-economic-data-appdata-plugin.md
---

# STORY-006-03-nft-economic-data-appdata-plugin

## Metadata
- Epic: `EPIC-006-deploy-freeze-delegate-inheritance`
- Story ID: `STORY-006-03-nft-economic-data-appdata-plugin`
- Status: `implemented` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-03-28`
- Last Updated: `2026-04-02`

## Context
- Problem:
  No existe un estándar on-chain para lógica económica por NFT.
- Why now:
  Se requiere fuente de verdad auditable para distribución y elegibilidad.
- Constraints:
  - Usar `AppData` de Metaplex Core.
  - Sin cambios en UI (solo lógica).
  - Escritura autorizada server-side y control de autoridad vía Squads multisig.
  - Este control multisig aplica a AppData; freeze operativo del usuario se rige por la política de STORY-006-01.
  - Cualquier cambio económico sensible debe heredar mismo marco de seguridad documental/multisig definido para operaciones de recovery.

## Proposal
- Approach summary:
  Adoptar `AppData` como contenedor económico canónico por NFT.
- Technical design:
  1. `AppData` con autoridad de escritura dedicada.
  2. Esquema económico `v1` validado server-side.
  3. Uso directo como source of truth para microservicio de distribución.
  4. Actualizaciones administrativas auditadas.

- Proposed AppData schema (v1):
  ```json
  {
    "revenue_share_bps": 2500,
    "yield_bps": 1200,
    "yield_mode": "cap",
    "locked_at": 1711584000,
    "eligible_from": 1714176000,
    "earning_start_ts": 1714176000,
    "distribution_enabled": true,
    "economic_version": "v1",
    "last_updated_at": 1714177000,
    "updated_by": "admin_or_program"
  }
  ```

- JSON Schema (machine-readable, v1):
  ```json
  {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://andruia/rfc/epic-006/appdata-economic-v1.schema.json",
    "title": "NFT Economic AppData v1",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "revenue_share_bps",
      "yield_bps",
      "yield_mode",
      "distribution_enabled",
      "economic_version",
      "last_updated_at",
      "updated_by"
    ],
    "properties": {
      "revenue_share_bps": { "type": "integer", "minimum": 0, "maximum": 10000 },
      "yield_bps": { "type": "integer", "minimum": 0, "maximum": 10000 },
      "yield_mode": { "type": "string", "enum": ["cap", "linear"] },
      "locked_at": { "type": "integer", "minimum": 0 },
      "eligible_from": { "type": "integer", "minimum": 0 },
      "earning_start_ts": { "type": "integer", "minimum": 0 },
      "distribution_enabled": { "type": "boolean" },
      "economic_version": { "type": "string", "pattern": "^v[0-9]+$" },
      "last_updated_at": { "type": "integer", "minimum": 0 },
      "updated_by": { "type": "string", "minLength": 3, "maxLength": 128 }
    }
  }
  ```

## Critique
- Reviewer(s):
  - `Blockchain review`
  - `Data/Finance review`
  - `Security review`
- Critical findings:
1. Cerrar semántica exacta de `yield_mode`.
2. Definir política de upgrades para `economic_version`.
3. Definir matriz de autoridad por campo sensible.
- Blocking concerns:
  - Bloqueo previo por multisig Squads: **resuelto**.
  - Bloqueo vigente: aprobación final del contrato de semántica (`yield_mode`) y matriz de autorización.
  - Bloqueo vigente: alinear definitivamente con el rediseño de lifecycle de delegados (rotación/revocación).

## Resolution
- Final approach after critique:
  Se mantiene `AppData` como estándar económico y se responde la crítica con decisiones operativas:
  - `yield_mode` queda acotado inicialmente a catálogo controlado (`cap`, `linear`) con rechazo de valores fuera de catálogo.
  - `economic_version` adopta versionado explícito y compatible hacia atrás (`v1`, `v2`, ...), con parser por versión.
  - Matriz de autoridad: campos críticos (`revenue_share_bps`, `yield_bps`, `yield_mode`, `distribution_enabled`) requieren flujo autorizado por backend + política multisig Squads.
- Changes accepted:
  - `AppData` como mecanismo estándar de datos económicos.
  - Datos económicos on-chain como fuente de verdad del sistema de distribución.
  - Auditoría obligatoria en cada update (`last_updated_at`, `updated_by`, `economic_version`).
- Changes rejected (with rationale):
  - Escritura directa desde cliente: rechazada por seguridad.
  - Mantener datos económicos solo off-chain: rechazada por trazabilidad insuficiente.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-29`
- Decision owner: `staff-engineer`
- Approval notes:
  Aprobado. La inclusión de un JSON Schema versionado y la observabilidad vía webhooks son claves.

## Status
- Current status: `implemented`
- Next action:
  Integrar en release train del EPIC-006 y continuar con STORY-006-04.
- Exit criteria:
- [x] Integración Squads multisig disponible
- [x] Crítica principal incorporada en rediseño de seguridad
- [x] Implementación completada en código
- [x] Validación devnet con evidencia de transacciones

## Test and Validation Plan
- Unit tests:
  - Validación de esquema `AppData v1`.
  - Validación de catálogo `yield_mode`.
  - Validación de autorización por tipo de campo.
- Integration tests:
  - Escritura inicial de `AppData` en mint.
  - Update autorizado y auditado de parámetros económicos.
  - Rechazo de updates no autorizados o inválidos.
  - Rechazo de payloads que no cumplan JSON Schema v1.
- Devnet validation:
  - Mint real con `AppData`.
  - Update real de `AppData`.
  - Verificación on-chain de estado final por asset.
  - Reconciliación de eventos on-chain vía Helius Webhooks hacia base de datos.

## Observability Requirements
- Capturar eventos on-chain relacionados a freeze, unfreeze y transfer delegado mediante Helius Webhooks.
- Reconciliar estado de activos y estado económico en backend de forma asíncrona.
- Registrar evidencia de conciliación (event_id, signature, processed_at, result).

## Traceability
- Related issue(s): `EPIC-006 / STORY-006-03`
- Related PR(s):
  - `#82` `feat(shared): implement STORY-006-03 economic appdata plugin flow`
- Final commit hash(es):
  - `d179106114aa614c860c96c9b067137e5f076210` (merge commit PR #82)

## Official Sources
- Metaplex Core: https://developers.metaplex.com/core
- Metaplex Core Plugins: https://developers.metaplex.com/core/plugins
