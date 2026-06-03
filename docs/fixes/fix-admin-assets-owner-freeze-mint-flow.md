# BRI-170 - Fix del mint marketplace para owner freeze

## Espanol

## Resumen

`BRI-170` corrige el flujo de mint de marketplace para que los BRIDS NFTs minteados por usuarios queden aptos para Stake / Unstake con `FreezeDelegate` de autoridad `Owner`.

La frontera correcta es:

- `/admin/assets/new` crea y configura collections y Candy Machines.
- `/marketplace/[id]` es la superficie donde el usuario compra/mintea NFTs desde esas Candy Machines.
- El flujo real de transaccion pasa por `components/marketplace/PurchaseCta.tsx`, `/api/purchase/prepare`, `lib/purchase-service.ts`, `/api/purchase/submit`.
- Cada NFT que queda en la wallet del comprador debe recibir el plugin MPL Core `FreezeDelegate` con autoridad `Owner`.

El error de diseno anterior era intentar cerrar el problema desde `/admin/assets/new`, como si esa pantalla debiera completar el ciclo de mint de NFTs del usuario. Eso esta mal planteado: el admin crea la infraestructura de mint; el comprador mintea desde marketplace.

## Problema

Un usuario puede mintear o poseer un NFT BRIDS valido, pero la UI de Stake / Unstake debe mostrarlo como `No soportado` si el asset no expone `FreezeDelegate` con autoridad `Owner`.

Ese estado es correcto: si el asset no tiene el plugin real, el owner no puede ejecutar el freeze/unfreeze esperado para Stake / Unstake.

La correccion no debe mover el mint a `/admin/assets/new`. La correccion debe modificar el camino real de compra/minteo en marketplace para que cada asset minteado por el comprador quede con la capacidad correcta.

## Aclaracion estricta sobre plugins MPL Core

Hay dos conceptos diferentes que no deben mezclarse:

- `PermanentFreezeDelegate` en la collection: capacidad permanente a nivel de collection o autoridad configurada. Sirve para control administrativo/delegado y puede afectar una collection, pero no equivale a owner-managed Stake / Unstake por asset.
- `FreezeDelegate` en el asset con autoridad `Owner`: capacidad owner-managed que permite que el owner actual del NFT congele y descongele su propio asset.

`FreezeDelegate` es un plugin Owner Managed. Por tanto:

- agregarlo requiere firma del owner del asset;
- backend, admin, update authority o third-party signer no pueden agregarlo solos despues del mint;
- si se agrega en el lifecycle de compra, la transaccion debe incluir la firma del comprador/owner;
- si el asset cambia de owner en mercado secundario, el sistema debe verificar la autoridad vigente contra el owner actual antes de habilitar Stake / Unstake.

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

El codigo actual confirma la brecha:

```text
components/marketplace/PurchaseCta.tsx
  firma la transaccion preparada por /api/purchase/prepare

app/api/purchase/prepare/route.ts
  llama preparePurchase(...)

lib/purchase-service.ts
  buildMintBatch(...) agrega mintV1(...)
  no agrega addPlugin(... FreezeDelegate Owner ...) por cada asset minteado

app/api/purchase/submit/route.ts
  llama submitPurchase(...)

lib/stake-service.ts
  hoy considera soportado si existe asset.freezeDelegate
```

La validacion final no puede quedarse en `Boolean(asset.freezeDelegate)`. Debe comprobar la autoridad exacta del plugin.

## Causa raiz corregida

La causa raiz no es que `/admin/assets/new` no ejecute un mint completo.

La causa raiz real es que el camino canonico donde el comprador mintea en marketplace no garantiza que cada asset recien creado reciba `FreezeDelegate` con autoridad `Owner`.

Tambien existe codigo parcial asociado a mint/admin, pero ese codigo no define el flujo real de compra del usuario. Si esa ruta admin puede producir NFTs finales de usuario sin pasar por marketplace, debe eliminarse, bloquearse o quedar documentada como dev/ops-only sin exposicion de producto.

## Flujo canonico correcto

El flujo correcto queda definido asi:

