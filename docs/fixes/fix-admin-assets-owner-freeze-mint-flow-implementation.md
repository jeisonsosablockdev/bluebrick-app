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
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s04-cleanup-legacy-paths
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s05-verification-security
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

## S04 - Cleanup de rutas y codigo huerfano

Responsabilidad:

- auditar rutas admin de Core Candy Machine y decidir si son canonicas, dev/ops-only o huerfanas
- eliminar codigo que sugiera que `/admin/assets/new` mintea NFTs finales del usuario
- retirar rutas viejas que puedan crear NFTs incompletos o documentarlas como boundary temporal estrictamente bloqueado
- clasificar `app/api/admin/core-candy-machine/mint/prepare/route.ts`; si produce NFTs owner=admin, no puede ser flujo de producto para compradores
- si la ruta se conserva temporalmente, debe responder bloqueada (`410 Gone`) para admins autenticados y no preparar transacciones de mint
- impedir que `prepareCoreCandyMachineMint` sea copiado como solucion marketplace si conserva `owner: payerSigner.publicKey`
- encapsular o eliminar imports de `@solana/web3.js` dentro del scope tocado
- asegurar que el camino canonico no dependa de una ruta alternativa que salte el plugin owner freeze

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

Gates:

- `npm test`
- `npm run validate`

## S05 - Verificacion, seguridad y cierre

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

- S01-S05 mergeados en la rama de iniciativa.
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
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s04-cleanup-legacy-paths
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s05-verification-security
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

## S04 - Legacy Route And Orphan-Code Cleanup

Responsibility:

- audit Core Candy Machine admin routes and decide whether they are canonical, dev/ops-only, or orphaned
- remove code that suggests `/admin/assets/new` mints final user NFTs
- remove old routes that can create incomplete NFTs or document them as strictly blocked temporary boundaries
- classify `app/api/admin/core-candy-machine/mint/prepare/route.ts`; if it produces NFTs with owner=admin, it cannot be a product flow for buyers
- if the route is temporarily kept, it must respond as blocked (`410 Gone`) for authenticated admins and must not prepare mint transactions
- prevent `prepareCoreCandyMachineMint` from being copied as the marketplace solution if it keeps `owner: payerSigner.publicKey`
- encapsulate or remove `@solana/web3.js` imports inside the touched scope
- ensure the canonical path does not depend on an alternative route that skips the owner-freeze plugin

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

Gates:

- `npm test`
- `npm run validate`

## S05 - Verification, Security, And Closure

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

- S01-S05 merged into the initiative branch.
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
