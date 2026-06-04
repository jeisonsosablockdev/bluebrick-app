# implementation(fix): BRI-170 marketplace mint owner freeze flow

## Espanol

## Objetivo de implementacion

Implementar un flujo canonico y auditable donde `/admin/assets/new` crea/configura Candy Machines y `/marketplace/[id]` mintea los NFTs del usuario con `FreezeDelegate` de autoridad `Owner`.

La implementacion no debe convertir `/admin/assets/new` en una pantalla de mint para usuarios. Debe corregir el punto donde realmente nace el NFT del comprador: `PurchaseCta` -> `/api/purchase/prepare` -> `preparePurchase/buildMintBatch` -> wallet signature -> `/api/purchase/submit`.

## Correccion de alcance

El alcance anterior estaba mal planteado porque mezclaba dos responsabilidades:

- Admin: crear collection, crear Candy Machine y cargar config lines.
- Marketplace: mintear el NFT que queda owned por la wallet compradora.

La capacidad owner-managed de Stake / Unstake debe agregarse en el segundo flujo, no en la creacion administrativa de la Candy Machine.

## Reglas Solana no negociables

- `FreezeDelegate` es Owner Managed: agregarlo requiere firma del owner del asset.
- En marketplace mint, el owner esperado es la wallet compradora.
- Backend, admin, update authority y third-party signer no pueden agregar el `FreezeDelegate Owner` sin firma del comprador.
- La solucion debe cubrir `quantity > 1`; cada asset en `expectedAssetAddresses` debe quedar verificado.
- Si `mintV1 + addPlugin(FreezeDelegate Owner)` no cabe o no puede ejecutarse en una sola transaccion, el producto debe usar un paso de continuacion/recovery y no mostrar exito final hasta que el plugin quede confirmado.
- La verificacion de soporte debe validar autoridad exacta, no solo presencia booleana de `asset.freezeDelegate`.
- Todo dato RPC/DAS se trata como no confiable hasta validar owner, collection, plugin authority, firma y estado de transaccion.

## Branching canonico

Rama de iniciativa:

```text
initiative/bri-170-admin-assets-owner-freeze-mint-flow
```

Slices:

```text
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s01-spec
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s02-marketplace-mint-contract
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s03-marketplace-owner-freeze
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s04-marketplace-purchase-kit-rpc
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s05-deploy-status-rpc-fallback
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s06-deploy-snapshot-readiness
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s07-snapshot-confirmation-gate
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s08-snapshot-state-propagation
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s09-post-create-handoff-ui
fix/app-marketplace-purchase-asset-verification-window-bri-170-s10
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s11-cleanup-legacy-paths
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s12-verification-security
```

Todos los slices salen de la rama de iniciativa y abren PR contra la rama de iniciativa. La iniciativa completa abre PR final hacia `develop`.

## S01 - Spec

Responsabilidad:

- corregir la frontera conceptual entre admin y marketplace
- documentar diferencia entre `PermanentFreezeDelegate` de collection y `FreezeDelegate Owner` del asset
- documentar que `FreezeDelegate` exige firma del owner
- documentar el lifecycle transaccional esperado
- documentar el inventario de codigo a auditar
- definir el contrato de pruebas primero
- sincronizar Linear

Archivos esperados:

- `docs/fixes/fix-admin-assets-owner-freeze-mint-flow.md`
- `docs/fixes/fix-admin-assets-owner-freeze-mint-flow-implementation.md`

Gates:

- `npm run validate:docs-governance`
- Linear actualizado con branch/slices reales

## S02 - Contrato del mint marketplace

Responsabilidad:

- identificar el builder real que prepara el mint: `lib/purchase-service.ts` -> `preparePurchase` -> `buildMintBatch`
- identificar la superficie cliente: `components/marketplace/PurchaseCta.tsx`
- identificar los endpoints canonicos: `/api/purchase/prepare` y `/api/purchase/submit`
- agregar pruebas primero para demostrar que el mint del comprador produce assets con `FreezeDelegate Owner`
- definir trazabilidad minima para preparacion, firma, envio, confirmacion, recovery y fallo
- definir una estrategia explicita para `quantity > 1`
- no tocar todavia rutas admin salvo para clasificarlas como dependencia, boundary u huerfanas

Contrato minimo:

```text
marketplace mint batch
  buyer wallet signs the mint/plugin lifecycle
  for each expectedAssetAddress:
    asset.owner == buyer wallet
    asset.collection == BRIDS collection expected for the listing
    asset.freezeDelegate exists
    asset.freezeDelegate.authority.type == Owner
    asset starts unfrozen unless an explicit product rule says otherwise
```

Pruebas primero:

- `preparePurchase`/`buildMintBatch` incluye la instruccion necesaria para adjuntar `FreezeDelegate Owner` por cada asset, o devuelve un plan explicito de continuacion/recovery.
- El plan de transaccion exige firma de la wallet compradora para la instruccion que agrega `FreezeDelegate`.
- El flujo falla, queda recoverable o no finaliza como soportado si falta el plugin esperado.
- El resultado esperado no depende de un override de DB.
- La verificacion de inventario rechaza assets con `plugins: {}`.
- La verificacion de inventario rechaza assets con `FreezeDelegate` cuya autoridad no sea `Owner`.
- El contrato cubre batch con `quantity > 1`.
- El contrato cubre transfer secundario: despues de transferir, la UI valida contra el owner actual antes de habilitar Stake / Unstake.

