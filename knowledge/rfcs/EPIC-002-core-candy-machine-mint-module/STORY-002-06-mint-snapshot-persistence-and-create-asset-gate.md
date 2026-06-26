# STORY-002-06-mint-snapshot-persistence-and-create-asset-gate

## Metadata
- Epic: `EPIC-002-core-candy-machine-mint-module`
- Story ID: `STORY-002-06-mint-snapshot-persistence-and-create-asset-gate`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-18`
- Last Updated: `2026-03-18`

## Context
- Problem:
  El flujo actual permite deploy/mint/reconciliación, pero no deja un registro persistente único con todos los datos de formulario + datos on-chain necesarios para crear posteriormente la entrada de marketplace.
- Why now:
  El siguiente paso funcional después del mint es `Create Asset`, y ese paso requiere evidencia verificable de que los ordinales quedaron creados correctamente en Candy Machine.
- Constraints:
  - Persistir datos completos sin depender de estado en memoria/UI.
  - Verificación real en devnet (sin mocks) para habilitar `Create Asset`.
  - Esta historia no implementa marketplace listing final; solo deja el handoff documentado y trazable.
- Affected paths:
  - `/app/admin/assets/new` (habilitación condicional del botón `Create Asset` post-mint).
  - `/app/api/admin/core-candy-machine/*` (captura de snapshot final y verificación).
  - `/lib/mint-jobs/*` (integración con estado final del job).
  - `/db/migrations/*` (nuevas tablas para snapshot/handoff).

## Proposal
- Approach summary:
  Crear una persistencia de snapshot final de mint (form + blockchain) y una compuerta de negocio para habilitar `Create Asset` únicamente cuando la verificación on-chain de cantidad sea exitosa.
- Technical design:
  - Nuevo agregado persistente: `asset_mint_snapshots` (1 fila por run de mint terminado).
  - Tabla hija: `asset_mint_onchain_proofs` (N firmas y metadatos de confirmación).
  - Relación formal con `mint_jobs` para evitar doble fuente de verdad:
    - `asset_mint_snapshots.mint_job_id TEXT NOT NULL UNIQUE REFERENCES mint_jobs(id) ON DELETE RESTRICT`
    - `mint_jobs` sigue siendo la fuente de estado operacional del proceso.
    - `asset_mint_snapshots` es el resultado inmutable de salida listo para handoff.
  - Estado de handoff para marketplace:
    - `marketplace_handoff_status`: `pending | ready | consumed | failed`
    - Esta historia solo deja el estado en `ready`; la creación real de listing se implementa en historia posterior.
  - Regla de habilitación de botón `Create Asset`:
    - `mint_jobs.status = completed` (política strict por defecto: `partial` se trata como no elegible) AND
    - verificación on-chain aprobada por DAS (`foundAssets == expectedQuantity`) AND
    - snapshot persistido con `verification_status = verified`.
  - Dataset mínimo a persistir (obligatorio):
    - Form snapshot:
      - `assetName`, `slug`, `internalCode`, ubicación, descripciones, estrategia de salida, quantity y campos necesarios de marketplace.
    - Blockchain snapshot:
      - `cluster`, `rpcUrl`
      - `candyMachineAddress`, `candyGuardAddress`, `collectionAddress`
      - `authority`, `mintAuthority`
      - `itemsAvailable`, `itemsLoaded`, `itemsRedeemed`, `itemsRemaining`
      - `guardStartDateUnix`, `guardStartDateIso`
      - `guardSolPaymentLamports`, `guardSolPaymentDestination`
      - `configLineSettings` (`prefixName`, `nameLength`, `prefixUri`, `uriLength`, `isSequential`)
      - `collectionNameOnchain`, `collectionUriOnchain`
    - Verificación:
      - `expectedQuantity`, `verifiedAt`, `verificationMethod` (`das_get_assets_by_group`), `verificationStatus`, `verificationErrorJson`.
    - Evidencia:
      - firmas deploy/mint/reconcile con `slot`, `confirmationStatus`, `err`.
  - Método de verificación on-chain (principal):
    1. Consultar DAS por `collectionAddress` (`getAssetsByGroup`) en `SOLANA_DAS_URL`.
    2. Contar assets retornados y comparar contra `expectedQuantity`.
    3. Persistir resultado estructurado en `verification_error_json` cuando haya mismatch o error.
  - Método de verificación fallback:
    - Si DAS falla temporalmente, fallback a lectura directa de Candy Machine (`itemsLoaded/itemsAvailable`) con estado `verificationStatus = degraded` y sin habilitar `Create Asset`.
  - Contrato de salida para historia futura de marketplace:
    - `asset_mint_snapshots.marketplace_handoff_status = ready`
    - `asset_mint_snapshots.id` como referencia estable de handoff.
- Alternatives considered:
  - Guardar solo JSON en `mint_jobs` (rechazado por pobre trazabilidad y consultas costosas).
  - Habilitar `Create Asset` solo por estado UI (rechazado por falta de verificación on-chain).
  - Crear listing de marketplace en el mismo paso (rechazado por scope creep).
- Tradeoffs:
  - Pro: trazabilidad completa y base sólida para marketplace.
  - Con: agrega complejidad de schema y flujo de estado.

## Critique
- Reviewer(s):
  - `User review (2026-03-18)`
- Critical findings:
1. Formalizar relación `mint_jobs -> asset_mint_snapshots` con `FK + UNIQUE`.
2. Definir política inicial de `partial` orientada a seguridad de negocio.
3. Fijar método principal de verificación en DAS para escalabilidad.
4. Estructurar `verificationError` para observabilidad y diagnósticos.
- Blocking concerns:
  Pendiente aprobación final del RFC para iniciar implementación.

## Resolution
- Final approach after critique:
  Se adopta diseño relacional con `FK + UNIQUE` para idempotencia fuerte a nivel DB, política strict para `partial` (no habilita `Create Asset`), verificación principal por DAS y campo de error estructurado JSON.
- Changes accepted:
  - `asset_mint_snapshots.mint_job_id` como `NOT NULL UNIQUE` + `FOREIGN KEY`.
  - `partial` se considera no elegible para `Create Asset` por defecto.
  - `verificationMethod` principal: `das_get_assets_by_group`.
  - `verificationErrorJson` como objeto estructurado (`code`, `message`, `details`).
- Changes rejected (with rationale):
  - Habilitar `Create Asset` con `partial` por umbral porcentual: rechazado en esta fase por riesgo de negocio; se podrá evaluar en historia futura.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-18`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobado por stakeholder tras incorporar refinamientos: FK+UNIQUE, política strict para `partial`, verificación DAS y error estructurado.

## Status
- Current status: `implemented`
- Next action:
  Integrar handoff `ready -> consumed` con la historia de creación de listing en marketplace.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Validación de payload snapshot (form + blockchain) y campos requeridos.
  - Lógica de `verificationStatus` según `foundAssets/expectedQuantity` (DAS principal).
  - Idempotencia de persistencia del snapshot por `mintJobId`/`emissionId`.
- Integration tests:
  - Flujo `mint completed -> verify -> snapshot persisted -> create asset enabled`.
  - Reintento de verificación no duplica snapshot ni proofs.
  - Estado `marketplace_handoff_status` queda en `ready` cuando verificación es exitosa.
- Devnet validation (if applicable):
  - Consulta real DAS (`getAssetsByGroup`) para validar cantidad final.
  - Fallback a Candy Machine solo como degradación controlada.
  - Confirmación real de firmas incluidas en `asset_mint_onchain_proofs`.
- Responsive QA (if applicable):
  - Botón `Create Asset` visible y usable en 320/375/768/1024.
  - Estado de verificación legible en mobile sin overflow horizontal.

## Traceability
- Related issue(s): `EPIC-002`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
