---
type: Fix Spec
title: Fix Stake Submit Signed Message Blockhash Tolerance Implementation
description: Fix Stake Submit Signed Message Blockhash Tolerance Implementation - migrated from docs/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-stake-submit-signed-message-blockhash-tolerance-implementation.md
---

# implementation(fix): Stake submit signed transaction semantic validation

## Espanol

## Objetivo

Permitir que `/api/protected/stake/submit` acepte una transaccion firmada cuando la accion Core preparada sigue siendo identica, aunque la wallet agregue ajustes seguros de envio, y evitar que la UI quede bloqueada esperando confirmacion o recarga de inventario.

## Cambios

- Mantener `assertPayerMatchesWallet` como validacion obligatoria.
- Reemplazar la comparacion byte-a-byte completa del mensaje por una comparacion estructural de accion.
- Implementar la comparacion en `lib/solana-kit/compat/web3-transactions.ts` para contener el interop legacy `web3.js`.
- Rechazar cambios en cuentas, instrucciones Core, datos de instruccion o address lookup tables.
- Ignorar `recentBlockhash` y aceptar solo instrucciones ComputeBudget iniciales agregadas por la wallet sin cuentas.
- Agregar overlay de procesamiento en `components/dashboard/stake-module.tsx` mientras Stake / Unstake esta preparando, firmando, enviando o resincronizando.
- Aplicar blur y bloqueo de interaccion a la superficie de Stake durante el procesamiento.
- Usar Motion 12 (`motion/react`) para entrada/salida del overlay y respetar `prefers-reduced-motion`.
- Agregar diagnostico sanitizado para mismatch de transaccion firmada, registrando solo categorias de diferencia (`version`, `header`, `staticAccountKeys`, `compiledInstructions`, `addressTableLookups`) junto con attempt, wallet y asset.
- Mantener el mensaje publico de error sin payloads ni detalles de transaccion.
- Comparar la accion firmada por semantica de instrucciones resueltas: fee payer, programa, cuentas, signer/writable y data.
- Aceptar instrucciones `ComputeBudget111111111111111111111111111111` agregadas al inicio por la wallet solo cuando no tengan cuentas.
- Seguir rechazando cualquier instruccion extra no-ComputeBudget o cualquier cambio en las instrucciones Core.
- Enviar la transaccion con `sendRawTransaction` y persistir `submitted` inmediatamente con `txSignature`.
- No esperar `confirmTransaction` dentro del request de submit; la confirmacion canonica queda para Helius/reconciliacion.
- Liberar el overlay de Stake cuando `/submit` responde con firma.
- Ejecutar la recarga de inventario en segundo plano para que una demora de DAS/RPC no deje la UI atrapada.
- Ejecutar reconciliacion canonica best-effort despues del submit para ambientes donde el webhook de Helius no llega al servidor local.
- Reconocer el estado frozen real de MPL Core: `FreezeDelegate.authority` puede volver como `Address` igual al owner actual, no solo como enum `Owner`.
- Mantener bloqueado cualquier `FreezeDelegate.authority` tipo `Address` que no sea igual al owner del asset.

## Pruebas

- Test que acepta misma accion con blockhash distinto.
- Test que rechaza cambio de instruction data.
- Test que rechaza cambio de account list.
- Test de boundary para confirmar que el interop legacy sigue contenido.
- Test de componente que confirma que el overlay y el blur aparecen mientras la firma de wallet sigue pendiente.
- Test que confirma que el diagnostico devuelve `[]` cuando solo cambia `recentBlockhash`.
- Test que confirma que el diagnostico distingue cambios reales en instruction data y account list.
- Test que acepta ComputeBudget agregado por wallet al inicio.
- Test que rechaza instrucciones extra no-ComputeBudget.
- Test de servicio que confirma que `submitStakeAction` marca `submitted` apenas `sendRawTransaction` devuelve firma.
- Test de componente que confirma que el overlay se cierra despues de `/submit` aunque la recarga de inventario siga pendiente.
- Test directo de reconciliacion canonica sin webhook.
- Test del helper MPL Core que acepta `FreezeDelegate.authority: Address` solo cuando coincide con `asset.owner`.

