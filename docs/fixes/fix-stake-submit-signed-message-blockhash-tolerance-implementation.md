# implementation(fix): Stake submit signed message blockhash tolerance

## Espanol

## Objetivo

Permitir que `/api/protected/stake/submit` acepte una transaccion firmada si la accion preparada es identica y el unico cambio del wallet es `recentBlockhash`.

## Cambios

- Mantener `assertPayerMatchesWallet` como validacion obligatoria.
- Reemplazar la comparacion byte-a-byte completa del mensaje por una comparacion estructural de accion.
- Implementar la comparacion en `lib/solana-kit/compat/web3-transactions.ts` para contener el interop legacy `web3.js`.
- Rechazar cambios en cuentas, header, instrucciones, datos de instruccion o address lookup tables.
- Ignorar solo `recentBlockhash`.

## Pruebas

- Test que acepta misma accion con blockhash distinto.
- Test que rechaza cambio de instruction data.
- Test que rechaza cambio de account list.
- Test de boundary para confirmar que el interop legacy sigue contenido.

## Comandos

```bash
npx vitest run tests/lib/solana-kit-web3-transactions.test.ts tests/api/protected-stake-submit-route.test.ts tests/components/stake-module.test.tsx tests/lib/solana-kit-deploy-mint-boundary.test.ts
npm run lint
npm run typecheck
npm run validate
```

## English

## Objective

Allow `/api/protected/stake/submit` to accept a signed transaction when the prepared action is identical and the wallet only changed `recentBlockhash`.

## Changes

- Keep `assertPayerMatchesWallet` as a mandatory validation.
- Replace full byte-for-byte message comparison with structural action comparison.
- Implement the comparison in `lib/solana-kit/compat/web3-transactions.ts` to contain legacy `web3.js` interop.
- Reject changes to accounts, header, instructions, instruction data, or address lookup tables.
- Ignore only `recentBlockhash`.

## Tests

- Test accepting the same action with a different blockhash.
- Test rejecting instruction data changes.
- Test rejecting account list changes.
- Boundary test confirming legacy interop remains contained.

## Commands

```bash
npx vitest run tests/lib/solana-kit-web3-transactions.test.ts tests/api/protected-stake-submit-route.test.ts tests/components/stake-module.test.tsx tests/lib/solana-kit-deploy-mint-boundary.test.ts
npm run lint
npm run typecheck
npm run validate
```
