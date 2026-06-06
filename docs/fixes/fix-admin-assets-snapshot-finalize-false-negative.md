# fix: Admin assets snapshot finalize false negative

## Espanol

## Contexto

En `/admin/assets/new`, el deploy de una Core Candy Machine puede terminar con transacciones reales confirmadas, pero el panel bloquea `Create Asset` con:

- `Mint snapshot could not be verified. Create Asset remains blocked until the snapshot is finalized.`

Caso observado el 2026-06-06:

- Collection: `8Rfg7YJgSaUoV3VgQCxUgojW56bKhShDh4LXbsGRPmRt`
- Candy Machine: `63LzDFYeQNYNi8gfWAFpEkZpLND2gogRyBorgfXWzxYn`
- Cantidad esperada: `110`
- Firmas:
  - `3qCJX2CFroKMq7RJuNFRrxiaMbfFhFaQhtk1gVDSSb6Uy6qgDbqHrA1aDj5J8vWauEPNFiisXS6UXrrsTx6fq8rw`
  - `5pwHnFch9up5qcAVkroWq9Pu7bZ2mQUgjHd1vqQY63aSVV5qGcRg2PUJc1k5rJLRCwABAEkcJQnHLmaqhQ3B5Aa9`
  - `27QJw98mm1mdrEUJH4QPb7PbLqvYErL6u5X97JGYb6pMVNPZpCtKgZ3gQApC6KJdv7EjZ4DTQ9hMWEh3JYVah3Co`
  - `4LY2cWcSu8LSCTFCgwrdkVS7TvfVFbwsRy3ptSBbLwmQKkKAoak89Fxcnru6sMqUMM4zjkKoJWtkeFXQY8h3Tkeg`
  - `SmeNVkngyfMXVCuJChe4nzGvFTUsuCY13DWoFWtAqjyCoxx56s1S34Y8qinpCQgfa2uyWUydJUhWE7ndf1gbN9A`

La inspeccion posterior por RPC devnet mostro que las cinco firmas estaban `finalized` con `err: null`, y que la Candy Machine tenia:

- `itemsLoaded: 110`
- `itemsAvailable: 110`
- `itemsRedeemed: 0`
- Collection on-chain: `8Rfg7YJgSaUoV3VgQCxUgojW56bKhShDh4LXbsGRPmRt`

Esto indica que el deploy on-chain fue correcto y que el bloqueo fue un falso negativo del handoff de snapshot.

## Antecedentes

Este fix se apoya en:

- `BRI-165` slice `Deploy snapshot gate`, commit `211cb45`, merge `efef496`.
- `BRI-170` slice `S07 - Deploy snapshot confirmation gate`, merge `6adac34`.
- `BRI-170` slice `S08 - Propagacion del estado de Candy Machine`, commit `902bf9f`, merge `dabfba7`.
- `docs/fixes/fix-admin-assets-owner-freeze-mint-flow.md`.
- `docs/fixes/fix-admin-assets-owner-freeze-mint-flow-implementation.md`.

La regla existente sigue vigente: `/admin/assets/new` no debe exigir NFTs ya minteados. El gate correcto es:

- collection on-chain coincide con la collection del request,
- `itemsLoaded === quantity`,
- `itemsAvailable === quantity`,
- todas las firmas de deploy estan `confirmed` o `finalized` por RPC canonico,
- el marketplace entry se crea solo con `snapshotId` no nulo y verificado.

## Problema

El flujo actual puede bloquear `Create Asset` aunque el deploy ya este listo on-chain.

Riesgos observados:

- `finalizeCoreCandyMachineSnapshot` puede leer status de firmas en un momento transitorio y dejar `mintJob.status !== completed`.
- Si la Candy Machine ya esta lista pero una prueba de firma aparece temporalmente como `submitted`, el resultado puede quedar con `canCreateAsset: false` y sin error suficientemente accionable.
- `runDeployFlow` puede sobrescribir un error especifico de `finalizeSnapshot()` con el fallback generico `Mint snapshot could not be verified...`.
- El panel no ofrece un retry de snapshot usando las firmas ya confirmadas; el operador queda empujado a repetir deploy o a abandonar el flujo.
- Un snapshot fallido por lectura transitoria puede quedarse como registro de fallo aunque el estado on-chain ya sea correcto minutos despues.

## Por Que Importa

- El deploy ya gasto firmas reales y creo collection/Candy Machine/config lines en devnet.
- Repetir deploy crea infraestructura duplicada y aumenta ruido operacional.
- El admin no puede crear el marketplace entry aunque el gate on-chain ya deberia estar satisfecho.
- El error generico oculta si el problema fue status RPC, lectura de Candy Machine, DAS, ruta API o persistencia.
- El fix debe preservar el hardening BRI-165: nunca permitir marketplace entry con `snapshotId: null`.

## Resultado Esperado

Cuando las firmas y la Candy Machine ya estan listas:

- `snapshot/finalize` debe producir `canCreateAsset: true`.
- El panel debe habilitar `Create Asset` sin exigir redeploy.
- Si una lectura RPC transitoria falla, el sistema debe reintentar de forma acotada antes de marcar fallo.
- Si el primer finalize falla por propagacion, el admin debe poder reintentar solo la finalizacion del snapshot usando las mismas firmas, Candy Machine y collection.
- Los errores visibles deben indicar si faltan firmas confirmadas, config lines, quantity, collection match o persistencia.

