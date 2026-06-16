---
type: ADR
title: Rotation Lifecycle Spec (STORY-006-04)
description: Implementation reference for NFT authority rotation/revocation lifecycle — backend lifecycle, admin endpoints, on-chain operations, and future UI/admin integration plan
tags: [architecture, nft, authority, rotation, revocation, multisig, squads, devnet]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rotation-spec.md
---

# Rotation Lifecycle Spec (STORY-006-04)

## 1. Objetivo
Documentar el estado real del lifecycle de rotación/revocación de autoridades críticas NFT, qué ya está implementado, qué falta, y cómo llevarlo a un flujo operable desde UI/admin en siguientes iteraciones.

Este documento está pensado como referencia de implementación futura.

## 2. Estado Actual (Resumen Ejecutivo)

### 2.1 Implementado
- Backend lifecycle para autoridades:
  - `transfer_delegate`
  - `appdata_authority`
- Operaciones soportadas:
  - `rotate`
  - `revoke`
  - `emergency_rotate`
- Endpoints admin protegidos por SIWS:
  - `POST /api/admin/core-candy-machine/authorities/prepare`
  - `POST /api/admin/core-candy-machine/authorities/submit`
- Migración BD: `017_authority_lifecycle_registry.sql`
- Librería core: `lib/core-authority-lifecycle.ts`
- Pruebas unitarias y de API

### 2.2 Pendiente / Futuro
- UI Admin para prepare → sign → submit
- Integración Squads multisig (proposalId validation)
- Sync from chain (backfill legacy)
- Auditoría completa y rate limits admin
- Pruebas E2E wallet-connected con Synpress

## 3. Modelo de Registro de Roles

| Role | On-chain target | Registry key |
| --- | --- | --- |
| `transfer_delegate` | Collection `PermanentTransferDelegate` plugin authority | (`role`, `collection_address`) |
| `appdata_authority` | Collection `updateAuthority` used by AppData writes | (`role`, `collection_address`) |

## 4. Operaciones Permitidas
- `rotate(role, new_authority)`
- `revoke(role)` (sentinel authority: `11111111111111111111111111111111`)
- `emergency_rotate(role, new_authority)`

## 5. Cadena de Confianza
- `proposer` identity validated from request evidence and optional env allowlist (`SQUADS_PROPOSER_ALLOWLIST`).
- `approverSigners[]` are validated public keys and optionally restricted by `SQUADS_APPROVER_ALLOWLIST`.
- `executor` must be included in approvers and optionally restricted by `SQUADS_EXECUTOR_ALLOWLIST`.
- Quorum rules:
  - Regular ops: `SQUADS_MULTISIG_THRESHOLD` (default `2`).
  - Emergency ops: `SQUADS_EMERGENCY_MULTISIG_THRESHOLD` (default `max(regular+1, 3)`).

## 6. Invariants Añadidos
- [x] `authority_version` is strictly monotonic (`n -> n+1`).
- [x] Non-emergency cooldown enforced via `AUTHORITY_ROTATION_COOLDOWN_SECONDS`.
- [x] Emergency ops bypass cooldown only with elevated quorum.
- [x] Every prepared/submit operation emits auditable record (`authority_audit_events`) with proposal metadata and final signature.
- [x] Registry state changes are collection-scoped and conflict-checked on submit.

## 7. API Endpoints

### 7.1 Prepare
`POST /api/admin/core-candy-machine/authorities/prepare`
- Body: `{ role: "transfer_delegate" | "appdata_authority", collectionAddress: string, operation: "rotate" | "revoke" | "emergency_rotate", newAuthority?: string }`
- Auth: SIWS admin session
- Returns: `{ transactionBase64: string, proposalId: string, authorityVersion: number }`

### 7.2 Submit
`POST /api/admin/core-candy-machine/authorities/submit`
- Body: `{ signedTransactionBase64: string, proposalId: string }`
- Auth: SIWS admin session
- Returns: `{ signature: string, authorityVersion: number, auditEventId: string }`

### 7.3 Registry (Future)
`GET /api/admin/core-candy-machine/authorities/registry`
- Query: `collectionAddress`
- Returns: current registry state per role

### 7.4 Audit (Future)
`GET /api/admin/core-candy-machine/authorities/audit`
- Query: `collectionAddress`, `role?`, `limit?`
- Returns: paginated audit events

## 8. Devnet Evidence
- Real devnet transactions executed for rotate/revoke/emergency_rotate
- Signatures recorded in `authority_audit_events`
- Explorer links attached in PR #86

## 9. Plan de Implementación Sugerido (2 Sprints)

### Sprint 1
1. Implement `GET /registry` and `GET /audit`.
2. Implement minimal admin screen `prepare -> sign -> submit`.
3. Integrate explorer links by signature.
4. Cover with Playwright happy path and recoverable errors.

### Sprint 2
1. Integrate on-chain/API Squads validation by `proposalId`.
2. Implement `sync-from-chain` for legacy backfill.
3. Add operational guardrails (idempotency and admin rate limits).
4. Complete wallet-connected E2E tests with Synpress.

## 10. Commit Hashes y Trazabilidad Git

Estado final:
- PR: `#86` (`feat(nft): authority lifecycle rotation/revocation + devnet evidence`)
- Branch origen: `nft/program-delegate-rotation-revocation`
- Base branch destino: `develop`

Commits story:
- Branch commit principal: `154377a` (`feat(nft): implement authority lifecycle rotation and revocation`)
- Recheck commit (empty): `3742822` (`chore(nft): trigger pr policy recheck`)
- Merge commit final en `develop`: `3943c72b001fb4d49c9f6306090deaf584112e9b` (squash merge PR #86)

Comandos de trazabilidad (usar al cerrar commits):
```bash
# Ver commits relevantes por endpoint/servicio
git log --oneline -- app/api/admin/core-candy-machine/authorities lib/core-authority-lifecycle.ts

# Ver commits de migración
git log --oneline -- db/migrations/017_authority_lifecycle_registry.sql

# Ver commits de pruebas
git log --oneline -- tests/lib/core-authority-lifecycle.test.ts tests/api/admin-core-candy-machine-authorities-prepare-route.test.ts tests/api/admin-core-candy-machine-authorities-submit-route.test.ts

# Ver commits de documentación de la story
git log --oneline -- docs/rotation-spec.md docs/devnet-proof.md docs/features/feature-nft-authority-lifecycle-rotation-revocation.md docs/rfcs/EPIC-006-deploy-freeze-delegate-inheritance
```

## 11. Validaciones Ejecutadas
- `npm run lint` ✅
- `npm run typecheck` ✅
- `npx vitest run tests/lib/core-authority-lifecycle.test.ts tests/api/admin-core-candy-machine-authorities-prepare-route.test.ts tests/api/admin-core-candy-machine-authorities-submit-route.test.ts` ✅
- `npm run validate` ✅