## Evidencia del slice UI

- `tests/components/stake-module.test.ts` queda dentro del patron real de Vitest (`tests/**/*.test.ts`).
- El overlay es responsive por estructura: `fixed inset-0`, padding horizontal mobile, `w-full max-w-md`, y sin ancho fijo que pueda causar overflow en 320px.
- El overlay usa `role="status"`, `aria-live="assertive"` y la superficie bloqueada expone `aria-busy`.
- Clean-code pass: sin hallazgos bloqueantes; se corrigio copy localizado explicito y se evito mezclar textos entre idiomas.
- E2E wallet/Synpress no se ejecuto en este slice porque no hay firma real ni transaccion on-chain en el cambio visual; la validacion funcional queda cubierta por el test de componente y los tests existentes del contrato submit.
- Si el error persiste en local, el siguiente intento debe revisarse en logs del servidor buscando `Stake signed transaction mismatch` para conocer la categoria exacta que cambio antes de relajar cualquier validacion.

## Evidencia devnet manual

- Wallet: `Hxr5ZWUj2m4hBtZBq6Bui3FPn8NJrBbZmtwsGsix68c9`.
- Asset: `32Nh9pbheb2cryvNMUWbQBZBywYsvBa9TybRwE7Qzhvy`.
- Firma: `2EiBvBf9G2fq72dGfqxpaNf4ehFA15D4abxWZDRtVwU5Ltuig3t139aXE5Y9X51RH21a39SJhABRj9LGwoZiS6dy`.
- Resultado RPC devnet: `finalized`, `err: null`, slot `467246457`, block time `2026-06-05T04:32:43.000Z`.
- Resultado DB local: intento `fc3a14d8-ac9c-4873-8da8-1a1fefa0d972` quedo en `submitted` con `tx_signature`.
- Reconciliacion canonica manual: el intento quedo `validated` y se creo evento de perfil `freeze` validado.
- Inventario server-side posterior: asset `32Nh9pbheb2cryvNMUWbQBZBywYsvBa9TybRwE7Qzhvy` quedo `ready_to_unstake`, `isFrozen: true`, `syncPending: false`.

## Comandos

```bash
npx vitest run tests/lib/solana-kit-web3-transactions.test.ts tests/api/protected-stake-submit-route.test.ts tests/components/stake-module.test.ts tests/lib/solana-kit-deploy-mint-boundary.test.ts
npm run lint
npm run typecheck
npm run validate
```

## English

## Objective

Allow `/api/protected/stake/submit` to accept a signed transaction when the prepared Core action remains identical, even if the wallet adds safe send-time adjustments, and prevent the UI from staying blocked while waiting for confirmation or inventory reload.

## Changes

- Keep `assertPayerMatchesWallet` as a mandatory validation.
- Replace full byte-for-byte message comparison with structural action comparison.
- Implement the comparison in `lib/solana-kit/compat/web3-transactions.ts` to contain legacy `web3.js` interop.
- Reject changes to accounts, Core instructions, instruction data, or address lookup tables.
- Ignore `recentBlockhash` and accept only leading wallet-added ComputeBudget instructions without accounts.
- Add a processing overlay in `components/dashboard/stake-module.tsx` while Stake / Unstake is preparing, signing, submitting, or resyncing.
- Apply blur and interaction blocking to the Stake surface during processing.
- Use Motion 12 (`motion/react`) for overlay enter/exit animation and respect `prefers-reduced-motion`.
- Add sanitized diagnostics for signed transaction mismatches, logging only difference categories (`version`, `header`, `staticAccountKeys`, `compiledInstructions`, `addressTableLookups`) together with attempt, wallet, and asset.
- Keep the public error message free of payloads and transaction details.
- Compare the signed action by resolved instruction semantics: fee payer, program, accounts, signer/writable, and data.
- Accept `ComputeBudget111111111111111111111111111111` instructions added at the beginning by the wallet only when they have no accounts.
- Continue rejecting any non-ComputeBudget extra instruction or any change to the Core instructions.
- Send the transaction with `sendRawTransaction` and persist `submitted` immediately with `txSignature`.
- Do not wait for `confirmTransaction` inside the submit request; canonical confirmation remains owned by Helius/reconciliation.
- Release the Stake overlay when `/submit` responds with a signature.
- Run inventory reload in the background so DAS/RPC latency cannot leave the UI trapped.
- Run best-effort canonical reconciliation after submit for environments where the Helius webhook does not reach the local server.
- Recognize the real MPL Core frozen state: `FreezeDelegate.authority` may come back as `Address` equal to the current owner, not only as enum `Owner`.
- Keep any `FreezeDelegate.authority` of type `Address` blocked when it does not equal the asset owner.

