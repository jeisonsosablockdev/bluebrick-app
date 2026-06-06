# implementation(fix): Admin assets snapshot finalize false negative

## Espanol

## Estado

Implementacion completada por slices en ramas separadas.

## Relacion Con Linear

Relacionados:

- `BRI-165` - `/admin/assets/new` snapshot obligatorio antes de crear marketplace entry.
- `BRI-170` - owner-freeze mint flow, deploy snapshot readiness, confirmation gate y snapshot state propagation.

Decision pendiente:

- Usar `BRI-170` como parent follow-up o abrir un nuevo Linear issue especifico para este falso negativo.

No se debe sincronizar Linear hasta que el artefacto sea aprobado o se confirme el issue destino.

## Invariantes

- Devnet sigue siendo el unico cluster de aceptacion.
- `Create Asset` no se habilita si no existe `snapshotId` verificado.
- Un evento webhook no confirma firmas; RPC canonico sigue siendo la autoridad.
- `processed`, `submitted`, `null`, errores de firma y webhook-only siguen bloqueando el gate.
- DAS no es gate del deploy admin porque `/admin/assets/new` no mintea NFTs finales.
- El retry no debe ocultar fallos definitivos: collection mismatch, quantity mismatch, `itemsLoaded > quantity`, firma fallida o request invalido.

## Slices

### S01 - Artefacto y evidencia

Estado: completado cuando este archivo y el problem artifact existan.

Evidencia inicial:

- Candy Machine `63LzDFYeQNYNi8gfWAFpEkZpLND2gogRyBorgfXWzxYn`.
- Collection `8Rfg7YJgSaUoV3VgQCxUgojW56bKhShDh4LXbsGRPmRt`.
- RPC devnet posterior: `itemsLoaded=110`, `itemsAvailable=110`, `itemsRedeemed=0`.
- Cinco firmas de deploy observadas como `finalized`, `err: null`.
- Error UI observado: `Mint snapshot could not be verified. Create Asset remains blocked until the snapshot is finalized.`

Gate:

- Artefacto revisado antes de tocar codigo.

### S02 - Snapshot service proof retry

Estado: completado en rama `codex/fix-admin-assets-snapshot-false-negative-s02-proof-retry`.

Objetivo:

- Hacer que `finalizeCoreCandyMachineSnapshot` espere de forma acotada la propagacion de status RPC de firmas antes de marcar proof incompleto.

Cambios esperados:

- Extraer la lectura de proofs a un helper que pueda reintentar.
- Agregar configuracion acotada:
  - `CORE_CM_SNAPSHOT_PROOF_MAX_ATTEMPTS`
  - `CORE_CM_SNAPSHOT_PROOF_RETRY_MS`
- Defaults propuestos:
  - `maxAttempts = 5`
  - `retryMs = 1_000`
  - limites: `1..15` intentos y `0..5_000ms`
- Agregar `DEPLOY_SIGNATURES_NOT_CONFIRMED` cuando los proofs quedan pendientes despues del retry.
- Incluir detalles: intentos, max intentos, cantidad de proofs, confirmed/failed/pending, y status por firma.
- Conservar `failed` como fallo definitivo sin esperar intentos adicionales.

Tests primero:

- Servicio: una firma `add-config-lines` aparece `processed` en la primera lectura y `confirmed` en la segunda; resultado `canCreateAsset=true`.
- Servicio: una firma queda `processed/submitted` hasta agotar intentos; resultado `canCreateAsset=false`, `verificationError.code=DEPLOY_SIGNATURES_NOT_CONFIRMED`.
- Servicio: firma con `err` no reintenta hasta agotar ventana; queda bloqueada con detalle de fallo.

Implementado:

- `finalizeCoreCandyMachineSnapshot` usa retry acotado para status de proofs con `CORE_CM_SNAPSHOT_PROOF_MAX_ATTEMPTS` y `CORE_CM_SNAPSHOT_PROOF_RETRY_MS`.
- Los estados `confirmed` y `finalized` siguen siendo los unicos que completan el gate.
- Los proofs pendientes producen `DEPLOY_SIGNATURES_NOT_CONFIRMED`.
- Los proofs con `err` producen `DEPLOY_SIGNATURE_FAILED` y cortan temprano.
- Si hay mismatch definitivo de Candy Machine, ese error sigue teniendo prioridad sobre un proof pendiente.

Validacion ejecutada:

- `npx vitest run tests/lib/core-candy-machine-snapshot-service.test.ts` - passed, 1 file / 8 tests.

### S03 - Post-deploy verification loading UI

Estado: completado en rama `codex/fix-admin-assets-snapshot-false-negative-s03-loading-ui`.

Objetivo:

- Hacer explicito que despues de `Deploy` el sistema esta verificando automaticamente y que el admin solo debe esperar.

Cambios esperados:

- Introducir un estado UI de `pending_verification` despues de que las transacciones de deploy fueron enviadas/confirmadas y antes de habilitar `Create Asset`.
- Mostrar una banda de progreso o panel visible con fases:
  - `Confirming deploy transactions`
  - `Reading Candy Machine state`
  - `Finalizing mint snapshot`
  - `Preparing Create Asset gate`
