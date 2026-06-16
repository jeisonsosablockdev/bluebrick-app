---
type: ADR
title: Rotation Spec
description: Rotation Spec - migrated from docs/
tags: [architecture]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/architecture/rotation-spec.md
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
- Persistencia y auditoría:
  - tabla `authority_registry`
  - tabla `authority_audit_events`
- Validación devnet real con evidencia on-chain (Alchemy devnet) completada para `appdata_authority`.

### 2.2 No implementado (o pendiente de hardening)
- UI administrativa para operar el flujo `prepare -> sign -> submit`.
- Verificación criptográfica on-chain de la evidencia Squads (hoy se valida estructura/evidencia declarativa, no prueba on-chain de proposal execution).
- Endpoints de lectura para consultar estado/historial (`GET registry`, `GET audit`).
- Backfill automático de `authority_registry` desde estado on-chain histórico para colecciones legacy.

## 3. Flujo Actual (Backend)

### 3.1 Secuencia funcional
1. Admin autenticado (SIWS) invoca `prepare`.
2. Backend valida:
   - rol y operación
   - estructura multisig (`proposalId`, `proposer`, `executor`, `approverSigners`)
   - umbral regular/emergencia
   - cooldown
   - versionado monotónico de autoridad
3. Backend construye transacción y devuelve `transactionBase64`.
4. Cliente (o script) firma la transacción con la wallet correspondiente.
5. Se envía a `submit`.
6. Backend:
   - valida payer esperado
   - envía y confirma en devnet
   - actualiza `authority_registry`
   - marca auditoría `submitted`.

## 4. Endpoints Implementados

## 4.1 `POST /api/admin/core-candy-machine/authorities/prepare`

Autenticación:
- Requiere sesión SIWS `admin` (`getRequestRole`).

Body:
```json
{
  "collectionAddress": "Base58Pubkey",
  "role": "transfer_delegate | appdata_authority",
  "operation": "rotate | revoke | emergency_rotate",
  "newAuthority": "Base58Pubkey (obligatorio para rotate/emergency_rotate)",
  "multisig": {
    "proposalId": "string",
    "proposer": "Base58Pubkey",
    "executor": "Base58Pubkey",
    "approverSigners": ["Base58Pubkey", "Base58Pubkey"],
    "reason": "string opcional",
    "requestedAt": "ISO timestamp opcional"
  }
}
```

Respuesta exitosa (resumen):
```json
{
  "network": "devnet",
  "operationId": "uuid",
  "role": "appdata_authority",
  "operation": "emergency_rotate",
  "collectionAddress": "Base58Pubkey",
  "currentAuthority": "Base58Pubkey",
  "targetAuthority": "Base58Pubkey",
  "authorityVersion": 1,
  "nextAuthorityVersion": 2,
  "requiredThreshold": 3,
  "approvalCount": 3,
  "cooldownBypassed": true,
  "cooldownRemainingSeconds": 0,
  "multisig": { "...": "..." },
  "preparedAt": "ISO",
  "transactions": [
    {
      "kind": "authority-emergency-rotate-appdata-authority",
      "label": "emergency_rotate appdata_authority",
      "operationId": "uuid",
      "transactionBase64": "..."
    }
  ]
}
```

Errores comunes:
- `403` Forbidden (no admin SIWS).
- `400` request inválido.
- `4xx` validación de negocio (cooldown, threshold, payer, rol/op inválido, etc).
- `500` error inesperado.

## 4.2 `POST /api/admin/core-candy-machine/authorities/submit`

Autenticación:
- Requiere sesión SIWS `admin`.

Body:
```json
{
  "operationId": "uuid",
  "signedTransactions": [
    {
      "kind": "authority-emergency-rotate-appdata-authority",
      "operationId": "uuid",
      "transactionBase64": "SIGNED_BASE64"
    }
  ]
}
```

Respuesta exitosa:
```json
{
  "submittedAt": "ISO",
  "operation": {
    "operationId": "uuid",
    "role": "appdata_authority",
    "operation": "rotate",
    "collectionAddress": "Base58Pubkey",
    "authorityVersion": 3,
    "authorityPublicKey": "Base58Pubkey",
    "submittedAt": "ISO",
    "signatures": [
      {
        "kind": "authority-rotate-appdata-authority",
        "operationId": "uuid",
        "signature": "tx_signature"
      }
    ]
  }
}
```