## Tests

- Test accepting the same action with a different blockhash.
- Test rejecting instruction data changes.
- Test rejecting account list changes.
- Boundary test confirming legacy interop remains contained.
- Component test confirming the overlay and blur appear while the wallet signature is still pending.
- Test confirming diagnostics return `[]` when only `recentBlockhash` changes.
- Test confirming diagnostics distinguish real instruction-data and account-list changes.
- Test accepting wallet-added leading ComputeBudget instructions.
- Test rejecting non-ComputeBudget extra instructions.
- Service test confirming `submitStakeAction` marks `submitted` as soon as `sendRawTransaction` returns a signature.
- Component test confirming the overlay closes after `/submit` even while inventory reload remains pending.
- Direct canonical reconciliation test without webhook.
- MPL Core helper test accepting `FreezeDelegate.authority: Address` only when it matches `asset.owner`.

## UI Slice Evidence

- `tests/components/stake-module.test.ts` is inside the real Vitest pattern (`tests/**/*.test.ts`).
- The overlay is responsive by structure: `fixed inset-0`, mobile horizontal padding, `w-full max-w-md`, and no fixed width that can cause overflow at 320px.
- The overlay uses `role="status"`, `aria-live="assertive"`, and the blocked surface exposes `aria-busy`.
- Clean-code pass: no blocking findings; localized copy was made explicit and language mixing was avoided.
- Wallet E2E/Synpress was not run for this slice because the visual change does not perform a real signature or on-chain transaction; functional validation is covered by the component test and the existing submit contract tests.
- If the error persists locally, the next attempt must inspect server logs for `Stake signed transaction mismatch` to identify the exact changed category before relaxing any validation.

## Manual Devnet Evidence

- Wallet: `Hxr5ZWUj2m4hBtZBq6Bui3FPn8NJrBbZmtwsGsix68c9`.
- Asset: `32Nh9pbheb2cryvNMUWbQBZBywYsvBa9TybRwE7Qzhvy`.
- Signature: `2EiBvBf9G2fq72dGfqxpaNf4ehFA15D4abxWZDRtVwU5Ltuig3t139aXE5Y9X51RH21a39SJhABRj9LGwoZiS6dy`.
- Devnet RPC result: `finalized`, `err: null`, slot `467246457`, block time `2026-06-05T04:32:43.000Z`.
- Local DB result: attempt `fc3a14d8-ac9c-4873-8da8-1a1fefa0d972` reached `submitted` with `tx_signature`.
- Manual canonical reconciliation: the attempt reached `validated` and a validated `freeze` profile event was created.
- Later server-side inventory: asset `32Nh9pbheb2cryvNMUWbQBZBywYsvBa9TybRwE7Qzhvy` resolved as `ready_to_unstake`, `isFrozen: true`, `syncPending: false`.

## Commands

```bash
npx vitest run tests/lib/solana-kit-web3-transactions.test.ts tests/api/protected-stake-submit-route.test.ts tests/components/stake-module.test.ts tests/lib/solana-kit-deploy-mint-boundary.test.ts
npm run lint
npm run typecheck
npm run validate
```