## Alcance

S01 - Artefacto y evidencia

- Documentar el falso negativo observado.
- Asociar el trabajo a los antecedentes BRI-165/BRI-170.
- Mantener la decision de no habilitar `Create Asset` sin snapshot verificado.

S02 - Retry de proofs RPC en snapshot service

- Reintentar de forma acotada la lectura de status de firmas dentro de `finalizeCoreCandyMachineSnapshot`.
- Mantener `confirmed` y `finalized` como unicos estados que completan el gate.
- Mantener `processed`, `submitted`, `null`, webhook-only y errores como bloqueantes.
- Agregar error estructurado para firmas no confirmadas, con conteos y detalles de intentos.

S03 - UI de verificacion automatica despues de deploy

- Despues de que el admin hace click en `Deploy`, mostrar un estado claro de carga mientras el sistema confirma firmas, lee la Candy Machine y finaliza el snapshot.
- Comunicar que el usuario no debe redeployar ni cerrar el flujo: solo debe esperar mientras el sistema verifica.
- Mostrar progreso textual por fase:
  - `Confirming deploy transactions`
  - `Reading Candy Machine state`
  - `Finalizing mint snapshot`
  - `Preparing Create Asset gate`
- Mientras el estado sea `pending_verification`, mantener `Create Asset` bloqueado y el boton `Deploy` deshabilitado para evitar doble envio.
- Si la verificacion automatica agota la ventana sin fallo definitivo, cambiar a `verification_stalled` y mostrar la accion `Retry snapshot`.
- Si la verificacion queda `verified`, mostrar que el snapshot esta listo y habilitar `Create Asset`.

S04 - Retry UI de snapshot sin redeploy

- Agregar accion visible para reintentar snapshot cuando existen `candyMachineAddress`, `collectionAddress` y firmas de deploy.
- Usar las firmas ya registradas; no preparar ni enviar nuevas transacciones.
- Si el retry retorna `canCreateAsset: true`, disparar el mismo `onDeployCompleted` que habilita `Create Asset`.
- Preservar mensajes especificos de errores API en vez de reemplazarlos por fallback generico.

S05 - Pruebas y cierre

- Tests de servicio para propagacion tardia de proof status.
- Tests de componente para estado de carga post-deploy y mensaje de espera.
- Tests de componente para retry de snapshot sin redeploy.
- Tests de componente para no pisar errores especificos con fallback generico.
- Validacion focalizada y `npm run validate`.
- Clean-code/reviewer pass.

## Fuera de Alcance

- Cambios al programa on-chain.
- Cambios de schema o migraciones, salvo que se pruebe que el upsert actual no puede recuperar un snapshot fallido.
- Mainnet.
- Reintentar o recrear transacciones de deploy.
- Relajar el requisito de `snapshotId` verificado.

## Preguntas Abiertas

- Confirmar si este trabajo debe actualizar `BRI-170` como follow-up o abrir un nuevo issue Linear.
- Confirmar si la UI debe mostrar `Retry snapshot` siempre que existan firmas, o solo cuando el ultimo snapshot tenga `canCreateAsset: false`.
- Confirmar si el servicio debe actualizar el mismo `snapshotId` fallido por idempotency key o generar un nuevo intento de snapshot.

## English

## Context

On `/admin/assets/new`, a Core Candy Machine deploy can finish with real confirmed transactions, but the panel blocks `Create Asset` with:

- `Mint snapshot could not be verified. Create Asset remains blocked until the snapshot is finalized.`

Observed case on 2026-06-06:

- Collection: `8Rfg7YJgSaUoV3VgQCxUgojW56bKhShDh4LXbsGRPmRt`
- Candy Machine: `63LzDFYeQNYNi8gfWAFpEkZpLND2gogRyBorgfXWzxYn`
- Expected quantity: `110`

Later devnet RPC inspection showed all five deploy signatures were `finalized` with `err: null`, and the Candy Machine had `itemsLoaded: 110`, `itemsAvailable: 110`, and the expected collection mint. The deploy was valid on-chain; the snapshot handoff produced a false negative.

## Problem

The current flow can block `Create Asset` even after the deploy is ready on-chain.

Likely failure points:

- Snapshot finalization reads signature status during a transient RPC window.
- A ready Candy Machine plus temporarily `submitted` proof can return `canCreateAsset: false`.
- The panel can replace a specific finalize error with a generic fallback.
- The panel has no snapshot-only retry action, so operators are pushed toward redeploying.

## Expected Outcome

- Snapshot finalization retries proof status reads in a bounded way.
- The panel shows a clear post-deploy loading state while signatures, Candy Machine state, and snapshot finalization are being verified.
- The panel preserves specific finalize errors.
- The admin can retry snapshot finalization from existing deploy signatures without redeploying.
- `Create Asset` remains blocked until `canCreateAsset: true` and a non-null verified `snapshotId` exists.

## Out Of Scope

- On-chain program changes.
- Mainnet.
- Recreating deploy transactions.
- Relaxing the verified snapshot gate.