1. El admin usa `/admin/assets/new`.
2. El sistema crea/configura la collection MPL Core.
3. El sistema crea/configura la Candy Machine y sus config lines.
4. El usuario entra a `/marketplace/[id]`.
5. `PurchaseCta` solicita challenge, llama `/api/purchase/prepare`, firma con la wallet del comprador y llama `/api/purchase/submit`.
6. `preparePurchase` construye el batch de mint desde la Candy Machine para la wallet compradora.
7. Para cada asset esperado del batch, el lifecycle debe incluir `FreezeDelegate` con autoridad `Owner`, firmado por el comprador/owner.
8. Si el plugin requiere otra transaccion por limites de tamano o restricciones MPL Core, el flujo debe quedar en estado recuperable y no puede presentarse como exito final hasta confirmar el plugin.
9. Despues de submit, el sistema confirma on-chain cada asset esperado y valida owner, collection y plugin real.
10. La UI de Stake / Unstake habilita acciones solo si la verificacion on-chain confirma la capacidad exacta.

## Resultado esperado

Cada NFT BRIDS minteado por usuarios desde marketplace debe quedar con:

- collection BRIDS esperada para el listing;
- owner igual a la wallet compradora;
- metadata/Core asset correcto;
- `FreezeDelegate` instalado con autoridad `Owner`;
- estado inicial no congelado salvo que el producto defina otra regla explicita;
- firma real del comprador en la instruccion/transaccion que agrega el plugin;
- verificacion post-submit por `expectedAssetAddresses`;
- trazabilidad suficiente para auditar preparacion, firma, envio, confirmacion y fallos.

## Reglas estrictas

- No se acepta resolverlo con un override manual de DB.
- No se acepta asumir soporte de freeze por pertenecer a una collection.
- No se acepta confundir `PermanentFreezeDelegate` de collection con `FreezeDelegate Owner` del asset.
- No se debe mover el mint del usuario a `/admin/assets/new`.
- No se debe agregar `FreezeDelegate` desde backend/admin/update authority sin firma del owner.
- No se debe marcar una compra como funcional para Stake / Unstake hasta verificar on-chain cada asset del batch.
- No se debe dejar ruta vieja u orfana que permita crear NFTs de usuario sin el plugin requerido.
- No se debe introducir una dependencia dominante nueva de `@solana/web3.js`.
- El camino nuevo debe favorecer Solana Kit / framework-kit; cualquier boundary legacy debe quedar encapsulado y justificado.

## Regla estricta Solana Kit para deploy y mint

El codigo de deploy y mint debe migrar hacia `@solana/kit` como SDK principal.

Aplica a:

- deploy/configuracion de Core Candy Machine;
- derivacion de direcciones y validacion de public keys;
- envio de transacciones y consulta de confirmacion;
- serializacion/deserializacion usada por las rutas de deploy/mint;
- paneles admin que firman transacciones preparadas;
- mint marketplace del comprador.

Regla:

- No se deben agregar nuevos imports directos de `@solana/web3.js` en servicios, rutas o componentes de deploy/mint.
- Si una dependencia legacy exige formas `web3.js` (`VersionedTransaction`, wallet-adapter, Umi/Metaplex adapter), ese uso debe quedar encapsulado en un boundary temporal dentro de `lib/solana-kit/compat/*`.
- Los tipos `PublicKey`, `Connection`, `Keypair`, `SystemProgram` y helpers equivalentes no deben filtrarse al dominio de deploy/mint cuando exista alternativa en Kit.
- La dependencia `@solana/web3.js` solo puede permanecer mientras sea transitiva o boundary legacy justificado; no debe ser el API principal del flujo nuevo.
- Los artefactos y tests deben poder explicar que Kit es el camino canonico y `web3.js` es compatibilidad temporal.

## Regla estricta Solana Kit para compra marketplace

La compra/mint desde marketplace tambien debe usar `@solana/kit` como frontera canonica para RPC.

Aplica a:

- `components/marketplace/PurchaseCta.tsx`;
- `/api/purchase/prepare`;
- `/api/purchase/submit`;
- `lib/purchase-service.ts`;
- helpers de serializacion, submit, confirmacion y lectura de estado usados por el flujo de compra.

Regla:

