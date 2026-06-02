# BRI-170 - Fix del mint marketplace para owner freeze

## Espanol

## Resumen

`BRI-170` corrige el planteamiento del flujo de owner freeze para BRIDS NFTs.

La frontera correcta es:

- `/admin/assets/new` crea y configura collections y Candy Machines.
- `/marketplace/[id]` es donde los usuarios mintean NFTs desde esas Candy Machines.
- El NFT que queda en la wallet del comprador debe recibir el plugin MPL Core `FreezeDelegate` con autoridad `Owner` durante el flujo de mint de marketplace.

El error de diseno anterior era intentar cerrar el problema desde `/admin/assets/new`, como si esa superficie debiera completar el ciclo de mint de NFTs del usuario. Eso esta mal planteado: el admin no esta minteando los NFTs finales del usuario desde esa pantalla; esta creando la infraestructura de mint.

## Problema

Un usuario puede mintear o poseer un NFT BRIDS valido, pero la UI de Stake / Unstake puede mostrarlo como `No soportado` si el asset no expone `FreezeDelegate` con autoridad `Owner`.

Ese estado es correcto desde la UI: si el asset no tiene el plugin real, el owner no puede ejecutar el freeze/unfreeze esperado para Stake / Unstake.

La correccion no debe forzar a `/admin/assets/new` a mintear NFTs. La correccion debe garantizar que el flujo de mint de marketplace produzca assets con la capacidad correcta.

## Aclaracion sobre plugins MPL Core

Hay dos conceptos diferentes que no deben mezclarse:

- `PermanentFreezeDelegate` en la collection: delega una capacidad permanente a nivel de collection o autoridad configurada. Sirve para control administrativo/delegado, pero no significa que cada NFT tenga freeze/unfreeze manejado por su owner.
- `FreezeDelegate` en el asset con autoridad `Owner`: es la capacidad que necesita Stake / Unstake para que el owner del NFT pueda congelar y descongelar su propio asset.

Por eso, una collection BRIDS puede tener `PermanentFreezeDelegate` y aun asi un NFT individual puede seguir siendo `No soportado` si sus `plugins` estan vacios o no incluyen `FreezeDelegate` con autoridad `Owner`.

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

El resultado `plugins: {}` explica por que Stake / Unstake lo muestra como `No soportado`.

## Causa raiz corregida

La causa raiz no es que `/admin/assets/new` no ejecute un mint completo.

La causa raiz real es que el camino canonico donde el comprador mintea en `/marketplace/[id]` no esta garantizando que el asset recien creado reciba `FreezeDelegate` con autoridad `Owner`.

Tambien existe codigo parcial asociado a mint/admin, pero ese codigo no debe confundirse con el flujo real de compra/minteo del usuario.

## Flujo canonico correcto

El flujo correcto queda definido asi:

1. El admin usa `/admin/assets/new`.
2. El sistema crea/configura la collection MPL Core.
3. El sistema crea/configura la Candy Machine y sus config lines.
4. El usuario entra a `/marketplace/[id]`.
5. El usuario mintea desde la Candy Machine con su wallet.
6. El asset minteado queda owned por la wallet del usuario.
7. En ese mismo lifecycle de mint se adjunta `FreezeDelegate` con autoridad `Owner`.
8. La UI de Stake / Unstake valida owner, collection y plugin real antes de habilitar acciones.

## Resultado esperado

Los NFTs BRIDS minteados por usuarios desde marketplace deben quedar con:

- collection BRIDS valida
- owner igual a la wallet compradora
- metadata/Core asset correcto
- `FreezeDelegate` instalado con autoridad `Owner`
- estado inicial no congelado salvo que el producto defina otra regla explicita
- trazabilidad suficiente para auditar preparacion, firma, envio, confirmacion y fallos

## Reglas estrictas

- No se acepta resolverlo con un override manual de DB.
- No se acepta asumir soporte de freeze por pertenecer a una collection.
- No se acepta confundir `PermanentFreezeDelegate` de collection con `FreezeDelegate Owner` del asset.
- No se debe mover el mint del usuario a `/admin/assets/new`.
- No se debe dejar ruta vieja u orfana que permita crear NFTs de usuario sin el plugin requerido.
- No se debe introducir una dependencia dominante nueva de `@solana/web3.js`.
- El camino nuevo debe favorecer Solana Kit / framework-kit; cualquier boundary legacy debe quedar encapsulado y justificado.

## Codigo a auditar

Este fix debe revisar y clasificar:

- flujo de creacion/configuracion en `/admin/assets/new`
- flujo de mint/compra en `/marketplace/[id]`
- servicios de purchase/mint que construyen transacciones MPL Core
- endpoints admin de Core Candy Machine que puedan estar huerfanos o ser solo dev/ops
- helpers de serializacion/transaccion relacionados con Candy Machine y mint
- imports y usos de `@solana/web3.js` dentro del scope tocado

Cada pieza debe terminar en uno de estos estados:

- parte del flujo canonico
- reemplazada por el flujo canonico
- eliminada
- boundary temporal documentado y encapsulado

## Preguntas resueltas

### `/admin/assets/new` debe mintear los NFTs del usuario?

No. Esa pantalla crea y configura Candy Machines. El mint real del usuario ocurre en `/marketplace/[id]`.

### La collection tiene freeze?

Puede tener `PermanentFreezeDelegate`, pero eso no habilita owner-managed Stake / Unstake para cada NFT.

### El asset necesita `FreezeDelegate Authority: Owner`?

Si. Stake / Unstake depende del plugin real del asset, no solo de la collection.

### Si el asset tiene `plugins: {}`, es soportado?

