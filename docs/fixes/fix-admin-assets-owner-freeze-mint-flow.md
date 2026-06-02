# BRI-170 - Fix del flujo admin assets para owner freeze

## Espanol

## Resumen

`BRI-170` corrige el flujo de `/admin/assets/new` para que los NFTs BRIDS minteados desde el flujo canonico reciban la capacidad `FreezeDelegate` con autoridad `Owner`, y para que cada transaccion critica quede trazable desde preparacion hasta confirmacion.

El problema detectado no es que MPL Core no soporte `freeze / unfreeze`. El problema es que el flujo visible de creacion de activos esta ejecutando el deploy/config de la Candy Machine, pero no esta conectando de forma canonica el ciclo posterior de mint + AppData + owner freeze plugin que ya existe parcialmente en codigo.

## Problema

El usuario admin crea un activo desde `/admin/assets/new`.

El flujo actual prepara y envia:

- `create-collection`
- `create-candy-machine`
- `add-config-lines`

Pero el plugin que Stake / Unstake necesita vive en otro camino:

- `mint`
- `add-app-data-plugin`
- `write-app-data`
- `add-owner-freeze-plugin`

Ese segundo camino existe en codigo, pero no esta integrado al flujo visible de `/admin/assets/new`. Como resultado, un NFT puede:

- pertenecer a una collection BRIDS valida
- estar en la wallet del usuario
- aparecer en DAS como `MplCoreAsset`
- no estar congelado
- aun asi quedar como `No soportado` en Stake / Unstake porque no tiene `FreezeDelegate` con autoridad `Owner`

## Evidencia tecnica actual

Para el asset auditado, DAS reporto:

```text
interface: MplCoreAsset
ownership.owner: wallet conectada
ownership.frozen: false
plugins: {}
```

Si el owner freeze plugin estuviera instalado, el asset deberia exponer un equivalente a:

```text
plugins.freeze_delegate.authority.type: Owner
```

La collection si puede tener `PermanentFreezeDelegate`, pero eso no equivale a que cada NFT tenga `FreezeDelegate` con autoridad `Owner`.

## Causa raiz

La causa raiz es una separacion incompleta entre dos flujos:

1. El flujo visible `deploy/prepare` crea collection, Candy Machine y config lines.
2. El flujo `mint/prepare` prepara mint, AppData y owner freeze plugin.

La UI admin actual no garantiza que el segundo flujo se ejecute como parte del ciclo canonico que produce NFTs elegibles para Stake / Unstake.

## Brecha de trazabilidad

La trazabilidad persistida actual tampoco es suficiente.

La tabla `asset_mint_onchain_proofs` solo acepta estos `tx_kind`:

- `create-collection`
- `create-candy-machine`
- `add-config-lines`
- `mint`

Pero un ciclo NFT completo tambien necesita auditar:

- `add-app-data-plugin`
- `write-app-data`
- `add-owner-freeze-plugin`

Sin un manifest transaccional mas completo, no podemos responder de forma estricta:

- que transacciones se prepararon
- cuales firmo la wallet
- cuales se enviaron
- cuales confirmaron
- cual fallo y en que indice
- si el owner freeze plugin quedo aplicado on-chain

## Impacto

El impacto es alto para producto porque Stake / Unstake depende de una capacidad on-chain real por NFT.

El impacto tambien es alto para seguridad y auditoria porque el sistema no debe asumir que un NFT soporta freeze solo por pertenecer a una collection. Debe verificar el plugin real del asset.

## Resultado esperado

El flujo canonico debe producir NFTs con:

- collection BRIDS valida
- owner correcto
- metadata/Core asset correcto
- `AppData` instalado y escrito cuando aplique
- `FreezeDelegate` instalado con autoridad `Owner`
- manifest persistente de todas las transacciones criticas
- prueba final en devnet con firmas reales

## Reglas estrictas

- No se acepta un workaround manual de DB como solucion.
- No se acepta evidencia simulada como prueba final blockchain.
- No se debe dejar ruta vieja u orfana que permita crear NFTs incompletos.
- No se debe introducir una dependencia dominante nueva de `@solana/web3.js`.
- El nuevo flujo debe usar Solana Kit / framework-kit como camino canonico.
- Si queda un boundary legacy inevitable, debe quedar encapsulado y eliminado o justificado en el slice de cleanup.

## Codigo huerfano a auditar

Este fix debe revisar y clasificar:

- `/api/admin/core-candy-machine/deploy/prepare`
- `/api/admin/core-candy-machine/mint/prepare`
- `/api/admin/core-candy-machine/submit`
- `CoreCandyMachinePanel`
- `MintOrchestratorSigningPanel`
- helpers de serializacion/transaccion en `lib/core-candy-machine-admin.ts`
- imports y usos de `@solana/web3.js`

Cada pieza debe terminar en uno de estos estados:

- parte del flujo canonico
- reemplazada por el flujo canonico
- eliminada
- documentada como boundary temporal estrictamente encapsulado

## Preguntas resueltas

### La collection tiene freeze?

Puede tener `PermanentFreezeDelegate`, pero eso no habilita owner-managed Stake / Unstake para cada NFT.

### El asset tiene `FreezeDelegate Authority: Owner`?

No, el asset auditado no lo tiene. DAS reporta `plugins: {}`.

### El codigo tiene una funcion que prepara ese plugin?