- Mostrar copy directo: `Deploy confirmed. Verifying the mint snapshot. Please wait; do not redeploy.`
- Mantener `Create Asset` bloqueado durante `pending_verification`.
- Mantener `Deploy` deshabilitado durante `pending_verification` para evitar doble envio.
- Si la verificacion automatica termina en `verified`, cambiar el panel a estado listo y habilitar `Create Asset`.
- Si se agota la ventana automatica sin fallo definitivo, cambiar a `verification_stalled` y explicar que el deploy existe pero la lectura de snapshot debe reintentarse.
- En `verification_stalled`, mostrar `Retry snapshot` como accion principal del panel de snapshot.

Tests primero:

- Componente: despues de `Deploy`, se muestra el estado de carga de snapshot y copy de espera.
- Componente: durante `pending_verification`, `Deploy` y `Create Asset` permanecen bloqueados.
- Componente: cuando finalize retorna `verified`, el estado cambia a listo y llama `onDeployCompleted`.
- Componente: cuando se agota la ventana sin fallo definitivo, aparece `Retry snapshot`.

Implementado:

- `CoreCandyMachinePanel` muestra un panel de verificacion despues de `Deploy`.
- El copy principal indica que el deploy esta confirmado y que el admin debe esperar sin redeployar.
- El panel lista las fases `Confirming deploy transactions`, `Reading Candy Machine state`, `Finalizing mint snapshot` y `Preparing Create Asset gate`.
- `Deploy` queda deshabilitado durante la verificacion pendiente.
- El estado `verified` muestra `Snapshot verified. Create Asset is ready.` antes de entregar el handoff.

Validacion ejecutada:

- `npx vitest run tests/components/core-candy-machine-panel-snapshot-gate.test.ts` - passed, 1 file / 5 tests.

### S04 - Snapshot-only retry UI

Estado: completado en rama `codex/fix-admin-assets-snapshot-false-negative-s04-retry-ui`.

Objetivo:

- Permitir recuperar el handoff cuando el deploy ya existe y solo fallo la finalizacion del snapshot.

Cambios esperados:

- Extraer la logica comun de finalizar snapshot y completar deploy a un helper local del panel.
- Mostrar boton `Retry snapshot` cuando:
  - existe `runState.candyMachineAddress`,
  - existe `runState.collectionAddress`,
  - hay firmas registradas,
  - `snapshotResult?.canCreateAsset !== true`,
  - el estado automatico esta `verification_stalled` o el ultimo finalize fallo sin fallo definitivo,
  - no hay accion busy.
- El retry llama solo `/api/admin/core-candy-machine/snapshot/finalize`.
- No llama `/deploy/prepare`, `/submit` ni vuelve a firmar transacciones.
- Si el retry retorna `canCreateAsset=true`, dispara `onDeployCompleted` con las firmas existentes.
- Si el retry falla, conserva el error especifico.

Tests primero:

- Componente: primer finalize retorna `canCreateAsset=false`; aparece `Retry snapshot`; segundo finalize retorna `canCreateAsset=true`; se llama `onDeployCompleted` sin redeploy.
- Componente: finalize route responde `500` con error especifico; la UI conserva ese texto y no lo reemplaza por el fallback generico.
- Componente: retry no aparece si no hay Candy Machine, collection o firmas.

Implementado:

- El panel guarda el deploy confirmado como `pendingDeployCompletion` despues de submit/status.
- `Retry snapshot` usa solo Candy Machine, collection, quantity y firmas ya registradas.
- El retry llama solo `/api/admin/core-candy-machine/snapshot/finalize`.
- El retry exitoso reutiliza el mismo handoff `onDeployCompleted`.
- Los errores especificos de finalize fallido no se reemplazan por el fallback generico.

Validacion ejecutada:

- `npx vitest run tests/components/core-candy-machine-panel-snapshot-gate.test.ts` - passed, 1 file / 7 tests.

### S05 - Docs, QA y reviewer

Estado: completado en rama `codex/fix-admin-assets-snapshot-false-negative-s05-qa-closeout`.

Objetivo:

- Cerrar el fix con evidencia suficiente sin ampliar el scope.

Validacion focalizada:

- `npx vitest run tests/lib/core-candy-machine-snapshot-service.test.ts`
- `npx vitest run tests/components/core-candy-machine-panel-snapshot-gate.test.ts`
- `npx vitest run tests/api/admin-core-candy-machine-status-route.test.ts tests/api/admin-core-candy-machine-snapshot-finalize-route.test.ts`
- `npm run lint`
- `npm run typecheck`
- `npm run validate`

Validacion focalizada ejecutada:

- `npx vitest run tests/lib/core-candy-machine-snapshot-service.test.ts tests/components/core-candy-machine-panel-snapshot-gate.test.ts tests/api/admin-core-candy-machine-status-route.test.ts tests/api/admin-core-candy-machine-snapshot-finalize-route.test.ts` - passed, 4 files / 23 tests.
- `git diff --check` - passed.
- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm run validate` - passed after updating `docs/nft-spec.md` for the NFT-scope governance gate.

Devnet proof:

- Consultar la Candy Machine afectada o un nuevo deploy devnet y registrar:
  - firmas reales,
  - status RPC `confirmed/finalized`,
  - fetched Candy Machine state,
  - `itemsLoaded === itemsAvailable === quantity`,
  - snapshot finalizado con `canCreateAsset=true`.

Devnet proof ejecutado:

- Cluster: devnet.
- Candy Machine: `63LzDFYeQNYNi8gfWAFpEkZpLND2gogRyBorgfXWzxYn`.
- Collection mint: `8Rfg7YJgSaUoV3VgQCxUgojW56bKhShDh4LXbsGRPmRt`.
- Candy Machine state fetched by RPC:
  - `itemsLoaded: 110`
  - `itemsAvailable: 110`
  - `itemsRedeemed: 0`
  - `matchesExpected: true`
- Signature status fetched by RPC:
  - `3qCJX2CFroKMq7RJuNFRrxiaMbfFhFaQhtk1gVDSSb6Uy6qgDbqHrA1aDj5J8vWauEPNFiisXS6UXrrsTx6fq8rw` - `finalized`, `err: null`.
  - `5pwHnFch9up5qcAVkroWq9Pu7bZ2mQUgjHd1vqQY63aSVV5qGcRg2PUJc1k5rJLRCwABAEkcJQnHLmaqhQ3B5Aa9` - `finalized`, `err: null`.
  - `27QJw98mm1mdrEUJH4QPb7PbLqvYErL6u5X97JGYb6pMVNPZpCtKgZ3gQApC6KJdv7EjZ4DTQ9hMWEh3JYVah3Co` - `finalized`, `err: null`.
  - `4LY2cWcSu8LSCTFCgwrdkVS7TvfVFbwsRy3ptSBbLwmQKkKAoak89Fxcnru6sMqUMM4zjkKoJWtkeFXQY8h3Tkeg` - `finalized`, `err: null`.
  - `SmeNVkngyfMXVCuJChe4nzGvFTUsuCY13DWoFWtAqjyCoxx56s1S34Y8qinpCQgfa2uyWUydJUhWE7ndf1gbN9A` - `finalized`, `err: null`.
- Proof mode: read-only RPC verification. No transaction was sent or signed during QA.

Clean-code/reviewer:

- Revisar que el retry de proofs no duplique el retry de Candy Machine state.
- Revisar que el estado de carga post-deploy no invite a redeployar ni oculte el bloqueo de `Create Asset`.
- Revisar que la UI no introduzca un segundo modelo de deploy completion.
- Revisar que los errores sean especificos y no expongan secretos.
- Revisar que no se relaje el gate de `snapshotId`.

Reviewer result:

- No blocking findings.
- Proof retry remains server-side, bounded, and separate from Candy Machine state propagation.
- UI retry is snapshot-only and does not call deploy prepare/submit or wallet signing.
- `Create Asset` still requires `canCreateAsset=true` and the verified snapshot handoff.
- Error details remain structured operational data; no RPC URL, signer material, or wallet secret is emitted.

## Riesgos

- Aumentar demasiado la ventana de finalize puede hacer lenta la UI serverless.
- Reintentar proofs y luego Candy Machine state puede multiplicar llamadas RPC.
- Un retry UI mal acotado podria permitir operadores repetir finalize mientras otro request esta en vuelo.

Mitigaciones:

- Limites estrictos de intentos y delay.
- Fallos definitivos cortan temprano.
- `isFinalizingSnapshot` y `busyAction` bloquean acciones concurrentes.
- Tests cubren retry sin redeploy y errores especificos.

## English

## Status

Draft. This artifact defines the plan before implementation.

## Linear Relationship

Related issues:

- `BRI-165` - mandatory snapshot before marketplace entry creation.
- `BRI-170` - deploy snapshot readiness, confirmation gate, and Candy Machine state propagation.

Pending decision:

- Use `BRI-170` as the parent follow-up or open a dedicated Linear issue for this false negative.

## Implementation Slices

S01 records the artifact and devnet evidence.

S02 adds bounded proof-status retry inside `finalizeCoreCandyMachineSnapshot`, with structured `DEPLOY_SIGNATURES_NOT_CONFIRMED` errors.

S03 adds an explicit post-deploy loading state so the admin understands that snapshot verification is running and they should wait instead of redeploying.

S04 adds snapshot-only retry in the admin panel using existing Candy Machine, collection, and signatures. It must not prepare, sign, or submit new deploy transactions.

S05 runs focused tests, full validation, devnet proof, and clean-code/reviewer pass.

## Gates

- Focused service, component, and route tests.
- `npm run lint`.
- `npm run typecheck`.
- `npm run validate`.
- Real devnet evidence when implementation is complete.
- No relaxation of the verified `snapshotId` gate.