- `lib/purchase-service.ts` no debe crear conexiones legacy con `createLegacyConnection`.
- `lib/purchase-service.ts` no debe enviar transacciones con `sendLegacyVersionedTransaction`.
- `lib/purchase-service.ts` no debe confirmar firmas con `getLegacySignatureStatus`.
- El submit de compra debe usar `createKitRpcConnection`, `sendRawTransactionWithKitRpc` y `getSignatureStatusWithKitRpc`.
- El cliente puede seguir firmando `VersionedTransaction` solo mediante el boundary temporal `lib/solana-kit/compat/*`, porque wallet-adapter y Umi/Metaplex aun exigen esa forma.
- La compra no puede introducir imports directos de `@solana/web3.js` fuera del boundary.
- Debe existir una prueba de frontera que falle si marketplace purchase vuelve al RPC legacy.

## Regla de confirmacion para deploy admin

El deploy de Candy Machine no debe depender exclusivamente del webhook para desbloquear la finalizacion del snapshot.

Regla:

- `/api/admin/core-candy-machine/status` puede usar eventos webhook como senal rapida.
- Toda firma debe consultar RPC canonico con Kit antes de considerarse confirmada para `Create Asset`.
- Un evento webhook sin confirmacion RPC solo significa `observedByWebhook`; no desbloquea snapshot ni `Create Asset`.
- La UI de `/admin/assets/new` no debe quedar bloqueada en `Snapshot not finalized yet` cuando RPC ya confirma la firma.
- El snapshot solo debe finalizar cuando todas las firmas del deploy tienen `confirmed` o `finalized` por RPC canonico.
- Un status `processed`, `submitted`, `null` o solo-observado-por-webhook debe mantener el gate bloqueado.
- El fallback RPC debe tener test para evitar regresiones cuando Helius no entregue el webhook.

## Regla de readiness del snapshot admin

El snapshot de `/admin/assets/new` no debe exigir NFTs ya minteados.

Regla:

- `/admin/assets/new` crea collection, Candy Machine y config lines; no crea los NFTs finales del comprador.
- En este punto, DAS puede devolver `0` assets para la collection y eso no es un error.
- La readiness del snapshot admin debe verificarse contra el estado de la Candy Machine: collection on-chain correcta, `itemsLoaded` igual a la cantidad esperada y firmas de deploy confirmadas.
- La verificacion por DAS de assets minteados pertenece al flujo marketplace/post-compra, no al deploy administrativo.
- La UI no debe bloquear `Create Asset` por `Expected N items but found 0 via DAS` despues de desplegar una Candy Machine nueva.

## Codigo a auditar

Este fix debe revisar y clasificar:

- `app/marketplace/[id]/page.tsx`
- `components/marketplace/PurchaseCta.tsx`
- `app/api/purchase/prepare/route.ts`
- `app/api/purchase/submit/route.ts`
- `lib/purchase-service.ts`
- `lib/purchase-attempts-repository.ts`
- `lib/stake-service.ts`
- `app/api/protected/stake/assets/route.ts`
- `app/api/admin/core-candy-machine/deploy/prepare/route.ts`
- `app/api/admin/core-candy-machine/mint/prepare/route.ts`
- `app/api/admin/core-candy-machine/submit/route.ts`
- `components/admin/core-candy-machine-panel.tsx`
- `components/admin/mint-orchestrator-signing-panel.tsx`
- helpers de serializacion/transaccion relacionados con Candy Machine y purchase mint
- imports y usos de `@solana/web3.js` dentro del scope tocado

Cada pieza debe terminar en uno de estos estados:

- parte del flujo canonico;
- reemplazada por el flujo canonico;
- eliminada;
- dev/ops-only documentado y no expuesto a producto;
- boundary temporal documentado, encapsulado y con prueba que impida expansion.

## Preguntas resueltas

### `/admin/assets/new` debe mintear los NFTs del usuario?

No. Esa pantalla crea y configura Candy Machines. El mint real del usuario ocurre desde marketplace.

### Cual es la ruta real que debe corregirse?

`/marketplace/[id]` como superficie de usuario, y concretamente `PurchaseCta`, `/api/purchase/prepare`, `preparePurchase/buildMintBatch` y `/api/purchase/submit`.

### La collection tiene freeze?

Puede tener `PermanentFreezeDelegate`, pero eso no habilita owner-managed Stake / Unstake para cada NFT.

### El asset necesita `FreezeDelegate Authority: Owner`?

Si. Stake / Unstake depende del plugin real del asset, no solo de la collection.

### Quien debe firmar la instalacion de `FreezeDelegate`?

