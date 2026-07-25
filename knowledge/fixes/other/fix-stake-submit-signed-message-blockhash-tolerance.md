---
type: Fix Spec
title: Fix Stake Submit Signed Message Blockhash Tolerance
description: Fix Stake Submit Signed Message Blockhash Tolerance - migrated from knowledge/
tags: [fixes]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/fixes/other/fix-stake-submit-signed-message-blockhash-tolerance.md
---

# Fix - Stake submit signed message blockhash tolerance

## Espanol

## Resumen

El submit de Stake / Unstake rechazaba transacciones firmadas cuando el wallet devolvia una transaccion con el mismo contenido de accion pero un `recentBlockhash` distinto.

El error visible era:

```text
Signed transaction does not match the prepared stake action.
```

## Evidencia

Asset devnet reportado:

```text
asset: 4tXx1W2LbuxJaq6QP4eF24KrbBcc7pU2fVkV1YdaiLbJ
wallet: Hxr5ZWUj2m4hBtZBq6Bui3FPn8NJrBbZmtwsGsix68c9
```

DAS confirma:

- owner igual a la wallet reportada;
- `frozen: false`;
- plugin `freeze_delegate`;
- autoridad `Owner`.

Por tanto, el asset era elegible para Stake. El fallo estaba en la comparacion backend del mensaje firmado.

## Decision

El backend debe seguir rechazando transacciones alteradas, pero no debe rechazar una transaccion cuyo unico cambio sea `recentBlockhash`.

La comparacion segura valida:

- version del mensaje;
- header;
- static account keys;
- compiled instructions;
- instruction data;
- address lookup tables.

La comparacion ignora solamente `recentBlockhash`.

## Riesgo

Aceptar cambios de blockhash es seguro solo si todo lo demas permanece igual. Por eso el fix no compara una representacion laxa del payload; compara el fingerprint estructural completo de la accion firmada.

## Slice UI de procesamiento

Stake / Unstake debe comunicar claramente que la accion sigue en curso despues de confirmar. Mientras se prepara, firma, envia y resincroniza la accion:

- la superficie de Stake queda desenfocada;
- las interacciones duplicadas quedan bloqueadas;
- aparece un overlay fijo con estado de procesamiento on-chain;
- la animacion usa Motion 12 (`motion/react`) y respeta `prefers-reduced-motion`;
- no cambia la transaccion preparada ni el contrato de validacion backend.

## English

## Summary

Stake / Unstake submit rejected signed transactions when the wallet returned a transaction with the same action content but a different `recentBlockhash`.

The visible error was:

```text
Signed transaction does not match the prepared stake action.
```

## Evidence

Reported devnet asset:

```text
asset: 4tXx1W2LbuxJaq6QP4eF24KrbBcc7pU2fVkV1YdaiLbJ
wallet: Hxr5ZWUj2m4hBtZBq6Bui3FPn8NJrBbZmtwsGsix68c9
```

DAS confirms:

- owner equals the reported wallet;
- `frozen: false`;
- `freeze_delegate` plugin;
- `Owner` authority.

Therefore, the asset was eligible for Stake. The failure was in the backend signed-message comparison.

## Decision

The backend must still reject altered transactions, but it must not reject a transaction whose only change is `recentBlockhash`.

The safe comparison validates:

- message version;
- header;
- static account keys;
- compiled instructions;
- instruction data;
- address lookup tables.

The comparison ignores only `recentBlockhash`.

## Risk

Accepting blockhash changes is safe only if everything else stays identical. Therefore, the fix does not compare a loose payload representation; it compares the full structural fingerprint of the signed action.

## Processing UI Slice

Stake / Unstake must clearly communicate that the action is still in progress after confirmation. While the action is prepared, signed, submitted, and resynced:

- the Stake surface is blurred;
- duplicate interactions remain blocked;
- a fixed overlay shows on-chain processing status;
- animation uses Motion 12 (`motion/react`) and respects `prefers-reduced-motion`;
- the prepared transaction and backend validation contract do not change.
