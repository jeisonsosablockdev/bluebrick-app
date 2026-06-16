---
type: RFC
title: STORY- 004 01 Profile Data Model And Wallet Binding
description: STORY- 004 01 Profile Data Model And Wallet Binding - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-004-user-profile-kyc-aml/STORY-004-01-profile-data-model-and-wallet-binding.md
---

# STORY-004-01-profile-data-model-and-wallet-binding

## Metadata
- Epic: `EPIC-004-user-profile-kyc-aml`
- Story ID: `STORY-004-01-profile-data-model-and-wallet-binding`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-24`
- Last Updated: `2026-03-27`

## Context
- Problem:
  No existe un modelo persistente de perfil vinculado a wallet. El modulo actual `/protected/perfil` es principalmente UI mock sin persistencia real.
- Why now:
  Todo el flujo KYC/AML depende de identidad wallet-bound estable y trazable.
- Constraints:
  - Una sola wallet vinculable por perfil (sin merge ni reasignacion).
  - Compatibilidad con auth SIWS y RBAC ya existente.
  - Sin romper flujo actual de autenticacion.
- Affected paths:
  - `db/migrations/*`
  - `lib/db/*`
  - `app/api/protected/*`
  - `app/api/auth/me/route.ts`

## Proposal
- Approach summary:
  Crear modelo de datos canonico para perfil y KYC con llave natural `wallet_public_key` y restricciones de unicidad estrictas.
- Technical design:
  - Tabla `user_profiles`:
    - `wallet_public_key TEXT PRIMARY KEY`
    - `username TEXT UNIQUE NOT NULL`
    - `bio TEXT NOT NULL DEFAULT ''`
    - `avatar_url TEXT NOT NULL DEFAULT ''`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - Tabla `kyc_cases` (1:1 con wallet):
    - `wallet_public_key TEXT PRIMARY KEY REFERENCES user_profiles(wallet_public_key)`
    - `kyc_status TEXT NOT NULL CHECK (kyc_status IN ('not_started','pending','verified','rejected'))`
    - `rejection_reason TEXT NULL`
    - `submitted_at TIMESTAMPTZ NULL`
    - `reviewed_at TIMESTAMPTZ NULL`
    - `reviewed_by_admin_wallet TEXT NULL`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - Upsert seguro por wallet autenticada en endpoints profile.
- Alternatives considered:
  - ID interno autoincremental y wallet como columna secundaria: rechazado (aumenta complejidad de ownership checks).
- Tradeoffs:
  - Wallet como PK simplifica ownership, pero complica casos de recuperacion de wallet (fuera de alcance).

## Critique
- Reviewer(s):
  - `staff-review`
- Critical findings:
1. Asegurar unicidad de `username` case-insensitive (`LOWER(username)` unique index).
2. Evitar exponer campos sensibles en endpoint `GET /api/auth/me`.
3. Definir politica para `rejection_reason` (longitud max y sanitizacion).
- Blocking concerns:
  Ninguno.

## Resolution
- Final approach after critique:
  Se mantiene wallet como PK y se agrega indice unico case-insensitive para `username`.
- Changes accepted:
  - Restriccion `username` normalizada.
  - Limite de longitud para `rejection_reason`.
- Changes rejected (with rationale):
  - Multi-wallet por usuario en esta fase (explicitamente fuera de alcance).

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-24`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobado como base de identidad para todo EPIC-004.

## Status
- Current status: `implemented`
- Next action:
  Continuar con stories de AML y panel de cumplimiento (`STORY-004-04` y `STORY-004-05`).
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Validacion de payload profile (`username`, `bio`, `avatar_url`).
- Integration tests:
  - Upsert y lectura de perfil por wallet autenticada.
  - Rechazo de escritura cuando wallet no coincide con sesion.
- Devnet validation (if applicable):
  - N/A (flujo off-chain).
- Responsive QA (if applicable):
  - N/A en esta story.

## Traceability
- Related issue(s): `EPIC-004`
- Related PR(s): `#55`
- Final commit hash(es): `467ee31`