El owner del asset. En el mint marketplace, eso significa la wallet compradora. Backend/admin/update authority no son sustitutos validos.

### Si el asset tiene `plugins: {}`, es soportado?

No. Debe mostrarse como `No soportado` hasta que exista un asset-level `FreezeDelegate` con autoridad `Owner`.

### Que pasa con compras de multiples NFTs?

La regla aplica a cada asset en `expectedAssetAddresses`. No basta con validar el primer asset.

### Que pasa con mercado secundario?

El sistema debe verificar contra el owner actual. Si el NFT cambia de wallet, la UI debe seguir usando owner, collection y plugin real on-chain antes de habilitar Stake / Unstake.

## Fuera de alcance

- Mainnet.
- Rotacion de autoridades.
- Cambios al programa Anchor notarial.
- Reglas economicas de distribucion.
- Reprocesamiento automatico de NFTs historicos ya minteados sin plugin.
- Trasladar el mint de usuario a la pantalla admin.

## English

## Summary

`BRI-170` fixes the marketplace mint flow so BRIDS NFTs minted by users become eligible for Stake / Unstake with `FreezeDelegate` using `Owner` authority.

The correct boundary is:

- `/admin/assets/new` creates and configures collections and Candy Machines.
- `/marketplace/[id]` is the surface where users purchase/mint NFTs from those Candy Machines.
- The real transaction flow goes through `components/marketplace/PurchaseCta.tsx`, `/api/purchase/prepare`, `lib/purchase-service.ts`, `/api/purchase/submit`.
- Every NFT that lands in the buyer wallet must receive the MPL Core `FreezeDelegate` plugin with `Owner` authority.

The previous design mistake was trying to close the issue from `/admin/assets/new`, as if that screen should complete the user's NFT mint lifecycle. That is incorrectly framed: the admin creates mint infrastructure; the buyer mints from marketplace.

## Problem

A user may mint or own a valid BRIDS NFT, but the Stake / Unstake UI must show it as `Unsupported` if the asset does not expose `FreezeDelegate` with `Owner` authority.

That UI state is correct: if the asset does not have the real plugin, the owner cannot execute the expected freeze/unfreeze operation for Stake / Unstake.

The fix must not move minting to `/admin/assets/new`. The fix must modify the real marketplace purchase/mint path so every asset minted by the buyer has the correct capability.

## Strict MPL Core Plugin Clarification

There are two different concepts that must not be mixed:

- `PermanentFreezeDelegate` on the collection: permanent capability at collection or configured authority level. It is useful for administrative/delegated control and may affect a collection, but it is not equivalent to owner-managed Stake / Unstake per asset.
- `FreezeDelegate` on the asset with `Owner` authority: owner-managed capability that lets the current NFT owner freeze and unfreeze their own asset.

`FreezeDelegate` is an Owner Managed plugin. Therefore:

- adding it requires the asset owner's signature;
- backend, admin, update authority, or third-party signer cannot add it alone after mint;
- if it is added in the purchase lifecycle, the transaction must include the buyer/owner signature;
- if the asset changes owner on a secondary market, the system must verify the current authority against the current owner before enabling Stake / Unstake.

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

The current code confirms the gap:

```text
components/marketplace/PurchaseCta.tsx
  signs the transaction prepared by /api/purchase/prepare

app/api/purchase/prepare/route.ts
  calls preparePurchase(...)

lib/purchase-service.ts
  buildMintBatch(...) adds mintV1(...)
  does not add addPlugin(... FreezeDelegate Owner ...) for each minted asset

app/api/purchase/submit/route.ts
  calls submitPurchase(...)

lib/stake-service.ts
  currently treats the asset as supported if asset.freezeDelegate exists
```

Final validation cannot remain at `Boolean(asset.freezeDelegate)`. It must check the exact plugin authority.

## Corrected Root Cause

The root cause is not that `/admin/assets/new` fails to run a complete mint.

The real root cause is that the canonical marketplace buyer mint path does not guarantee that each newly created asset receives `FreezeDelegate` with `Owner` authority.

There is also partial mint/admin code, but that code does not define the real user purchase flow. If that admin route can create final user NFTs without going through marketplace, it must be removed, blocked, or documented as dev/ops-only with no product exposure.

## Correct Canonical Flow