No. Debe mostrarse como `No soportado` hasta que exista un asset-level `FreezeDelegate` con autoridad `Owner`.

### Donde debe corregirse el bug principal?

En el flujo de mint de marketplace, porque alli nace el NFT que queda en la wallet del comprador.

## Fuera de alcance

- Mainnet.
- Rotacion de autoridades.
- Cambios al programa Anchor notarial.
- Reglas economicas de distribucion.
- Reprocesamiento automatico de NFTs historicos ya minteados sin plugin.
- Trasladar el mint de usuario a la pantalla admin.

## English

## Summary

`BRI-170` corrects the owner-freeze flow framing for BRIDS NFTs.

The correct boundary is:

- `/admin/assets/new` creates and configures collections and Candy Machines.
- `/marketplace/[id]` is where users mint NFTs from those Candy Machines.
- The NFT that lands in the buyer wallet must receive the MPL Core `FreezeDelegate` plugin with `Owner` authority during the marketplace mint flow.

The previous design mistake was trying to close the issue from `/admin/assets/new`, as if that surface should complete the user's NFT mint lifecycle. That is incorrectly framed: the admin is not minting the final user NFTs from that screen; the admin is creating the mint infrastructure.

## Problem

A user may mint or own a valid BRIDS NFT, but the Stake / Unstake UI may show it as `Unsupported` if the asset does not expose `FreezeDelegate` with `Owner` authority.

That UI state is correct: if the asset does not have the real plugin, the owner cannot execute the expected freeze/unfreeze operation for Stake / Unstake.

The fix must not force `/admin/assets/new` to mint NFTs. The fix must guarantee that the marketplace mint flow produces assets with the correct capability.

## MPL Core Plugin Clarification

There are two different concepts that must not be mixed:

- `PermanentFreezeDelegate` on the collection: delegates a permanent capability at collection or configured authority level. It is useful for administrative/delegated control, but it does not mean each NFT has owner-managed freeze/unfreeze.
- `FreezeDelegate` on the asset with `Owner` authority: this is the capability Stake / Unstake needs so the NFT owner can freeze and unfreeze their own asset.

Therefore, a BRIDS collection may have `PermanentFreezeDelegate` and an individual NFT can still be `Unsupported` if its `plugins` are empty or do not include `FreezeDelegate` with `Owner` authority.

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

The `plugins: {}` result explains why Stake / Unstake shows it as `Unsupported`.

## Corrected Root Cause

The root cause is not that `/admin/assets/new` fails to run a complete mint.

The real root cause is that the canonical buyer mint path in `/marketplace/[id]` does not guarantee that the newly created asset receives `FreezeDelegate` with `Owner` authority.

There is also partial mint/admin code, but that code must not be confused with the real user purchase/mint flow.

## Correct Canonical Flow

The correct flow is:

1. The admin uses `/admin/assets/new`.
2. The system creates/configures the MPL Core collection.
3. The system creates/configures the Candy Machine and its config lines.
4. The user opens `/marketplace/[id]`.
5. The user mints from the Candy Machine with their wallet.
6. The minted asset is owned by the user wallet.
7. The same mint lifecycle attaches `FreezeDelegate` with `Owner` authority.
8. The Stake / Unstake UI validates owner, collection, and real plugin before enabling actions.

## Expected Outcome

BRIDS NFTs minted by users from marketplace must have:

- valid BRIDS collection
- owner equal to the buyer wallet
- correct metadata/Core asset
- `FreezeDelegate` installed with `Owner` authority
- initially unfrozen state unless the product defines another explicit rule
- enough traceability to audit preparation, signing, submission, confirmation, and failures

## Strict Rules

- Do not solve this with a manual DB override.
- Do not assume freeze support only because the NFT belongs to a collection.
- Do not confuse collection `PermanentFreezeDelegate` with asset `FreezeDelegate Owner`.
- Do not move user minting into `/admin/assets/new`.
- Do not leave old or orphaned routes that can create user NFTs without the required plugin.
- Do not introduce a new dominant dependency on `@solana/web3.js`.
- The new path must favor Solana Kit / framework-kit; any legacy boundary must be encapsulated and justified.

## Code To Audit

This fix must review and classify:

- creation/configuration flow in `/admin/assets/new`
- purchase/mint flow in `/marketplace/[id]`
- purchase/mint services that build MPL Core transactions
- Core Candy Machine admin endpoints that may be orphaned or dev/ops-only
- serialization/transaction helpers related to Candy Machine and mint
- imports and uses of `@solana/web3.js` within the touched scope

Each piece must end as one of:

- part of the canonical flow
- replaced by the canonical flow
- removed
- documented and encapsulated temporary boundary

## Resolved Questions

### Should `/admin/assets/new` mint user NFTs?

No. That screen creates and configures Candy Machines. The real user mint happens in `/marketplace/[id]`.

### Does the collection have freeze?

It may have `PermanentFreezeDelegate`, but that does not enable owner-managed Stake / Unstake for each NFT.

### Does the asset need `FreezeDelegate Authority: Owner`?

Yes. Stake / Unstake depends on the real asset plugin, not only on the collection.

### If the asset has `plugins: {}`, is it supported?

No. It must be shown as `Unsupported` until there is an asset-level `FreezeDelegate` with `Owner` authority.

### Where should the main bug be fixed?

In the marketplace mint flow, because that is where the NFT that lands in the buyer wallet is created.

## Out Of Scope

- Mainnet.
- Authority rotation.
- Changes to the notary Anchor program.
- Economic distribution rules.
- Automatic reprocessing of historical NFTs already minted without the plugin.
- Moving user minting into the admin screen.