Gates:

- tests unitarios del builder/servicio de marketplace
- tests de inventario Stake / Unstake
- `npm run typecheck`

## S03 - Marketplace owner freeze

Responsabilidad:

- implementar el cambio en `preparePurchase/buildMintBatch` para que cada NFT minteado por el comprador reciba `FreezeDelegate` con autoridad `Owner`
- mantener `/admin/assets/new` limitado a deploy/config de collection y Candy Machine
- actualizar `PurchaseCta` solo si el contrato de firma requiere nuevo payload, resumen o paso de continuacion
- registrar o exponer evidencia suficiente del lifecycle de mint
- confirmar post-submit cada asset esperado antes de considerarlo apto para Stake / Unstake
- asegurar que la UI de Stake / Unstake detecte el NFT como soportado solo cuando el plugin real exista y tenga autoridad `Owner`
- favorecer Solana Kit / framework-kit en el codigo nuevo

Regla de atomicidad:

El flujo puede ser multi-transaccion si MPL Core/Candy Machine lo requiere, pero no puede dejar exito silencioso si el mint ocurrio y el owner freeze plugin no quedo aplicado. La UI debe quedar en estado recuperable y la trazabilidad debe indicar exactamente que paso fallo.

Regla de plugin:

Un NFT BRIDS elegible para Stake / Unstake debe verificarse como:

```text
asset.collection == collection BRIDS esperada
asset.owner == wallet compradora o owner actual si hubo transferencia
asset.freezeDelegate exists
asset.freezeDelegate.authority.type == Owner
```

Regla de submit:

Despues de `/api/purchase/submit`, el backend debe:

- confirmar que la transaccion no fallo (`meta.err == null` cuando se consulte);
- validar que cada `expectedAssetAddress` existe on-chain;
- validar owner y collection;
- validar `FreezeDelegate Owner`;
- dejar intento en estado recuperable/fallido si falta cualquier asset o plugin.

Persistencia minima:

- `purchase_attempts` debe guardar `expected_asset_addresses`, `verified_asset_addresses`, `asset_verification_status`, `asset_verification_error` y `asset_verification_checked_at`.
- Estos campos son evidencia del intento de compra y su verificacion; no reemplazan la verdad on-chain ni crean un ledger de staking.

Gates:

- tests del flujo marketplace
- tests de submit/verificacion post-submit
- tests de estado UI para soportado/no soportado
- `npm run validate`

## S04 - Marketplace purchase Kit RPC boundary

Responsabilidad:

- migrar `lib/purchase-service.ts` para que el submit y la confirmacion de compra marketplace usen `@solana/kit` como frontera RPC canonica
- reemplazar `createLegacyConnection` por `createKitRpcConnection`
- reemplazar `sendLegacyVersionedTransaction` por `sendRawTransactionWithKitRpc`
- reemplazar `getLegacySignatureStatus` por `getSignatureStatusWithKitRpc`
- mantener `VersionedTransaction` solo como compatibilidad temporal encapsulada en `lib/solana-kit/compat/*`
- no cambiar el contrato funcional de compra, challenge, firma de wallet ni verificacion post-submit
- no introducir imports directos de `@solana/web3.js` en rutas, servicios o componentes de compra marketplace

Pruebas primero:

- extender la prueba de frontera para que falle si `lib/purchase-service.ts` vuelve a usar `createLegacyConnection`
- extender la prueba de frontera para que falle si `lib/purchase-service.ts` vuelve a usar `sendLegacyVersionedTransaction`
- extender la prueba de frontera para que falle si `lib/purchase-service.ts` vuelve a usar `getLegacySignatureStatus`
- mantener pruebas del flujo de compra marketplace y verificacion post-submit

Gates:

- `npx vitest run tests/lib/solana-kit-deploy-mint-boundary.test.ts`
- `npx vitest run tests/lib/purchase-service.test.ts tests/api/purchase-submit-route.test.ts tests/components/marketplace-purchase*.test.ts`
- `npm run typecheck`
- `npm run validate`

## S05 - Deploy status RPC fallback

Responsabilidad:

- corregir `/api/admin/core-candy-machine/status` para que no dependa solo de eventos webhook
- conservar webhook Helius como senal rapida cuando existe
- consultar RPC con Kit para decidir confirmacion canonica de cada firma
- devolver una entrada no-null cuando RPC confirme o finalice la firma
- permitir que `CoreCandyMachinePanel` continue a `finalizeSnapshot` cuando todas las firmas esten `confirmed` o `finalized` por RPC
- devolver `observedByWebhook` como senal informativa, no como confirmacion suficiente

Pruebas primero:

- route test donde webhook devuelve `null` y RPC Kit devuelve `confirmed`
- route test donde webhook observa la firma pero RPC aun no confirma; resultado esperado `confirmed=false`
- route test no permite acceso no-admin

Gates:

- `npx vitest run tests/api/admin-core-candy-machine-status-route.test.ts`
- `npm run validate`

## S06 - Deploy snapshot readiness

Responsabilidad:

