# implementation(fix): BRI-170 marketplace mint owner freeze flow

## Espanol

## Objetivo de implementacion

Implementar un flujo canonico y auditable donde `/admin/assets/new` crea/configura Candy Machines y `/marketplace/[id]` mintea los NFTs del usuario con `FreezeDelegate` de autoridad `Owner`.

La implementacion no debe convertir `/admin/assets/new` en una pantalla de mint para usuarios. Debe corregir el punto donde realmente nace el NFT del comprador: el flujo de compra/mint de marketplace.

## Correccion de alcance

El alcance anterior estaba mal planteado porque mezclaba dos responsabilidades:

- Admin: crear collection, crear Candy Machine y cargar config lines.
- Marketplace: mintear el NFT que queda owned por la wallet compradora.

La capacidad owner-managed de Stake / Unstake debe agregarse en el segundo flujo, no en la creacion administrativa de la Candy Machine.

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

- identificar el builder/servicio real que prepara el mint desde `/marketplace/[id]`
- agregar pruebas primero para demostrar que el mint del comprador debe producir un asset con `FreezeDelegate Owner`
- definir trazabilidad minima para preparacion, firma, envio, confirmacion y fallo
- no tocar todavia rutas admin salvo para clasificarlas como dependencia, boundary u huerfanas

Contrato minimo:

```text
marketplace mint
  buyer wallet signs
  asset owner == buyer wallet
  asset collection == BRIDS collection expected for the listing
  asset plugins.freeze_delegate.authority.type == Owner
  asset starts unfrozen unless an explicit product rule says otherwise
```

Pruebas primero:

- el builder de marketplace incluye la instruccion necesaria para adjuntar `FreezeDelegate Owner`
- el flujo falla o no finaliza como soportado si falta el plugin esperado
- el resultado esperado no depende de un override de DB
- la verificacion de inventario sigue rechazando assets con `plugins: {}`

Gates:

- tests unitarios del builder/servicio de marketplace
- tests de inventario Stake / Unstake cuando aplique
- `npm run typecheck`

## S03 - Marketplace owner freeze

Responsabilidad:

- implementar el cambio en el flujo de marketplace para que el NFT minteado por el comprador reciba `FreezeDelegate` con autoridad `Owner`
- mantener `/admin/assets/new` limitado a deploy/config de collection y Candy Machine
- registrar o exponer evidencia suficiente del lifecycle de mint
- asegurar que la UI de Stake / Unstake detecte el NFT como soportado solo cuando el plugin real exista
- favorecer Solana Kit / framework-kit en el codigo nuevo

Regla de atomicidad:

El flujo puede ser multi-transaccion si MPL Core/Candy Machine lo requiere, pero no puede dejar exito silencioso si el mint ocurrio y el owner freeze plugin no quedo aplicado. La UI debe quedar en estado recuperable y la trazabilidad debe indicar exactamente que paso fallo.

Regla de plugin:

Un NFT BRIDS elegible para Stake / Unstake debe verificarse como:

```text
asset.collection == collection BRIDS esperada
asset.owner == wallet compradora
asset.plugins.freeze_delegate.authority.type == Owner
```

Gates:

- tests del flujo marketplace
- tests de estado UI para soportado/no soportado
- `npm run validate`

## S04 - Cleanup de rutas y codigo huerfano

Responsabilidad:

- auditar rutas admin de Core Candy Machine y decidir si son canonicas, dev/ops-only o huerfanas
- eliminar codigo que sugiera que `/admin/assets/new` mintea NFTs finales del usuario
- retirar rutas viejas que puedan crear NFTs incompletos o documentarlas como boundary temporal estrictamente bloqueado
- encapsular o eliminar imports de `@solana/web3.js` dentro del scope tocado
- asegurar que el camino canonico no dependa de una ruta alternativa que salte el plugin owner freeze

Inventario inicial:

- `/admin/assets/new`
- `/marketplace/[id]`
- `app/api/admin/core-candy-machine/deploy/prepare/route.ts`
- `app/api/admin/core-candy-machine/mint/prepare/route.ts`
- `app/api/admin/core-candy-machine/submit/route.ts`
- `components/admin/core-candy-machine-panel.tsx`
- `components/admin/mint-orchestrator-signing-panel.tsx`
- servicios de purchase/mint marketplace
- helpers de serializacion/transaccion en Core Candy Machine

Cada elemento debe terminar como:

- canonico
- eliminado
- reemplazado
- dev/ops-only documentado
- boundary temporal documentado

Pruebas primero:

- route tests para rutas canonicas esperadas
- pruebas de ausencia, bloqueo o no exposicion de rutas viejas si se eliminan
- grep/test para evitar que el flujo canonico nuevo dependa directamente de `@solana/web3.js`

Gates:

- `npm test`
- `npm run validate`

## S05 - Verificacion, seguridad y cierre

Responsabilidad:

- ejecutar proof real en devnet
- mintear desde `/marketplace/[id]`, no desde `/admin/assets/new`
- verificar con DAS/RPC que el NFT minteado tiene `FreezeDelegate` con autoridad `Owner`
- verificar que Stake / Unstake muestra el NFT como soportado
- actualizar documentacion canonica si el flujo final cambia contratos
- ejecutar clean-code, security review y reviewer final
- abrir PR final de iniciativa hacia `develop`

Evidencia requerida:

- firma del mint de marketplace
- asset address
- collection address
- wallet compradora
- prueba DAS/RPC del plugin `FreezeDelegate Owner`
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
- Validar owner, collection y plugin real.

## Solana Kit / framework-kit

El camino canonico nuevo debe favorecer:

- Solana Kit / framework-kit para cliente y RPC
- wallet-standard/framework-kit para signing UI cuando aplique
- boundaries legacy encapsulados solo si una libreria Metaplex exige tipos heredados

No se acepta que el nuevo flujo dependa directamente de `@solana/web3.js` como mecanismo principal de preparacion, envio o confirmacion.

## Definition of Done

- S01-S05 mergeados en la rama de iniciativa.
- PR final de iniciativa mergeado a `develop`.
- `/admin/assets/new` queda limitado a crear/configurar collections y Candy Machines.
- `/marketplace/[id]` mintea NFTs con `FreezeDelegate Owner`.
- No rutas viejas capaces de crear NFTs de usuario incompletos.
- Stake / Unstake reconoce los NFTs creados por el flujo nuevo como soportados.
- Devnet proof con firma real y verificacion DAS/RPC.
- `npm run validate` pasa.
- Linear `BRI-170` queda actualizado con PRs, pruebas y evidencia.

## English

## Implementation Objective

Implement a canonical and auditable flow where `/admin/assets/new` creates/configures Candy Machines and `/marketplace/[id]` mints user NFTs with `FreezeDelegate` using `Owner` authority.

The implementation must not turn `/admin/assets/new` into a user mint screen. It must fix the point where the buyer NFT is actually created: the marketplace purchase/mint flow.

## Scope Correction

The previous scope was incorrectly framed because it mixed two responsibilities:

- Admin: create collection, create Candy Machine, and load config lines.
- Marketplace: mint the NFT that is owned by the buyer wallet.

The owner-managed Stake / Unstake capability must be added in the second flow, not in the administrative Candy Machine creation flow.

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

- identify the real builder/service that prepares the mint from `/marketplace/[id]`
- add tests first to prove the buyer mint must produce an asset with `FreezeDelegate Owner`
- define minimum traceability for preparation, signing, submission, confirmation, and failure
- do not touch admin routes yet except to classify them as dependency, boundary, or orphaned

Minimum contract:

```text
marketplace mint
  buyer wallet signs
  asset owner == buyer wallet
  asset collection == BRIDS collection expected for the listing
  asset plugins.freeze_delegate.authority.type == Owner
  asset starts unfrozen unless an explicit product rule says otherwise
```

Tests first:

- the marketplace builder includes the instruction required to attach `FreezeDelegate Owner`
- the flow fails or does not finalize as supported if the expected plugin is missing
- the expected result does not depend on a DB override
- inventory verification keeps rejecting assets with `plugins: {}`