The correct flow is:

1. The admin uses `/admin/assets/new`.
2. The system creates/configures the MPL Core collection.
3. The system creates/configures the Candy Machine and its config lines.
4. The user opens `/marketplace/[id]`.
5. `PurchaseCta` requests a challenge, calls `/api/purchase/prepare`, signs with the buyer wallet, and calls `/api/purchase/submit`.
6. `preparePurchase` builds the mint batch from the Candy Machine for the buyer wallet.
7. For every expected asset in the batch, the lifecycle must include `FreezeDelegate` with `Owner` authority, signed by the buyer/owner.
8. If the plugin requires another transaction because of size limits or MPL Core constraints, the flow must stay recoverable and cannot be presented as final success until the plugin is confirmed.
9. After submit, the system confirms each expected asset on-chain and validates owner, collection, and real plugin.
10. The Stake / Unstake UI enables actions only if on-chain verification confirms the exact capability.

## Expected Outcome

Every BRIDS NFT minted by users from marketplace must have:

- expected BRIDS collection for the listing;
- owner equal to the buyer wallet;
- correct metadata/Core asset;
- `FreezeDelegate` installed with `Owner` authority;
- initially unfrozen state unless the product defines another explicit rule;
- real buyer signature on the instruction/transaction that adds the plugin;
- post-submit verification by `expectedAssetAddresses`;
- enough traceability to audit preparation, signing, submission, confirmation, and failures.

## Strict Rules

- Do not solve this with a manual DB override.
- Do not assume freeze support only because the NFT belongs to a collection.
- Do not confuse collection `PermanentFreezeDelegate` with asset `FreezeDelegate Owner`.
- Do not move user minting into `/admin/assets/new`.
- Do not add `FreezeDelegate` from backend/admin/update authority without owner signature.
- Do not mark a purchase as functional for Stake / Unstake until every asset in the batch is verified on-chain.
- Do not leave old or orphaned routes that can create user NFTs without the required plugin.
- Do not introduce a new dominant dependency on `@solana/web3.js`.
- The new path must favor Solana Kit / framework-kit; any legacy boundary must be encapsulated and justified.

## Strict Solana Kit Rule For Deploy And Mint

Deploy and mint code must migrate toward `@solana/kit` as the primary SDK.

This applies to:

- Core Candy Machine deploy/configuration;
- address derivation and public key validation;
- transaction submission and confirmation polling;
- serialization/deserialization used by deploy/mint routes;
- admin panels that sign prepared transactions;
- buyer marketplace mint.

Rule:

- Do not add new direct `@solana/web3.js` imports in deploy/mint services, routes, or components.
- If a legacy dependency requires `web3.js` shapes (`VersionedTransaction`, wallet-adapter, Umi/Metaplex adapter), that usage must be encapsulated in a temporary boundary under `lib/solana-kit/compat/*`.
- `PublicKey`, `Connection`, `Keypair`, `SystemProgram`, and equivalent helpers must not leak into the deploy/mint domain when a Kit alternative exists.
- The `@solana/web3.js` dependency may remain only as a transitive or justified legacy boundary; it must not be the primary API for the new flow.
- Artifacts and tests must make clear that Kit is the canonical path and `web3.js` is temporary compatibility.

## Strict Solana Kit Rule For Marketplace Purchase

The marketplace purchase/mint flow must also use `@solana/kit` as the canonical RPC boundary.

Applies to:

- `components/marketplace/PurchaseCta.tsx`;
- `/api/purchase/prepare`;
- `/api/purchase/submit`;
- `lib/purchase-service.ts`;
- serialization, submit, confirmation, and status-reading helpers used by the purchase flow.

Rule:

- `lib/purchase-service.ts` must not create legacy connections with `createLegacyConnection`.
- `lib/purchase-service.ts` must not send transactions with `sendLegacyVersionedTransaction`.
- `lib/purchase-service.ts` must not confirm signatures with `getLegacySignatureStatus`.
- Purchase submit must use `createKitRpcConnection`, `sendRawTransactionWithKitRpc`, and `getSignatureStatusWithKitRpc`.
- The client may still sign `VersionedTransaction` only through the temporary `lib/solana-kit/compat/*` boundary, because wallet-adapter and Umi/Metaplex still require that shape.
- Purchase must not introduce direct `@solana/web3.js` imports outside the boundary.
- A boundary test must fail if marketplace purchase returns to legacy RPC.