- corregir `finalizeCoreCandyMachineSnapshot` para que el deploy admin no exija NFTs ya minteados por DAS
- validar readiness contra Candy Machine on-chain: collection correcta, `itemsLoaded` igual a la cantidad esperada, firmas de deploy confirmadas
- mantener DAS como verificacion del flujo marketplace/post-compra, no como gate del deploy administrativo
- corregir el status del snapshot cuando las pruebas son `create-collection`, `create-candy-machine` y `add-config-lines` en vez de `mint`
- evitar que la UI muestre `Deploy confirmed, but mint snapshot is not ready` para una Candy Machine correctamente desplegada pero sin NFTs minteados

Pruebas primero:

- service test donde DAS devuelve `0`, `itemsLoaded === quantity`, collection correcta y deploy proofs confirmadas; resultado esperado `canCreateAsset=true`
- service test donde `itemsLoaded < quantity`; resultado esperado bloqueado con error claro
- service test donde alguna firma de deploy no esta confirmada; resultado esperado bloqueado

Gates:

- `npx vitest run tests/lib/core-candy-machine-snapshot-service.test.ts`
- `npm run validate`

## S07 - Deploy snapshot confirmation gate

Responsabilidad:

- corregir `CoreCandyMachinePanel` para que no trate cualquier objeto de status como confirmacion suficiente
- aceptar solo status `confirmed` o `finalized` para continuar a `snapshot/finalize`
- bloquear `Create Asset` si el status esta `processed`, `submitted`, `null`, fallido o solo observado por webhook
- corregir `finalizeCoreCandyMachineSnapshot` para que no marque proofs `processed` como `confirmed`
- mantener Helius como observador rapido y RPC Kit como arbitro final

Pruebas primero:

- component test del helper de confirmacion del panel
- route test donde webhook observado no desbloquea sin RPC confirmado
- service test donde proof `processed` queda bloqueado

Gates:

- `npx vitest run tests/api/admin-core-candy-machine-status-route.test.ts tests/components/core-candy-machine-panel-snapshot-gate.test.ts tests/lib/core-candy-machine-snapshot-service.test.ts`
- `npm run validate`

## S08 - Propagacion del estado de Candy Machine

Responsabilidad:

- corregir `finalizeCoreCandyMachineSnapshot` para que no falle por una lectura parcial inmediata de `itemsLoaded` cuando todas las firmas `add-config-lines` ya estan confirmadas
- reintentar la lectura on-chain de la Candy Machine por una ventana acotada antes de marcar `CONFIG_LINES_NOT_LOADED`
- mantener fallos definitivos sin retry para no ocultar configuraciones incorrectas
- registrar en el error los intentos de lectura, limite de intentos, `itemsLoaded`, `itemsAvailable` y ultimo error de lectura si existe
- permitir configurar la ventana con `CORE_CM_SNAPSHOT_STATE_MAX_ATTEMPTS` y `CORE_CM_SNAPSHOT_STATE_RETRY_MS`

Fallos definitivos:

- collection on-chain distinta a la collection enviada en el request
- `itemsAvailable` distinto a la cantidad esperada
- `itemsLoaded` mayor que la cantidad esperada
- firma de deploy fallida o no confirmada por RPC canonico

Pruebas primero:

- service test donde la primera lectura devuelve `itemsLoaded < quantity`, la segunda devuelve `itemsLoaded === quantity` y el snapshot queda `ready`
- service test donde `itemsAvailable !== quantity`; resultado esperado `CANDY_MACHINE_QUANTITY_MISMATCH` sin retry
- service test donde collection on-chain no coincide; resultado esperado `COLLECTION_ADDRESS_MISMATCH` sin retry
- mantener prueba donde `itemsLoaded < quantity` y se agota la ventana; resultado esperado `CONFIG_LINES_NOT_LOADED`

Gates:

- `npx vitest run tests/lib/core-candy-machine-snapshot-service.test.ts`
- `npm run validate`

## S09 - Handoff UI despues de Create Asset

Responsabilidad:

- agregar animacion visible en Paso 2 cuando se generan `Collection URI` y `Asset URI`
- mantener el deploy bloqueado hasta que los URIs sean metadata JSON validos
- despues de crear la entrada, mostrar `Entrada creada` unos instantes y luego convertir el CTA principal en `Ver marketplace`
- navegar a `/marketplace/{entryId}` desde el CTA principal cuando el estado ya este listo
- convertir el CTA secundario en `Crear otro` despues de crear la entrada
- `Crear otro` debe limpiar formulario, deploy, snapshot, mensajes, uploads temporales y reiniciar con nuevo draft

Pruebas primero:

- reducer/state test donde un estado post-create se resetea y limpia `showMintSetup`, `deployCompletedData`, `snapshotFinalize`, `createdMarketplaceEntryId`, mensajes y uploads
- typecheck para validar que la navegacion y el reset usan el contrato del hook

Gates:

- `npx vitest run tests/lib/asset-creation-state.test.ts`
- `npm run lint`
- `npm run typecheck`
- `npm run validate`

## S10 - Ventana de verificacion de assets post-compra

Responsabilidad:

