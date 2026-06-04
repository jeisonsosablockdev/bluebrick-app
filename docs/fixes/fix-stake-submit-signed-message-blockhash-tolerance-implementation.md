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
- Agregar overlay de procesamiento en `components/dashboard/stake-module.tsx` mientras Stake / Unstake esta preparando, firmando, enviando o resincronizando.
- Aplicar blur y bloqueo de interaccion a la superficie de Stake durante el procesamiento.
- Usar Motion 12 (`motion/react`) para entrada/salida del overlay y respetar `prefers-reduced-motion`.

## Pruebas

- Test que acepta misma accion con blockhash distinto.
- Test que rechaza cambio de instruction data.
- Test que rechaza cambio de account list.
- Test de boundary para confirmar que el interop legacy sigue contenido.
- Test de componente que confirma que el overlay y el blur aparecen mientras la firma de wallet sigue pendiente.

## Evidencia del slice UI

- `tests/components/stake-module.test.ts` queda dentro del patron real de Vitest (`tests/**/*.test.ts`).
- El overlay es responsive por estructura: `fixed inset-0`, padding horizontal mobile, `w-full max-w-md`, y sin ancho fijo que pueda causar overflow en 320px.
- El overlay usa `role="status"`, `aria-live="assertive"` y la superficie bloqueada expone `aria-busy`.
- Clean-code pass: sin hallazgos bloqueantes; se corrigio copy localizado explicito y se evito mezclar textos entre idiomas.
- E2E wallet/Synpress no se ejecuto en este slice porque no hay firma real ni transaccion on-chain en el cambio visual; la validacion funcional queda cubierta por el test de componente y los tests existentes del contrato submit.

## Comandos

```bash
npx vitest run tests/lib/solana-kit-web3-transactions.test.ts tests/api/protected-stake-submit-route.test.ts tests/components/stake-module.test.ts tests/lib/solana-kit-deploy-mint-boundary.test.ts
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
- Add a processing overlay in `components/dashboard/stake-module.tsx` while Stake / Unstake is preparing, signing, submitting, or resyncing.
- Apply blur and interaction blocking to the Stake surface during processing.
- Use Motion 12 (`motion/react`) for overlay enter/exit animation and respect `prefers-reduced-motion`.

## Tests

- Test accepting the same action with a different blockhash.
- Test rejecting instruction data changes.
- Test rejecting account list changes.
- Boundary test confirming legacy interop remains contained.
- Component test confirming the overlay and blur appear while the wallet signature is still pending.

## UI Slice Evidence

- `tests/components/stake-module.test.ts` is inside the real Vitest pattern (`tests/**/*.test.ts`).
- The overlay is responsive by structure: `fixed inset-0`, mobile horizontal padding, `w-full max-w-md`, and no fixed width that can cause overflow at 320px.
- The overlay uses `role="status"`, `aria-live="assertive"`, and the blocked surface exposes `aria-busy`.
- Clean-code pass: no blocking findings; localized copy was made explicit and language mixing was avoided.
- Wallet E2E/Synpress was not run for this slice because the visual change does not perform a real signature or on-chain transaction; functional validation is covered by the component test and the existing submit contract tests.

## Commands

```bash
npx vitest run tests/lib/solana-kit-web3-transactions.test.ts tests/api/protected-stake-submit-route.test.ts tests/components/stake-module.test.ts tests/lib/solana-kit-deploy-mint-boundary.test.ts
npm run lint
npm run typecheck
npm run validate
```