Errores recuperables:
- `409` + `{ recoverable: true, code: "CONFIRMATION_TIMEOUT" | "BLOCKHASH_EXPIRED" }`

## 4.3 Endpoints propuestos (pendientes, recomendados para siguiente iteración)

### `GET /api/admin/core-candy-machine/authorities/registry`

Objetivo:
- Consultar el estado actual de autoridad por colección/rol.

Query params sugeridos:
- `collectionAddress` (opcional)
- `role` (`transfer_delegate | appdata_authority`, opcional)

Respuesta sugerida:
```json
{
  "items": [
    {
      "collectionAddress": "Base58Pubkey",
      "role": "appdata_authority",
      "authorityPublicKey": "Base58Pubkey",
      "authorityVersion": 3,
      "updatedAt": "ISO",
      "updatedBy": "Base58Pubkey | system",
      "lastOperationId": "uuid"
    }
  ]
}
```

### `GET /api/admin/core-candy-machine/authorities/audit`

Objetivo:
- Consultar histórico auditable de operaciones de lifecycle.

Query params sugeridos:
- `collectionAddress` (opcional)
- `role` (`transfer_delegate | appdata_authority`, opcional)
- `status` (`prepared | submitted | failed`, opcional)
- `limit` (default 50)
- `cursor` (paginación)

Respuesta sugerida:
```json
{
  "items": [
    {
      "id": "uuid",
      "operation": "rotate",
      "role": "appdata_authority",
      "collectionAddress": "Base58Pubkey",
      "previousAuthority": "Base58Pubkey",
      "newAuthority": "Base58Pubkey",
      "previousVersion": 2,
      "newVersion": 3,
      "status": "submitted",
      "signature": "tx_signature",
      "multisig": { "...": "..." },
      "preparedAt": "ISO",
      "submittedAt": "ISO"
    }
  ],
  "nextCursor": "string | null"
}
```

## 5. Modelo de Datos (DB)

Migración:
- `db/migrations/017_authority_lifecycle_registry.sql`

Tablas:
- `authority_registry`:
  - estado actual por `(role, collection_address)`
  - `authority_pubkey`
  - `authority_version` monotónico
  - `updated_by`, `updated_at`, `last_operation_id`
- `authority_audit_events`:
  - evento por operación (`id`)
  - previous/new authority y versión
  - evidencia multisig declarada
  - thresholds / cooldown flags
  - `status`: `prepared | submitted | failed`
  - `signature`, timestamps

## 6. Variables de Entorno Relevantes

- Bootstrapping/authority:
  - `SQUADS_TRANSFER_AUTHORITY`
  - `SQUADS_APPDATA_AUTHORITY` (fallback a transfer si no está)
- Policy:
  - `SQUADS_MULTISIG_THRESHOLD` (default 2)
  - `SQUADS_EMERGENCY_MULTISIG_THRESHOLD` (default `max(regular+1, 3)`)
  - `AUTHORITY_ROTATION_COOLDOWN_SECONDS` (default 21600)
- Allowlists opcionales:
  - `SQUADS_PROPOSER_ALLOWLIST`
  - `SQUADS_APPROVER_ALLOWLIST`
  - `SQUADS_EXECUTOR_ALLOWLIST`
- Infra:
  - `DATABASE_URL`
  - `SOLANA_RPC_URL` / `NEXT_PUBLIC_SOLANA_RPC` (devnet only)

## 7. Evidencia Devnet (ya ejecutada)

Fuente detallada:
- `docs/devnet-proof.md` sección `EPIC-006 STORY-006-04 Proof (On-chain Authority Lifecycle)`.