- ampliar la ventana de verificacion de assets MPL Core despues de que la transaccion de compra confirma
- hacer la ventana configurable y acotada con `PURCHASE_ASSET_VERIFICATION_MAX_ATTEMPTS` y `PURCHASE_ASSET_VERIFICATION_RETRY_MS`
- mantener fallos definitivos cuando el asset leido tiene owner incorrecto, collection incorrecta o no expone `FreezeDelegate Owner`
- agregar detalles de diagnostico al error cuando se agota la ventana
- evitar que un caso normal de propagacion RPC/devnet vuelva a marcar como `TRANSACTION_FAILED` una compra que si confirmo on-chain

Pruebas primero:

- test de configuracion default que evita regresar a una ventana corta de 8 segundos
- test de overrides acotados para evitar ventanas absurdas
- test de overrides invalidos que vuelven al default seguro

Gates:

- `npx vitest run tests/lib/purchase-service.test.ts`
- `npm run lint`
- `npm run typecheck`
- `npm run validate`

## S11 - Cleanup de rutas y codigo huerfano

Responsabilidad:

- auditar rutas admin de Core Candy Machine y decidir si son canonicas, dev/ops-only o huerfanas
- eliminar codigo que sugiera que `/admin/assets/new` mintea NFTs finales del usuario
- retirar rutas viejas que puedan crear NFTs incompletos o documentarlas como boundary temporal estrictamente bloqueado
- clasificar `app/api/admin/core-candy-machine/mint/prepare/route.ts`; si produce NFTs owner=admin, no puede ser flujo de producto para compradores
- si la ruta se conserva temporalmente, debe responder bloqueada (`410 Gone`) para admins autenticados y no preparar transacciones de mint
- impedir que `prepareCoreCandyMachineMint` sea copiado como solucion marketplace si conserva `owner: payerSigner.publicKey`
- encapsular o eliminar imports de `@solana/web3.js` dentro del scope tocado
- asegurar que el camino canonico no dependa de una ruta alternativa que salte el plugin owner freeze

Regla Solana Kit para deploy y mint:

- `@solana/kit` es el SDK canonico para el codigo de deploy/mint nuevo o tocado.
- No se permiten nuevos imports directos de `@solana/web3.js` en servicios, rutas o componentes de deploy/mint.
- Migrar validacion de public keys, derivacion de direcciones, RPC submit/confirm y lectura de transacciones hacia Kit cuando exista equivalente.
- Encapsular `VersionedTransaction` y conversiones Umi/Metaplex/wallet-adapter en `lib/solana-kit/compat/*` si aun son inevitables.
- `lib/core-candy-machine-admin.ts`, `components/admin/core-candy-machine-panel.tsx`, `components/admin/metaplex-core-mint-panel.tsx`, `lib/candy-guard-payment-config.ts` y `lib/purchase-third-party-signer.ts` no deben depender directamente de `@solana/web3.js` despues del slice.
- Si algun uso no puede migrarse sin reemplazar una dependencia externa, debe quedar documentado como boundary temporal con razon tecnica y test de contencion.

Inventario inicial:

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
- helpers de serializacion/transaccion en Core Candy Machine y purchase mint

Cada elemento debe terminar como:

- canonico;
- eliminado;
- reemplazado;
- dev/ops-only documentado y no expuesto a producto;
- boundary temporal documentado y probado.

Pruebas primero:

- route tests para rutas canonicas esperadas
- pruebas de ausencia, bloqueo o no exposicion de rutas viejas si se eliminan
- grep/test para evitar que el flujo canonico nuevo dependa directamente de `@solana/web3.js` fuera de boundaries permitidos
- test de que `prepareCoreCandyMachineMint` no es usado por el flujo marketplace
- test o grep que demuestre que deploy/mint no importa `@solana/web3.js` fuera de `lib/solana-kit/compat/*`

Gates:

- `npm test`
- `npm run validate`

## S12 - Verificacion, seguridad y cierre

Responsabilidad:

- ejecutar proof real en devnet
- mintear desde `/marketplace/[id]`, no desde `/admin/assets/new`
- verificar con RPC/DAS cada asset minteado
- verificar que cada asset tiene `FreezeDelegate` con autoridad `Owner`
- verificar que Stake / Unstake muestra cada NFT como soportado
- verificar caso de mercado secundario: transfer a otra wallet devnet y revalidar que la UI usa owner actual
- actualizar documentacion canonica si el flujo final cambia contratos
- ejecutar clean-code, security review y reviewer final
- abrir PR final de iniciativa hacia `develop`

Evidencia requerida:

- firma del mint de marketplace
- si aplica, firma separada de `addPlugin(FreezeDelegate Owner)`
- asset addresses completos del batch
- collection address
- wallet compradora
- prueba RPC/DAS por cada asset del plugin `FreezeDelegate Owner`
- prueba de owner actual despues de transfer secundario devnet
- prueba UI de Stake / Unstake soportado
- resultado de `npm run validate`
- notas de seguridad

## Restricciones Solana

- Devnet por defecto.
- No mainnet.
- No pedir ni almacenar private keys.
- No firmar ni enviar sin accion explicita de wallet/admin.
- Simular cuando aplique antes de pedir firma.
- Tratar todo dato RPC/DAS como no confiable.
- Validar owner, collection, firma, estado de transaccion y plugin real.

## Solana Kit / framework-kit

El camino canonico nuevo debe favorecer:

- Solana Kit / framework-kit para cliente y RPC
- wallet-standard/framework-kit para signing UI cuando aplique
- boundaries legacy encapsulados solo si una libreria Metaplex exige tipos heredados

El repo tiene dependencias y codigo legacy con `@solana/web3.js`. Para este fix:

- no se permite expandir `@solana/web3.js` como mecanismo principal del flujo nuevo;
- si una libreria Metaplex/Umi o wallet adapter exige `VersionedTransaction`, ese uso debe quedar en un boundary nombrado y probado;
- el scope nuevo debe preferir Kit para validacion, RPC y helpers internos cuando sea viable;
- cualquier import directo nuevo de `@solana/web3.js` fuera del boundary debe bloquearse en tests o quedar justificado en el slice.

## Definition of Done

- S01-S12 mergeados en la rama de iniciativa.
- PR final de iniciativa mergeado a `develop`.
- `/admin/assets/new` queda limitado a crear/configurar collections y Candy Machines.
- `/marketplace/[id]` mintea NFTs con `FreezeDelegate Owner`.
- Cada asset de `expectedAssetAddresses` queda verificado post-submit.
- No rutas viejas capaces de crear NFTs de usuario incompletos.
- Stake / Unstake reconoce los NFTs creados por el flujo nuevo como soportados solo con autoridad `Owner`.
- Secondary transfer devnet probado contra owner actual.
- Devnet proof con firma real y verificacion RPC/DAS.
- `npm run validate` pasa.
- Linear `BRI-170` queda actualizado con PRs, pruebas y evidencia.

## English

## Implementation Objective

Implement a canonical and auditable flow where `/admin/assets/new` creates/configures Candy Machines and `/marketplace/[id]` mints user NFTs with `FreezeDelegate` using `Owner` authority.

The implementation must not turn `/admin/assets/new` into a user mint screen. It must fix the point where the buyer NFT is actually created: `PurchaseCta` -> `/api/purchase/prepare` -> `preparePurchase/buildMintBatch` -> wallet signature -> `/api/purchase/submit`.

## Scope Correction

The previous scope was incorrectly framed because it mixed two responsibilities:

- Admin: create collection, create Candy Machine, and load config lines.
- Marketplace: mint the NFT that is owned by the buyer wallet.

The owner-managed Stake / Unstake capability must be added in the second flow, not in the administrative Candy Machine creation flow.

## Non-Negotiable Solana Rules

- `FreezeDelegate` is Owner Managed: adding it requires the asset owner's signature.
- In marketplace mint, the expected owner is the buyer wallet.
- Backend, admin, update authority, and third-party signer cannot add `FreezeDelegate Owner` without buyer signature.
- The solution must cover `quantity > 1`; every asset in `expectedAssetAddresses` must be verified.
- If `mintV1 + addPlugin(FreezeDelegate Owner)` does not fit or cannot execute in one transaction, the product must use a continuation/recovery step and must not show final success until the plugin is confirmed.
- Support verification must validate exact authority, not only boolean presence of `asset.freezeDelegate`.
- Every RPC/DAS value is untrusted until owner, collection, plugin authority, signature, and transaction state are validated.

## Canonical Branching

Initiative branch:

```text
initiative/bri-170-admin-assets-owner-freeze-mint-flow
```

Slices:

```text
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s01-spec
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s02-marketplace-mint-contract
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s03-marketplace-owner-freeze
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s04-marketplace-purchase-kit-rpc
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s05-deploy-status-rpc-fallback
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s06-deploy-snapshot-readiness
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s07-snapshot-confirmation-gate
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s08-snapshot-state-propagation
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s09-post-create-handoff-ui
fix/app-marketplace-purchase-asset-verification-window-bri-170-s10
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s11-cleanup-legacy-paths
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s12-verification-security
```

All slices branch from the initiative branch and open PRs into the initiative branch. The complete initiative opens a final PR into `develop`.

## S01 - Spec

Responsibility:

- correct the conceptual boundary between admin and marketplace
- document the difference between collection `PermanentFreezeDelegate` and asset `FreezeDelegate Owner`
- document that `FreezeDelegate` requires owner signature
- document the expected transaction lifecycle
- document the code inventory to audit
- define the test-first contract
- sync Linear

Expected files:

- `docs/fixes/fix-admin-assets-owner-freeze-mint-flow.md`
- `docs/fixes/fix-admin-assets-owner-freeze-mint-flow-implementation.md`

Gates:

- `npm run validate:docs-governance`
- Linear updated with real branches/slices

## S02 - Marketplace Mint Contract

Responsibility:

- identify the real mint builder: `lib/purchase-service.ts` -> `preparePurchase` -> `buildMintBatch`
- identify the client surface: `components/marketplace/PurchaseCta.tsx`
- identify canonical endpoints: `/api/purchase/prepare` and `/api/purchase/submit`
- add tests first to prove the buyer mint produces assets with `FreezeDelegate Owner`
- define minimum traceability for preparation, signing, submission, confirmation, recovery, and failure
- define an explicit strategy for `quantity > 1`
- do not touch admin routes yet except to classify them as dependency, boundary, or orphaned

Minimum contract:

```text
marketplace mint batch
  buyer wallet signs the mint/plugin lifecycle
  for each expectedAssetAddress:
    asset.owner == buyer wallet
    asset.collection == BRIDS collection expected for the listing
    asset.freezeDelegate exists
    asset.freezeDelegate.authority.type == Owner
    asset starts unfrozen unless an explicit product rule says otherwise
```

Tests first:

- `preparePurchase`/`buildMintBatch` includes the instruction required to attach `FreezeDelegate Owner` for every asset, or returns an explicit continuation/recovery plan.
- The transaction plan requires buyer wallet signature for the instruction that adds `FreezeDelegate`.
- The flow fails, remains recoverable, or does not finalize as supported if the expected plugin is missing.
- The expected result does not depend on a DB override.
- Inventory verification rejects assets with `plugins: {}`.
- Inventory verification rejects assets with `FreezeDelegate` whose authority is not `Owner`.
- The contract covers a batch with `quantity > 1`.
- The contract covers secondary transfer: after transfer, the UI validates against the current owner before enabling Stake / Unstake.

Gates:

- unit tests for the marketplace builder/service
- Stake / Unstake inventory tests
- `npm run typecheck`

## S03 - Marketplace Owner Freeze

Responsibility:

- implement the change in `preparePurchase/buildMintBatch` so every NFT minted by the buyer receives `FreezeDelegate` with `Owner` authority
- keep `/admin/assets/new` limited to collection and Candy Machine deploy/config
- update `PurchaseCta` only if the signing contract requires a new payload, summary, or continuation step
- record or expose enough evidence for the mint lifecycle
- post-submit confirm every expected asset before considering it eligible for Stake / Unstake
- ensure Stake / Unstake detects the NFT as supported only when the real plugin exists and has `Owner` authority
- favor Solana Kit / framework-kit in new code

Atomicity rule:

The flow may be multi-transaction if MPL Core/Candy Machine requires it, but it cannot silently succeed if mint happened and the owner freeze plugin was not applied. The UI must remain recoverable and traceability must show exactly which step failed.

Plugin rule:

A BRIDS NFT eligible for Stake / Unstake must be verified as:

```text
asset.collection == expected BRIDS collection
asset.owner == buyer wallet or current owner after transfer
asset.freezeDelegate exists
asset.freezeDelegate.authority.type == Owner
```

Submit rule:

After `/api/purchase/submit`, the backend must:

- confirm the transaction did not fail (`meta.err == null` when queried);
- validate that each `expectedAssetAddress` exists on-chain;
- validate owner and collection;
- validate `FreezeDelegate Owner`;
- leave the attempt recoverable/failed if any asset or plugin is missing.

Minimal persistence:

- `purchase_attempts` must store `expected_asset_addresses`, `verified_asset_addresses`, `asset_verification_status`, `asset_verification_error`, and `asset_verification_checked_at`.
- These fields are evidence for the purchase attempt and its verification; they do not replace on-chain truth or create a staking ledger.

Gates:

- marketplace flow tests
- submit/post-submit verification tests
- UI state tests for supported/unsupported
- `npm run validate`

## S04 - Marketplace Purchase Kit RPC Boundary

Responsibility:

- migrate `lib/purchase-service.ts` so marketplace purchase submit and confirmation use `@solana/kit` as the canonical RPC boundary
- replace `createLegacyConnection` with `createKitRpcConnection`
- replace `sendLegacyVersionedTransaction` with `sendRawTransactionWithKitRpc`
- replace `getLegacySignatureStatus` with `getSignatureStatusWithKitRpc`
- keep `VersionedTransaction` only as temporary compatibility encapsulated in `lib/solana-kit/compat/*`
- do not change the functional purchase, challenge, wallet signature, or post-submit verification contract
- do not introduce direct `@solana/web3.js` imports in marketplace purchase routes, services, or components

Tests first:

- extend the boundary test so it fails if `lib/purchase-service.ts` returns to `createLegacyConnection`
- extend the boundary test so it fails if `lib/purchase-service.ts` returns to `sendLegacyVersionedTransaction`
- extend the boundary test so it fails if `lib/purchase-service.ts` returns to `getLegacySignatureStatus`
- keep marketplace purchase flow and post-submit verification tests

Gates:

- `npx vitest run tests/lib/solana-kit-deploy-mint-boundary.test.ts`
- `npx vitest run tests/lib/purchase-service.test.ts tests/api/purchase-submit-route.test.ts tests/components/marketplace-purchase*.test.ts`
- `npm run typecheck`
- `npm run validate`

## S05 - Deploy Status RPC Fallback

Responsibility:

- fix `/api/admin/core-candy-machine/status` so it does not depend only on webhook events
- keep the Helius webhook as the fast signal when present
- query RPC with Kit to decide canonical confirmation for every signature
- return a non-null entry when RPC confirms or finalizes the signature
- allow `CoreCandyMachinePanel` to continue to `finalizeSnapshot` only when every signature is `confirmed` or `finalized` by RPC
- return `observedByWebhook` as informational signal, not sufficient confirmation

Tests first:

- route test where webhook returns `null` and Kit RPC returns `confirmed`
- route test where webhook observes the signature but RPC has not confirmed yet; expected result `confirmed=false`
- route test keeps non-admin access blocked

Gates:

- `npx vitest run tests/api/admin-core-candy-machine-status-route.test.ts`
- `npm run validate`