## Admin Deploy Confirmation Rule

Candy Machine deploy must not depend exclusively on webhooks to unlock snapshot finalization.

Rule:

- `/api/admin/core-candy-machine/status` may use webhook events as the fast signal.
- Every signature must query canonical RPC through Kit before it is considered confirmed for `Create Asset`.
- A webhook event without RPC confirmation only means `observedByWebhook`; it does not unlock the snapshot or `Create Asset`.
- The `/admin/assets/new` UI must not remain blocked at `Snapshot not finalized yet` when RPC already confirms the signature.
- The snapshot may only finalize when every deploy signature is `confirmed` or `finalized` by canonical RPC.
- A `processed`, `submitted`, `null`, or webhook-observed-only status must keep the gate blocked.
- The RPC fallback must have a test to prevent regressions when Helius does not deliver the webhook.

## Admin Snapshot Readiness Rule

The `/admin/assets/new` snapshot must not require already-minted NFTs.

Rule:

- `/admin/assets/new` creates the collection, Candy Machine, and config lines; it does not create the buyer's final NFTs.
- At this point, DAS may return `0` assets for the collection and that is not an error.
- Admin snapshot readiness must be verified against Candy Machine state: correct on-chain collection, `itemsLoaded` equal to the expected quantity, and confirmed deploy signatures.
- DAS verification of minted assets belongs to the marketplace/post-purchase flow, not administrative deploy.
- The UI must not block `Create Asset` with `Expected N items but found 0 via DAS` after deploying a new Candy Machine.

## Code To Audit

This fix must review and classify:

- `app/marketplace/[id]/page.tsx`
- `components/marketplace/PurchaseCta.tsx`
- `app/api/purchase/prepare/route.ts`
- `app/api/purchase/submit/route.ts`
- `lib/purchase-service.ts`
- `lib/purchase-attempts-repository.ts`
- `lib/stake-service.ts`
- `app/api/protected/stake/assets/route.ts`
- `app/api/admin/core-candy-machine/deploy/prepare/route.ts`
- `app/api/admin/core-candy-machine/mint/prepare/route.ts`
- `app/api/admin/core-candy-machine/submit/route.ts`
- `components/admin/core-candy-machine-panel.tsx`
- `components/admin/mint-orchestrator-signing-panel.tsx`
- serialization/transaction helpers related to Candy Machine and purchase mint
- imports and uses of `@solana/web3.js` within the touched scope

Each piece must end as one of:

- part of the canonical flow;
- replaced by the canonical flow;
- removed;
- documented dev/ops-only with no product exposure;
- documented, encapsulated temporary boundary with a test preventing expansion.

## Resolved Questions

### Should `/admin/assets/new` mint user NFTs?

No. That screen creates and configures Candy Machines. The real user mint happens from marketplace.

### Which real path must be fixed?

`/marketplace/[id]` as the user surface, and specifically `PurchaseCta`, `/api/purchase/prepare`, `preparePurchase/buildMintBatch`, and `/api/purchase/submit`.

### Does the collection have freeze?

It may have `PermanentFreezeDelegate`, but that does not enable owner-managed Stake / Unstake for each NFT.

### Does the asset need `FreezeDelegate Authority: Owner`?

Yes. Stake / Unstake depends on the real asset plugin, not only on the collection.

### Who must sign the `FreezeDelegate` installation?

The asset owner. In marketplace mint, that means the buyer wallet. Backend/admin/update authority are not valid substitutes.

### If the asset has `plugins: {}`, is it supported?

No. It must be shown as `Unsupported` until there is an asset-level `FreezeDelegate` with `Owner` authority.

### What about purchases with multiple NFTs?

The rule applies to every asset in `expectedAssetAddresses`. Validating only the first asset is not enough.

### What about secondary market transfers?

The system must verify against the current owner. If the NFT moves to another wallet, the UI must still use owner, collection, and real on-chain plugin before enabling Stake / Unstake.

## Out Of Scope

- Mainnet.
- Authority rotation.
- Changes to the notary Anchor program.
- Economic distribution rules.
- Automatic reprocessing of historical NFTs already minted without the plugin.
- Moving user minting into the admin screen.
