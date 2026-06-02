# implementation(fix): BRI-170 admin assets owner freeze mint flow

## Espanol

## Objetivo de implementacion

Implementar un flujo canonico y auditable para `/admin/assets/new` donde la creacion de una collection/Candy Machine y el mint de NFTs BRIDS produzcan assets con `FreezeDelegate` de autoridad `Owner`, sin dejar rutas viejas que permitan crear NFTs incompletos.

## Branching canonico

Rama de iniciativa:

```text
initiative/bri-170-admin-assets-owner-freeze-mint-flow
```

Slices:

```text
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s01-spec
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s02-transaction-manifest
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s03-complete-admin-flow
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s04-cleanup-legacy-paths
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s05-verification-security
```

Todos los slices salen de la rama de iniciativa y abren PR contra la rama de iniciativa. La iniciativa completa abre PR final hacia `develop`.

## S01 - Spec

Responsabilidad:

- definir problema, causa raiz y alcance
- documentar el lifecycle transaccional esperado
- documentar el inventario de codigo huerfano
- definir el contrato de pruebas primero
- sincronizar Linear

Archivos esperados:

- `docs/fixes/fix-admin-assets-owner-freeze-mint-flow.md`
- `docs/fixes/fix-admin-assets-owner-freeze-mint-flow-implementation.md`

Gates:

- `npm run validate:docs-governance`
- Linear actualizado con branch/slices reales

## S02 - Manifest transaccional

Responsabilidad:

- crear migracion DB para un manifest transaccional de Core Candy Machine
- registrar transacciones en fases `prepared`, `signed`, `submitted`, `confirmed`, `failed`
- soportar todos los `tx_kind` del ciclo canonico
- agregar repositorio y tests antes de implementacion

Contrato minimo sugerido:

```text
core_candy_machine_transaction_manifest
  id
  flow_id
  draft_id
  created_by
  collection_address
  candy_machine_address
  tx_index
  tx_kind
  serial
  expected_address
  transaction_base64_hash
  signature
  status
  slot
  error_json
  prepared_at
  signed_at
  submitted_at
  confirmed_at
  failed_at
  created_at
  updated_at
```

`tx_kind` debe incluir:

- `create-collection`
- `create-candy-machine`
- `add-config-lines`
- `mint`
- `add-app-data-plugin`
- `write-app-data`
- `add-owner-freeze-plugin`

Pruebas primero:

- migracion contiene tabla, constraints e indices
- repositorio crea manifest idempotente por `flow_id + tx_index`
- repositorio actualiza estados sin perder orden
- manifest rechaza `tx_kind` desconocidos

Gates:

- `npm test -- tests/db/...`
- `npm test -- tests/lib/...`
- `npm run validate:db`

Estado del slice:

- Migracion definida: `db/migrations/033_core_candy_machine_transaction_manifest.sql`
- Repositorio definido: `lib/core-candy-machine-transaction-manifest-repository.ts`
- Tests definidos primero:
  - `tests/db/core-candy-machine-transaction-manifest-migration.test.ts`
  - `tests/lib/core-candy-machine-transaction-manifest-repository.test.ts`
- El manifest registra hashes de transacciones, no payloads completos, para reducir exposicion de datos firmados.
- La idempotencia base queda en `UNIQUE (flow_id, tx_index)`.
- La reconciliacion por firma queda protegida con indice unico parcial para `signature IS NOT NULL`.

## S03 - Flujo canonico admin

Responsabilidad:

- conectar `/admin/assets/new` a un ciclo completo:
  - deploy collection/Candy Machine/config lines
  - mint NFTs
  - attach AppData
  - write AppData
  - attach `FreezeDelegate` con autoridad `Owner`
- hacer que el manifest registre cada transaccion
- impedir que `Create Asset` se marque como completo si falta `add-owner-freeze-plugin`
- usar Solana Kit / framework-kit como camino canonico

Regla de atomicidad:

El flujo puede ser multi-transaccion, pero no puede ser ambiguo. Si una transaccion falla, el manifest debe mostrar exactamente donde fallo y el UI debe quedar en estado recuperable, no en exito parcial silencioso.

Regla de plugin:

Un NFT BRIDS elegible para Stake / Unstake debe verificarse como:

```text
asset.collection == collection BRIDS
asset.owner == wallet esperada
asset.plugins.freeze_delegate.authority.type == Owner
```

Pruebas primero:

- componente/API demuestra que el flujo envia `add-owner-freeze-plugin`
- submit persiste firma y estado para ese `tx_kind`
- snapshot/finalizacion no habilita completion si falta owner freeze plugin
- caso de fallo parcial queda recuperable

Gates:

- tests de componente/API del flujo admin
- `npm run typecheck`
- `npm run validate`

## S04 - Cleanup de rutas y codigo huerfano