Gates:

- unit tests for the marketplace builder/service
- Stake / Unstake inventory tests where applicable
- `npm run typecheck`

## S03 - Marketplace Owner Freeze

Responsibility:

- implement the marketplace flow change so the NFT minted by the buyer receives `FreezeDelegate` with `Owner` authority
- keep `/admin/assets/new` limited to collection and Candy Machine deploy/config
- record or expose enough evidence for the mint lifecycle
- ensure the Stake / Unstake UI detects the NFT as supported only when the real plugin exists
- favor Solana Kit / framework-kit in new code

Atomicity rule:

The flow may be multi-transaction if MPL Core/Candy Machine requires it, but it cannot silently succeed if mint happened and the owner freeze plugin was not applied. The UI must remain recoverable and traceability must show exactly which step failed.

Plugin rule:

A BRIDS NFT eligible for Stake / Unstake must be verified as:

```text
asset.collection == expected BRIDS collection
asset.owner == buyer wallet
asset.plugins.freeze_delegate.authority.type == Owner
```

Gates:

- marketplace flow tests
- UI state tests for supported/unsupported
- `npm run validate`

## S04 - Legacy Route And Orphan-Code Cleanup

Responsibility:

- audit Core Candy Machine admin routes and decide whether they are canonical, dev/ops-only, or orphaned
- remove code that suggests `/admin/assets/new` mints final user NFTs
- remove old routes that can create incomplete NFTs or document them as strictly blocked temporary boundaries
- encapsulate or remove `@solana/web3.js` imports inside the touched scope
- ensure the canonical path does not depend on an alternative route that skips the owner-freeze plugin

Initial inventory:

- `/admin/assets/new`
- `/marketplace/[id]`
- `app/api/admin/core-candy-machine/deploy/prepare/route.ts`
- `app/api/admin/core-candy-machine/mint/prepare/route.ts`
- `app/api/admin/core-candy-machine/submit/route.ts`
- `components/admin/core-candy-machine-panel.tsx`
- `components/admin/mint-orchestrator-signing-panel.tsx`
- marketplace purchase/mint services
- Core Candy Machine serialization/transaction helpers

Each element must end as:

- canonical
- removed
- replaced
- documented dev/ops-only
- documented temporary boundary

Tests first:

- route tests for expected canonical routes
- tests for absence, blocking, or non-exposure of old routes if removed
- grep/test to prevent the new canonical flow from depending directly on `@solana/web3.js`

Gates:

- `npm test`
- `npm run validate`

## S05 - Verification, Security, And Closure

Responsibility:

- execute real devnet proof
- mint from `/marketplace/[id]`, not from `/admin/assets/new`
- verify with DAS/RPC that the minted NFT has `FreezeDelegate` with `Owner` authority
- verify that Stake / Unstake shows the NFT as supported
- update canonical documentation if the final flow changes contracts
- run clean-code, security review, and final reviewer gate
- open final initiative PR into `develop`

Required evidence:

- marketplace mint signature
- asset address
- collection address
- buyer wallet
- DAS/RPC proof of `FreezeDelegate Owner`
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
- Validate owner, collection, and real plugin.

## Solana Kit / framework-kit

The new canonical path must favor:

- Solana Kit / framework-kit for client and RPC
- wallet-standard/framework-kit for signing UI when applicable
- encapsulated legacy boundaries only if a Metaplex library requires inherited types

The new flow must not depend directly on `@solana/web3.js` as the main mechanism for preparation, submission, or confirmation.

## Definition of Done

- S01-S05 merged into the initiative branch.
- Final initiative PR merged into `develop`.
- `/admin/assets/new` remains limited to creating/configuring collections and Candy Machines.
- `/marketplace/[id]` mints NFTs with `FreezeDelegate Owner`.
- No old routes can create incomplete user NFTs.
- Stake / Unstake recognizes NFTs created by the new flow as supported.
- Devnet proof with real signature and DAS/RPC verification.
- `npm run validate` passes.
- Linear `BRI-170` is updated with PRs, tests, and evidence.