Run principal (Alchemy devnet):
- RPC: `https://solana-devnet.g.alchemy.com/v2/0yIenKKNLWTTAWxKRcUvB`
- Collection proof: `DZ7sRMPFCPm5SFeEAc7JN8LQPRtcfi1JFor4QuWRvR1F`
- Signatures:
  - Create collection: `3mHGgtnoDyzzS89fGEpaKgY6oWPEruniRffBn6VkbfADU5L6i7YyTVj3ArHbKBZBsWKp5ZPrfYiFGpCGxsBHwxxi`
  - `emergency_rotate`: `DWJkjKQeaeXUXAJdXHmWtZjmsHdqmRcTyGRSHZ5wWyA7Aa1EnNZMwq3kWMmYebfQE8BQxQzZZz2e6QbBcZWcsXg`
  - funding temp authority: `5gKJwVDA7Z81p95uY2fW5rQWjKx3oazoSYMzXPqkZXqDB5Y3Xwiq7Xq8QJSxw3ux9Qvw8noLutaVzYqvbuRZHDNF`
  - `rotate` restore: `38enfrc4UXg3s7WEBzoeAsx29tRChFmuVZhvWGGEibnbs7k6Nw1tERv8imma9iDgh4idFEe7xJcN4SznFDzsDBy`

## 8. Lista de Archivos (creados/modificados)

## 8.1 Creados (story)
- `app/api/admin/core-candy-machine/authorities/prepare/route.ts`
- `app/api/admin/core-candy-machine/authorities/submit/route.ts`
- `db/migrations/017_authority_lifecycle_registry.sql`
- `lib/core-authority-lifecycle.ts`
- `tests/lib/core-authority-lifecycle.test.ts`
- `tests/api/admin-core-candy-machine-authorities-prepare-route.test.ts`
- `tests/api/admin-core-candy-machine-authorities-submit-route.test.ts`
- `docs/features/feature-nft-authority-lifecycle-rotation-revocation.md`
- `scripts/devnet-authority-lifecycle-proof.ts`
- `docs/rotation-spec.md`

## 8.2 Modificados (story + documentación de gobierno)
- `docs/auth-flow.md`
- `docs/session-model.md`
- `docs/authority-model.md`
- `docs/nft-spec.md`
- `docs/devnet-proof.md`
- `docs/rfcs/EPIC-006-deploy-freeze-delegate-inheritance/README.md`
- `docs/rfcs/EPIC-006-deploy-freeze-delegate-inheritance/STORY-006-04-onchain-delegate-rotation-revocation.md`

## 9. Qué Falta y Cómo Implementarlo

## 9.1 UI Admin (pendiente)
Objetivo:
- Operar lifecycle sin CLI.

Propuesta:
1. Crear vista admin `Authority Lifecycle` en `/app/admin`.
2. Formulario:
   - collection
   - role
   - operation
   - newAuthority
   - evidencia multisig (proposalId, proposer, executor, approvers)
3. Botón `Prepare`:
   - llama endpoint `prepare`
   - muestra resumen de policy (`threshold`, `cooldown`, `nextVersion`)
4. Firma wallet:
   - decodifica `transactionBase64`
   - firma con wallet adapter
5. Botón `Submit`:
   - envía tx firmada a endpoint `submit`
   - muestra signature + explorer link + resultado persistido
6. Historial:
   - agregar endpoints `GET` para `authority_audit_events` y `authority_registry`.

## 9.2 Hardening Squads (pendiente)
Objetivo:
- No confiar solo en evidencia declarativa.

Propuesta:
1. Integrar lectura on-chain/API Squads por `proposalId`.
2. Verificar:
   - proposal existe
   - estado ejecutable/ejecutada
   - signers reales y threshold
   - target instruction coincide con la operación solicitada
3. Rechazar `prepare` si la proposal no pasa validación.

## 9.3 Backfill para colecciones legacy (pendiente)
Problema:
- `authority_registry` se bootstrapea por env si no existe registro.
- Colecciones históricas pueden no coincidir con ese bootstrap.

Propuesta:
1. Script/endpoint de `sync-from-chain` por colección/rol.
2. Leer autoridad real on-chain y crear/ajustar registry.
3. Marcar auditoría de backfill con trazabilidad.

## 9.4 Plan de implementación sugerido (2 sprints)

Sprint 1:
1. Implementar `GET /registry` y `GET /audit`.
2. Implementar pantalla admin mínima `prepare -> sign -> submit`.
3. Integrar links a explorer por signature.
4. Cubrir con Playwright flujo feliz y errores recuperables.

Sprint 2:
1. Integrar validación on-chain/API de Squads por `proposalId`.
2. Implementar `sync-from-chain` para backfill legacy.
3. Agregar guardrails operativos (idempotencia y rate limits admin).
4. Completar pruebas E2E wallet-connected con Synpress.

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
