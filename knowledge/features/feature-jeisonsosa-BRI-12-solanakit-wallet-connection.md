# Problem Spec: solanakit-wallet-connection (BRI-12)

## What problem exists
El repositorio BRIDS cuenta con dependencias legacy directas de `@solana/web3.js` (v1) en 15 archivos distribuidos entre validaciones de backend, servicios de servidor, endpoints de API de administración, derivación de PDAs y scripts de prueba. Aunque la gobernanza de arquitectura de 4 capas prohíbe el uso de `@solana/web3.js` en código de presentación y marketplace cliente, aún existen usos reemplazables por `@solana/kit` que agregan peso innecesario al bundle, instancian objetos `PublicKey` redundantes y mantienen clientes RPC legacy.

## Why it matters
La migración gradual a `@solana/kit` reduce el tamaño del bundle, elimina la huella de memoria causada por objetos mutables `PublicKey`, mejora el rendimiento de serialización de transacciones y alinea la arquitectura del monorepo con las mejores prácticas oficiales de Solana de `@solana/kit`. Reemplazar las áreas identificadas como sustituibles sin tocar las capas de compatibilidad mantendrá la estabilidad mientras se modernizan las capas de dominio e infraestructura.

## What outcome is expected
Sustituir de forma segura las superficies reemplazables de `@solana/web3.js` por `@solana/kit` en:
1. Validaciones de `PublicKey` $\rightarrow$ `address(...)` en `lib/purchase-anti-bot.ts`, `lib/property-marketplace-server.ts` y `scripts/check-candy-machine-items.js`.
2. Conexiones y consultas RPC $\rightarrow$ `createSolanaRpc()` en `app/api/admin/mint-orchestrator/jobs/[jobId]/reconcile/route.ts`, `lib/property-marketplace-server.ts` y `lib/core-authority-lifecycle.ts`.
3. Derivación de PDAs y ATAs $\rightarrow$ `getProgramDerivedAddress()` en `lib/solana-kit/compat/squads.ts`.
4. Firmadores y Keypairs en pruebas $\rightarrow$ `generateKeyPairSigner()`, `createKeyPairSignerFromBytes()` en scripts y unit tests.
5. Modal / Diálogo interactivo de reconexión de wallet $\rightarrow$ al presionar la CTA de compra sin wallet conectada o con sesión caducada en `PurchaseCta.tsx`, presenta un diálogo interactivo ("Conecta Phantom e inicia sesion antes de comprar.") con botón "Conectar Wallet" que gatilla `dispatchOpenWalletModal({ loginMethod: "wallet" })`.

Todo esto manteniendo las suites de prueba unitarias e integraciones pasando en verde (`pnpm validate`), documentando explícitamente las APIs creadas vs APIs heredadas eliminadas, garantizando la seguridad en los endpoints de API y asegurando cero regresiones en la red de componentes conectados (compra en marketplace, catálogo de propiedades, APIs públicas de propiedades y paneles admin multisig).

## What gaps exist today
1. `lib/purchase-anti-bot.ts` depende de `PublicKey` para obtener bytes de claves públicas en la validación Ed25519 con `tweetnacl`.
2. `lib/property-marketplace-server.ts` utiliza `new Connection(...)` y `new PublicKey(...)` en tiempo de renderizado de servidor para consultar cuentas de Devnet (`getMultipleAccountsInfo`).
3. `app/api/admin/mint-orchestrator/jobs/[jobId]/reconcile/route.ts` instancia `new Connection(...)` directamente para `getSignatureStatuses`.
4. `lib/solana-kit/compat/squads.ts` invoca `PublicKey.findProgramAddressSync()` de web3.js en lugar del API declarativo `getProgramDerivedAddress` de `@solana/kit`.

## What questions remain open
Ninguna. La matriz de sustitución, el grafo de componentes dependientes y los límites de compatibilidad (Umi, Wallet Adapter Provider, Synpress Phantom) fueron analizados, documentados y aprobados.
