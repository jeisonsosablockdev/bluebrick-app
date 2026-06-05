# implementation(fix): BRI-170 Stake blockhash expiry recovery

## Espanol

## Slices

### S01 - Artefacto

Estado: completado.

Decision:

- `Blockhash not found` se trata como expiracion recuperable.
- No se intenta modificar una transaccion ya firmada.
- El usuario debe firmar una transaccion fresca.

### S02 - API Stake Submit

Estado: completado.

Cambios esperados:

- Agregar detector de expiracion de blockhash en `lib/stake-service.ts`.
- Lanzar `StakeFlowError("BLOCKHASH_EXPIRED", ..., 409, { recoverable: true })`.
- Exponer `recoverable` en `app/api/protected/stake/submit/route.ts`.

Implementado:

- `Blockhash not found` y `block height exceeded` se clasifican como expiracion de blockhash.
- El intento se marca `failed` con mensaje recuperable.
- La route responde `409` con `error.code = BLOCKHASH_EXPIRED` y `error.recoverable = true`.

### S03 - UI Stake / Unstake

Estado: completado.

Cambios esperados:

- Parsear `error.code` y `error.recoverable`.
- Para `BLOCKHASH_EXPIRED`, limpiar el override local y dejar disponible `Stake` o `Unstake`.
- Mostrar un mensaje localizado de retry.

Implementado:

- La UI conserva `code` y `recoverable` del error API.
- `BLOCKHASH_EXPIRED` elimina el estado local bloqueante del asset.
- El card vuelve a mostrar la accion original y presenta un mensaje localizado de reintento.

### S04 - Pruebas y cierre

Estado: completado.

Validacion esperada:

- `npx vitest run tests/components/stake-module.test.ts tests/lib/stake-service-submit.test.ts tests/api/protected-stake-submit-route.test.ts`
- `npm run lint`
- `npm run typecheck`
- `npm run validate`

Validacion ejecutada:

- `npx vitest run tests/components/stake-module.test.ts tests/lib/stake-service-submit.test.ts tests/api/protected-stake-submit-route.test.ts` - passed, 3 files / 12 tests.
- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm run validate` - passed.
- `git diff --check` - passed.

Clean-code:

- Sin hallazgos bloqueantes.
- El detector de blockhash expirado queda aislado en una funcion dedicada.
- El catch de submit calcula una sola vez si el error es recuperable.
- La UI conserva la separacion entre error recuperable global y estado operativo del card.

## English

## Slices

### S01 - Artifact

Status: completed.

Decision:

- `Blockhash not found` is treated as a recoverable expiration.
- A transaction that is already signed is not modified.
- The user must sign a fresh transaction.

### S02 - Stake Submit API

Status: completed.

Expected changes:

- Add blockhash-expiry detection in `lib/stake-service.ts`.
- Throw `StakeFlowError("BLOCKHASH_EXPIRED", ..., 409, { recoverable: true })`.
- Expose `recoverable` from `app/api/protected/stake/submit/route.ts`.

Implemented:

- `Blockhash not found` and `block height exceeded` are classified as blockhash expiration.
- The attempt is marked `failed` with a recoverable message.
- The route returns `409` with `error.code = BLOCKHASH_EXPIRED` and `error.recoverable = true`.

### S03 - Stake / Unstake UI

Status: completed.

Expected changes:

- Parse `error.code` and `error.recoverable`.
- For `BLOCKHASH_EXPIRED`, clear the local override and keep `Stake` or `Unstake` available.
- Show localized retry copy.

Implemented:

- The UI preserves `code` and `recoverable` from the API error.
- `BLOCKHASH_EXPIRED` removes the blocking local asset state.
- The card shows the original action again and presents localized retry copy.

### S04 - Tests and closeout

Status: completed.

Expected validation:

- `npx vitest run tests/components/stake-module.test.ts tests/lib/stake-service-submit.test.ts tests/api/protected-stake-submit-route.test.ts`
- `npm run lint`
- `npm run typecheck`
- `npm run validate`

Executed validation:

- `npx vitest run tests/components/stake-module.test.ts tests/lib/stake-service-submit.test.ts tests/api/protected-stake-submit-route.test.ts` - passed, 3 files / 12 tests.
- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm run validate` - passed.
- `git diff --check` - passed.

Clean-code:

- No blocking findings.
- Expired blockhash detection is isolated in a dedicated function.
- Submit catch computes recoverability only once.
- The UI keeps global recoverable error copy separate from the card's operational state.