Responsabilidad:

- eliminar o consolidar rutas no canonicas
- retirar codigo viejo que permita crear NFTs incompletos
- encapsular o eliminar imports de `@solana/web3.js` dentro del scope
- asegurar que no quede un boton/ruta alternativa que salte el manifest

Inventario inicial:

- `app/api/admin/core-candy-machine/mint/prepare/route.ts`
- `app/api/admin/core-candy-machine/deploy/prepare/route.ts`
- `app/api/admin/core-candy-machine/submit/route.ts`
- `components/admin/core-candy-machine-panel.tsx`
- `app/admin/mint/page.tsx`
- `components/admin/mint-orchestrator-signing-panel.tsx`
- `lib/core-candy-machine-admin.ts`

Cada elemento debe terminar como:

- canonico
- eliminado
- reemplazado
- boundary temporal documentado

Pruebas primero:

- route tests para rutas canonicas esperadas
- pruebas de ausencia o bloqueo de rutas viejas si se eliminan
- grep/test para evitar que el flujo canonico dependa de `@solana/web3.js`

Gates:

- `npm test`
- `npm run validate`

## S05 - Verificacion, seguridad y cierre

Responsabilidad:

- ejecutar devnet proof real
- verificar con DAS/RPC que el NFT minteado tiene `FreezeDelegate` con autoridad `Owner`
- actualizar `docs/nft-spec.md`, `docs/auth-flow.md` y `docs/session-model.md` si el flujo final cambia contratos
- ejecutar clean-code, security review y reviewer final
- abrir PR final de iniciativa hacia `develop`

Evidencia requerida:

- firma de `mint`
- firma de `add-owner-freeze-plugin`
- asset address
- collection address
- prueba DAS/RPC del plugin
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

El nuevo camino canonico debe favorecer:

- Solana Kit / framework-kit para cliente y RPC
- wallet-standard/framework-kit para signing UI cuando aplique
- boundaries legacy encapsulados solo si una libreria Metaplex exige tipos heredados

No se acepta que el nuevo flujo dependa directamente de `@solana/web3.js` como mecanismo principal de preparacion, envio o confirmacion.

## Definition of Done

- S01-S05 mergeados en la rama de iniciativa.
- PR final de iniciativa mergeado a `develop`.
- Manifest transaccional persistido.
- No rutas viejas capaces de crear NFTs incompletos.
- `/admin/assets/new` produce NFTs con `FreezeDelegate Owner`.
- Stake / Unstake reconoce los NFTs creados por el flujo nuevo como soportados.
- `npm run validate` pasa.
- Linear `BRI-170` queda actualizado con PRs, pruebas y evidencia.

## English

## Implementation Objective

Implement a canonical and auditable `/admin/assets/new` flow where collection/Candy Machine creation and BRIDS NFT minting produce assets with `FreezeDelegate` using `Owner` authority, without leaving old routes that can create incomplete NFTs.

## Canonical Branching

Initiative branch:

```text
initiative/bri-170-admin-assets-owner-freeze-mint-flow
```

Slices:

```text
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s01-spec
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s02-transaction-manifest
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s03-complete-admin-flow
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s04-cleanup-legacy-paths
fix/app-admin-assets-owner-freeze-mint-flow-bri-170-s05-verification-security
```

All slices branch from the initiative branch and open PRs into the initiative branch. The complete initiative opens a final PR into `develop`.

## S01 - Spec

Responsibility:

- define problem, root cause, and scope
- document expected transaction lifecycle
- document orphan-code inventory
- define the test-first contract
- sync Linear

Expected files:

- `docs/fixes/fix-admin-assets-owner-freeze-mint-flow.md`
- `docs/fixes/fix-admin-assets-owner-freeze-mint-flow-implementation.md`

Gates:

- `npm run validate:docs-governance`
- Linear updated with real branches/slices

## S02 - Transaction Manifest

Responsibility:

- create DB migration for a Core Candy Machine transaction manifest
- record transactions in `prepared`, `signed`, `submitted`, `confirmed`, `failed` phases
- support every canonical lifecycle `tx_kind`
- add repository and tests before implementation

Suggested minimum contract:

```text
core_candy_machine_transaction_manifest
  id
  flow_id
  draft_id
  created_by
  collection_address
  candy_machine_address
  tx_index
  tx_kind
  serial
  expected_address
  transaction_base64_hash
  signature
  status
  slot
  error_json
  prepared_at
  signed_at
  submitted_at
  confirmed_at
  failed_at
  created_at
  updated_at
```

`tx_kind` must include:

- `create-collection`
- `create-candy-machine`
- `add-config-lines`
- `mint`
- `add-app-data-plugin`
- `write-app-data`
- `add-owner-freeze-plugin`

Tests first:

- migration contains table, constraints, and indexes
- repository creates idempotent manifest rows by `flow_id + tx_index`
- repository updates states without losing order
- manifest rejects unknown `tx_kind`

Gates:

- `npm test -- tests/db/...`
- `npm test -- tests/lib/...`
- `npm run validate:db`

Slice status:

- Migration defined: `db/migrations/033_core_candy_machine_transaction_manifest.sql`
- Repository defined: `lib/core-candy-machine-transaction-manifest-repository.ts`
- Tests defined first:
  - `tests/db/core-candy-machine-transaction-manifest-migration.test.ts`
  - `tests/lib/core-candy-machine-transaction-manifest-repository.test.ts`
- The manifest stores transaction hashes, not full payloads, to reduce signed-data exposure.
- Base idempotency is `UNIQUE (flow_id, tx_index)`.
- Signature reconciliation is protected with a partial unique index for `signature IS NOT NULL`.

## S03 - Canonical Admin Flow

Responsibility:

- connect `/admin/assets/new` to a complete cycle:
  - deploy collection/Candy Machine/config lines
  - mint NFTs
  - attach AppData
  - write AppData
  - attach `FreezeDelegate` with `Owner` authority
- record every transaction in the manifest
- prevent `Create Asset` from completing if `add-owner-freeze-plugin` is missing
- use Solana Kit / framework-kit as the canonical path

Atomicity rule:

The flow can be multi-transaction, but it cannot be ambiguous. If a transaction fails, the manifest must show exactly where it failed and the UI must remain recoverable, not silently successful.

Plugin rule:

A BRIDS NFT eligible for Stake / Unstake must be verified as:

```text
asset.collection == BRIDS collection
asset.owner == expected wallet
asset.plugins.freeze_delegate.authority.type == Owner
```

Tests first:

- component/API proves the flow submits `add-owner-freeze-plugin`
- submit persists signature and state for that `tx_kind`
- snapshot/finalization does not enable completion if owner freeze plugin is missing
- partial failure remains recoverable

Gates:

- component/API tests for the admin flow
- `npm run typecheck`
- `npm run validate`

## S04 - Legacy Route And Orphan Code Cleanup

Responsibility:

- delete or consolidate non-canonical routes
- remove old code that can create incomplete NFTs
- encapsulate or remove `@solana/web3.js` imports within scope
- ensure no alternate button/route bypasses the manifest

Initial inventory:

- `app/api/admin/core-candy-machine/mint/prepare/route.ts`
- `app/api/admin/core-candy-machine/deploy/prepare/route.ts`
- `app/api/admin/core-candy-machine/submit/route.ts`
- `components/admin/core-candy-machine-panel.tsx`
- `app/admin/mint/page.tsx`
- `components/admin/mint-orchestrator-signing-panel.tsx`
- `lib/core-candy-machine-admin.ts`

Each item must end as:

- canonical
- deleted
- replaced
- documented temporary boundary

Tests first:

- route tests for expected canonical routes
- absence/blocking tests for old routes when deleted
- grep/test preventing the canonical flow from depending on `@solana/web3.js`

Gates:

- `npm test`
- `npm run validate`

## S05 - Verification, Security, And Closure

Responsibility:

- run real devnet proof
- verify through DAS/RPC that the minted NFT has `FreezeDelegate` with `Owner` authority
- update `docs/nft-spec.md`, `docs/auth-flow.md`, and `docs/session-model.md` if the final flow changes contracts
- run clean-code, security review, and final reviewer pass
- open final initiative PR into `develop`

Required evidence:

- `mint` signature
- `add-owner-freeze-plugin` signature
- asset address
- collection address
- DAS/RPC proof of plugin
- `npm run validate` result
- security notes

## Solana Constraints

- Devnet by default.
- No mainnet.
- Do not ask for or store private keys.
- Do not sign or send without explicit wallet/admin action.
- Simulate when applicable before requesting signature.
- Treat all RPC/DAS data as untrusted.
- Validate owner, collection, and real plugin state.

## Solana Kit / framework-kit

The new canonical path must prefer:

- Solana Kit / framework-kit for client and RPC
- wallet-standard/framework-kit for signing UI when applicable
- encapsulated legacy boundaries only when a Metaplex library requires legacy types

It is not acceptable for the new flow to directly depend on `@solana/web3.js` as its primary preparation, submission, or confirmation mechanism.

## Definition of Done

- S01-S05 merged into the initiative branch.
- Final initiative PR merged into `develop`.
- Transaction manifest persisted.
- No old route can create incomplete NFTs.
- `/admin/assets/new` produces NFTs with `FreezeDelegate Owner`.
- Stake / Unstake recognizes NFTs created by the new flow as supported.
- `npm run validate` passes.
- Linear `BRI-170` is updated with PRs, tests, and evidence.