## S06 - Deploy Snapshot Readiness

Responsibility:

- fix `finalizeCoreCandyMachineSnapshot` so admin deploy does not require NFTs already minted through DAS
- validate readiness against on-chain Candy Machine state: correct collection, `itemsLoaded` equal to expected quantity, and confirmed deploy signatures
- keep DAS as marketplace/post-purchase verification, not as the administrative deploy gate
- correct snapshot status when proofs are `create-collection`, `create-candy-machine`, and `add-config-lines` instead of `mint`
- prevent the UI from showing `Deploy confirmed, but mint snapshot is not ready` for a correctly deployed Candy Machine with no minted NFTs yet

Tests first:

- service test where DAS returns `0`, `itemsLoaded === quantity`, collection is correct, and deploy proofs are confirmed; expected result `canCreateAsset=true`
- service test where `itemsLoaded < quantity`; expected blocked result with clear error
- service test where any deploy signature is not confirmed; expected blocked result

Gates:

- `npx vitest run tests/lib/core-candy-machine-snapshot-service.test.ts`
- `npm run validate`

## S07 - Deploy Snapshot Confirmation Gate

Responsibility:

- fix `CoreCandyMachinePanel` so it does not treat any non-null status object as sufficient confirmation
- accept only `confirmed` or `finalized` status before continuing to `snapshot/finalize`
- keep `Create Asset` blocked when status is `processed`, `submitted`, `null`, failed, or webhook-observed-only
- fix `finalizeCoreCandyMachineSnapshot` so it does not mark `processed` proofs as `confirmed`
- keep Helius as fast observer and Kit RPC as final arbiter

Tests first:

- component test for the panel confirmation helper
- route test where webhook observation does not unlock without RPC confirmation
- service test where a `processed` proof remains blocked

Gates:

- `npx vitest run tests/api/admin-core-candy-machine-status-route.test.ts tests/components/core-candy-machine-panel-snapshot-gate.test.ts tests/lib/core-candy-machine-snapshot-service.test.ts`
- `npm run validate`

## S08 - Candy Machine State Propagation

Responsibility:

- fix `finalizeCoreCandyMachineSnapshot` so it does not fail from one immediate partial `itemsLoaded` read when all `add-config-lines` signatures are already confirmed
- retry the on-chain Candy Machine read for a bounded window before marking `CONFIG_LINES_NOT_LOADED`
- keep definitive failures non-retriable so incorrect configuration is not hidden
- record read attempts, max attempts, `itemsLoaded`, `itemsAvailable`, and the last read error when present
- make the window configurable with `CORE_CM_SNAPSHOT_STATE_MAX_ATTEMPTS` and `CORE_CM_SNAPSHOT_STATE_RETRY_MS`

Definitive failures:

- on-chain collection differs from the request collection
- `itemsAvailable` differs from expected quantity
- `itemsLoaded` is greater than expected quantity
- deploy signature failed or is not confirmed by canonical RPC

Tests first:

- service test where the first read returns `itemsLoaded < quantity`, the second read returns `itemsLoaded === quantity`, and the snapshot becomes `ready`
- service test where `itemsAvailable !== quantity`; expected result `CANDY_MACHINE_QUANTITY_MISMATCH` without retry
- service test where on-chain collection does not match; expected result `COLLECTION_ADDRESS_MISMATCH` without retry
- keep the test where `itemsLoaded < quantity` and the bounded window is exhausted; expected result `CONFIG_LINES_NOT_LOADED`

Gates:

- `npx vitest run tests/lib/core-candy-machine-snapshot-service.test.ts`
- `npm run validate`

## S09 - Post-Create Asset UI Handoff

Responsibility:

- add visible animation in Step 2 while `Collection URI` and `Asset URI` are being generated
- keep deploy blocked until the URIs are valid metadata JSON
- after creating the entry, show `Entry created` briefly and then turn the primary CTA into `View marketplace`
- navigate to `/marketplace/{entryId}` from the primary CTA once the state is ready
- turn the secondary CTA into `Create another` after entry creation
- `Create another` must clear form, deploy, snapshot, messages, temporary uploads, and restart with a new draft

Tests first:

- reducer/state test where a post-create state resets and clears `showMintSetup`, `deployCompletedData`, `snapshotFinalize`, `createdMarketplaceEntryId`, messages, and uploads
- typecheck to validate that navigation and reset use the hook contract

Gates:

- `npx vitest run tests/lib/asset-creation-state.test.ts`
- `npm run lint`
- `npm run typecheck`
- `npm run validate`

## S10 - Post-Purchase Asset Verification Window

Responsibility:

- extend the MPL Core asset verification window after the purchase transaction confirms
- make the window configurable and bounded with `PURCHASE_ASSET_VERIFICATION_MAX_ATTEMPTS` and `PURCHASE_ASSET_VERIFICATION_RETRY_MS`
- keep definitive failures when the readable asset has the wrong owner, wrong collection, or no `FreezeDelegate Owner`
- add diagnostic details to the exhausted-window error
- prevent normal RPC/devnet propagation from marking an on-chain-confirmed purchase as `TRANSACTION_FAILED`

Tests first:

- default configuration test that prevents returning to the short 8-second window
- bounded override test to avoid absurd windows
- invalid override test that falls back to safe defaults

Gates:

- `npx vitest run tests/lib/purchase-service.test.ts`
- `npm run lint`
- `npm run typecheck`
- `npm run validate`

## S11 - Legacy Route And Orphan-Code Cleanup

Responsibility:

- audit Core Candy Machine admin routes and decide whether they are canonical, dev/ops-only, or orphaned
- remove code that suggests `/admin/assets/new` mints final user NFTs
- remove old routes that can create incomplete NFTs or document them as strictly blocked temporary boundaries
- classify `app/api/admin/core-candy-machine/mint/prepare/route.ts`; if it produces NFTs with owner=admin, it cannot be a product flow for buyers
- if the route is temporarily kept, it must respond as blocked (`410 Gone`) for authenticated admins and must not prepare mint transactions
- prevent `prepareCoreCandyMachineMint` from being copied as the marketplace solution if it keeps `owner: payerSigner.publicKey`
- encapsulate or remove `@solana/web3.js` imports inside the touched scope
- ensure the canonical path does not depend on an alternative route that skips the owner-freeze plugin

Solana Kit rule for deploy and mint:

- `@solana/kit` is the canonical SDK for new or touched deploy/mint code.
- New direct `@solana/web3.js` imports are not allowed in deploy/mint services, routes, or components.
- Migrate public key validation, address derivation, RPC submit/confirm, and transaction reads to Kit when an equivalent exists.
- Encapsulate `VersionedTransaction` and Umi/Metaplex/wallet-adapter conversions in `lib/solana-kit/compat/*` if they remain unavoidable.
- `lib/core-candy-machine-admin.ts`, `components/admin/core-candy-machine-panel.tsx`, `components/admin/metaplex-core-mint-panel.tsx`, `lib/candy-guard-payment-config.ts`, and `lib/purchase-third-party-signer.ts` must not depend directly on `@solana/web3.js` after the slice.
- If a usage cannot be migrated without replacing an external dependency, it must be documented as a temporary boundary with a technical reason and containment test.

Initial inventory:

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
- Core Candy Machine and purchase mint serialization/transaction helpers

Each element must end as:

- canonical;
- removed;
- replaced;
- documented dev/ops-only with no product exposure;
- documented and tested temporary boundary.

Tests first:

- route tests for expected canonical routes
- tests for absence, blocking, or non-exposure of old routes if removed
- grep/test to prevent the new canonical flow from depending directly on `@solana/web3.js` outside allowed boundaries
- test that `prepareCoreCandyMachineMint` is not used by the marketplace flow
- test or grep proving deploy/mint does not import `@solana/web3.js` outside `lib/solana-kit/compat/*`

Gates:

- `npm test`
- `npm run validate`

## S12 - Verification, Security, And Closure

Responsibility:

- execute real devnet proof
- mint from `/marketplace/[id]`, not from `/admin/assets/new`
- verify each minted asset with RPC/DAS
- verify each asset has `FreezeDelegate` with `Owner` authority
- verify that Stake / Unstake shows each NFT as supported
- verify secondary market case: transfer to another devnet wallet and revalidate that the UI uses current owner
- update canonical documentation if the final flow changes contracts
- run clean-code, security review, and final reviewer gate
- open final initiative PR into `develop`

Required evidence:

- marketplace mint signature
- separate `addPlugin(FreezeDelegate Owner)` signature if applicable
- complete asset addresses for the batch
- collection address
- buyer wallet
- RPC/DAS proof for every asset of `FreezeDelegate Owner`
- current owner proof after devnet secondary transfer
- Stake / Unstake UI proof of supported state
- `npm run validate` result
- security notes

## Solana Restrictions

- Devnet by default.
- No mainnet.
- Do not request or store private keys.
- Do not sign or send without explicit wallet/admin action.
- Simulate when applicable before requesting a signature.
- Treat every RPC/DAS value as untrusted.
- Validate owner, collection, signature, transaction state, and real plugin.

## Solana Kit / framework-kit

The new canonical path must favor:

- Solana Kit / framework-kit for client and RPC
- wallet-standard/framework-kit for signing UI when applicable
- encapsulated legacy boundaries only if a Metaplex library requires inherited types

The repo has legacy `@solana/web3.js` dependencies and code. For this fix:

- do not expand `@solana/web3.js` as the main mechanism for the new flow;
- if a Metaplex/Umi library or wallet adapter requires `VersionedTransaction`, that usage must live in a named and tested boundary;
- new scope should prefer Kit for validation, RPC, and internal helpers where viable;
- any new direct import of `@solana/web3.js` outside the boundary must be blocked by tests or justified in the slice.

## Definition of Done

- S01-S12 merged into the initiative branch.
- Final initiative PR merged into `develop`.
- `/admin/assets/new` remains limited to creating/configuring collections and Candy Machines.
- `/marketplace/[id]` mints NFTs with `FreezeDelegate Owner`.
- Every asset in `expectedAssetAddresses` is verified post-submit.
- No old routes can create incomplete user NFTs.
- Stake / Unstake recognizes NFTs created by the new flow as supported only with `Owner` authority.
- Secondary devnet transfer tested against current owner.
- Devnet proof with real signature and RPC/DAS verification.
- `npm run validate` passes.
- Linear `BRI-170` is updated with PRs, tests, and evidence.