Si. `prepareCoreCandyMachineMint` prepara `add-owner-freeze-plugin`.

### Esta conectado al flujo visible de `/admin/assets/new`?

No de forma canonica. Ese es el bug que se corrige.

## Fuera de alcance

- Mainnet.
- Rotacion de autoridades.
- Cambios al programa Anchor notarial.
- Reglas economicas de distribucion.
- Reprocesamiento historico automatico de NFTs ya creados sin plugin.

## English

## Summary

`BRI-170` fixes the `/admin/assets/new` flow so BRIDS NFTs minted through the canonical path receive the `FreezeDelegate` capability with `Owner` authority, and every critical transaction is traceable from preparation through confirmation.

The issue is not that MPL Core lacks `freeze / unfreeze` support. The issue is that the visible asset creation flow runs Candy Machine deploy/config, but does not canonically connect the later mint + AppData + owner freeze plugin cycle that already exists partially in code.

## Problem

The admin user creates an asset from `/admin/assets/new`.

The current flow prepares and submits:

- `create-collection`
- `create-candy-machine`
- `add-config-lines`

But the plugin required by Stake / Unstake lives in another path:

- `mint`
- `add-app-data-plugin`
- `write-app-data`
- `add-owner-freeze-plugin`

That second path exists in code, but it is not integrated into the visible `/admin/assets/new` flow. As a result, an NFT can:

- belong to a valid BRIDS collection
- be owned by the user wallet
- appear in DAS as `MplCoreAsset`
- be unfrozen
- still be shown as `Unsupported` in Stake / Unstake because it does not have `FreezeDelegate` with `Owner` authority

## Current Technical Evidence

For the audited asset, DAS reported:

```text
interface: MplCoreAsset
ownership.owner: connected wallet
ownership.frozen: false
plugins: {}
```

If the owner freeze plugin had been installed, the asset should expose something equivalent to:

```text
plugins.freeze_delegate.authority.type: Owner
```

The collection may have `PermanentFreezeDelegate`, but that is not equivalent to each NFT having `FreezeDelegate` with `Owner` authority.

## Root Cause

The root cause is an incomplete split between two flows:

1. The visible `deploy/prepare` flow creates the collection, Candy Machine, and config lines.
2. The `mint/prepare` flow prepares mint, AppData, and owner freeze plugin transactions.

The current admin UI does not guarantee that the second flow runs as part of the canonical lifecycle that produces NFTs eligible for Stake / Unstake.

## Traceability Gap

The current persisted traceability is also insufficient.

The `asset_mint_onchain_proofs` table only accepts these `tx_kind` values:

- `create-collection`
- `create-candy-machine`
- `add-config-lines`
- `mint`

But a complete NFT lifecycle also needs to audit:

- `add-app-data-plugin`
- `write-app-data`
- `add-owner-freeze-plugin`

Without a more complete transaction manifest, we cannot strictly answer:

- which transactions were prepared
- which transactions the wallet signed
- which transactions were submitted
- which transactions confirmed
- which index failed and why
- whether the owner freeze plugin was actually applied on-chain

## Impact

The product impact is high because Stake / Unstake depends on a real on-chain capability per NFT.

The security and audit impact is also high because the system must not assume an NFT supports freeze just because it belongs to a collection. It must verify the real asset plugin.

## Expected Outcome

The canonical flow must produce NFTs with:

- valid BRIDS collection
- correct owner
- correct metadata/Core asset
- `AppData` installed and written when applicable
- `FreezeDelegate` installed with `Owner` authority
- persistent manifest for every critical transaction
- final devnet proof with real signatures

## Strict Rules

- A manual DB workaround is not an accepted fix.
- Simulated evidence is not accepted as final blockchain proof.
- No old or orphan route may remain capable of creating incomplete NFTs.
- Do not introduce a new dominant dependency on `@solana/web3.js`.
- The new flow must use Solana Kit / framework-kit as the canonical path.
- If an unavoidable legacy boundary remains, it must be encapsulated and either removed or justified in the cleanup slice.

## Orphan Code To Audit

This fix must review and classify:

- `/api/admin/core-candy-machine/deploy/prepare`
- `/api/admin/core-candy-machine/mint/prepare`
- `/api/admin/core-candy-machine/submit`
- `CoreCandyMachinePanel`
- `MintOrchestratorSigningPanel`
- transaction serialization helpers in `lib/core-candy-machine-admin.ts`
- imports and usage of `@solana/web3.js`

Each piece must end in one of these states:

- part of the canonical flow
- replaced by the canonical flow
- deleted
- documented as a strictly encapsulated temporary boundary

## Resolved Questions

### Does the collection have freeze?

It may have `PermanentFreezeDelegate`, but that does not enable owner-managed Stake / Unstake for each NFT.

### Does the asset have `FreezeDelegate Authority: Owner`?

No. The audited asset does not have it. DAS reports `plugins: {}`.

### Does the code include a function that prepares that plugin?

Yes. `prepareCoreCandyMachineMint` prepares `add-owner-freeze-plugin`.

### Is it connected to the visible `/admin/assets/new` flow?

Not canonically. That is the bug being fixed.

## Out Of Scope

- Mainnet.
- Authority rotation.
- Notary Anchor program changes.
- Distribution economics.
- Automatic historical reprocessing of NFTs already created without the plugin.
