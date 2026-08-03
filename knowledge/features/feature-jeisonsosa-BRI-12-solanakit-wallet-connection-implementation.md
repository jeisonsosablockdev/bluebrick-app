# Solution Spec: solanakit-wallet-connection Implementation (BRI-12)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `solana` (con colaboración de `frontend`, `api` y `qa`)
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture
La solución reemplaza sistemáticamente el uso de `@solana/web3.js` v1 por `@solana/kit` en los módulos identificados como sustituibles, estructurados en 4 SPECs atómicas independientes:

1. **Presentation Layer (`components/`, `app/`)**:
   - Se mantiene intacto el `WalletRuntimeProvider` en `components/wallet/wallet-runtime-provider.tsx` usando `@solana/wallet-adapter-react` como frontera transitiva controlada para no romper la conexión de wallet de los componentes UI (`PurchaseCta.tsx`, `stake-module.tsx`, `profile-kyc-module.tsx`).
   - Las páginas públicas (`app/page.tsx`, `app/marketplace/page.tsx`, `app/marketplace/[id]/page.tsx`) continúan consumiendo `lib/property-marketplace-server.ts` sin cambios en sus firmas públicas.

2. **Application / Consumption Layer (`app/api/`, `lib/purchase-service.ts`)**:
   - **Endpoint Reconcile Admin (`app/api/admin/mint-orchestrator/jobs/[jobId]/reconcile/route.ts`)**:
     - *Seguridad del Endpoint*: Autenticación de rol `admin` obligatoria (`getRequestRole`), sanitización de lista de firmas (`normalizeSignatureList`), desbalance en lotes de 256 peticiones max y manejo seguro de excepciones sin fuga de stack traces internal server.
     - *API Creada*: Uso de `createSolanaRpc` / `getSignatureStatusWithKitRpc` para verificar `confirmationStatus === "confirmed" | "finalized"`.
     - *API Eliminada*: Instanciación directa heredada `new Connection(getSolanaRpcUrl(), "confirmed")` en la ruta.
   - **Rutas de Compra (`app/api/purchase/challenge/route.ts`, `app/api/purchase/verify/route.ts`)**:
     - Consumen `lib/purchase-service.ts` y `lib/purchase-anti-bot.ts` manteniendo validaciones Zod, rate limiting por IP/Wallet y caducidad de nonce de 120s.

3. **Domain / Pipelines Layer (`lib/`)**:
   - `lib/purchase-anti-bot.ts`: Migración de `PublicKey` a `address(...)` e inspección de bytes de dirección con utilidades de `@solana/kit`.
   - `lib/property-marketplace-server.ts`: Migración de `Connection` y `PublicKey` a `createSolanaRpc` y `address(...)`.
   - `lib/solana-kit/compat/squads.ts`: Derivación de PDAs mediante `getProgramDerivedAddress` de `@solana/kit`.
4. **Infrastructure Layer (`lib/infrastructure/`, `lib/solana-kit/compat/`)**: Consolidación de adaptadores RPC y transacciones en `lib/solana-kit/compat/web3-transactions.ts`.

## 3. Atomic Slices & Logical Sequence (4 SPECs Separadas)
A solicitud del desarrollador, el trabajo se divide en 4 SPECs atómicas consecutivas originadas desde la rama parent `feature/jeisonsosa-BRI-12-solanakit-wallet-connection`:

- **SPEC-1 (Validaciones de PublicKey)**:
  - Scope: Migración de `PublicKey` $\rightarrow$ `address(...)` en `lib/purchase-anti-bot.ts`, `lib/property-marketplace-server.ts` y `scripts/check-candy-machine-items.js`.
  - Rama: `SPEC/jeisonsosa-BRI-12-s01-publickey-address-validation`
- **SPEC-2 (Consultas RPC & Reconciliaciones)**:
  - Scope: Migración de `Connection` $\rightarrow$ `createSolanaRpc()` en `app/api/admin/mint-orchestrator/jobs/[jobId]/reconcile/route.ts`, `lib/property-marketplace-server.ts` y `lib/core-authority-lifecycle.ts`.
  - Rama: `SPEC/jeisonsosa-BRI-12-s02-rpc-reconciliation`
- **SPEC-3 (Derivación de PDAs Squads V4)**:
  - Scope: Migración de `findProgramAddressSync` $\rightarrow$ `getProgramDerivedAddress()` de `@solana/kit` en `lib/solana-kit/compat/squads.ts`.
  - Rama: `SPEC/jeisonsosa-BRI-12-s03-squads-pda-derivation`
- **SPEC-4 (Firmadores y Keypairs Kit)**:
  - Scope: Migración de `Keypair` heredado $\rightarrow$ `generateKeyPairSigner()` y `createKeyPairSignerFromBytes()` en scripts y unit tests (`tests/lib/purchase-anti-bot.test.ts`, `scripts/devnet-authority-lifecycle-proof.ts`).
  - Rama: `SPEC/jeisonsosa-BRI-12-s04-kit-keypair-signers`
- **SPEC-5 (Modal Prompt de Reconexión de Wallet en Compra)**:
  - Scope: Intercepción en `components/marketplace/PurchaseCta.tsx` cuando se presiona el botón de compra sin wallet activa / sesión caducada. En lugar de mostrar sólo un mensaje de texto plano ("Conecta Phantom e inicia sesion antes de comprar."), abre un modal / diálogo interactivo de reconexión con mensaje explicativo y CTA "Conectar Wallet" que gatilla `dispatchOpenWalletModal({ loginMethod: "wallet" })`.
  - Rama: `SPEC/jeisonsosa-BRI-12-s05-wallet-reconnect-modal`
- **SPEC-6 (Auditoría de Código Limpio y Refactorización refactor-clean)**:
  - Scope: Auditoría integral de Clean Code en todos los archivos modificados (`lib/purchase-anti-bot.ts`, `lib/property-marketplace-server.ts`, `lib/solana-kit/compat/squads.ts`, `app/api/.../reconcile/route.ts`, `components/marketplace/PurchaseCta.tsx`). Verificación de cero archivos huérfanos/en blanco, cero funciones muertas, cero imports no utilizados y estructura de monorepo impecable antes del cierre.
  - Rama: `SPEC/jeisonsosa-BRI-12-s06-refactor-clean-audit`

## 4. TDD (Test-Driven Development) Strategy & TDD Primal Standards
Siguiendo los principios de la skill **`tdd-primal`**, todas las pruebas unitarias y de contrato se escriben en la fase RED dentro de la SPEC correspondiente antes de modificar el código de producción. Cada test lleva el tag de trazabilidad `@spec BRI-12`.

### Unit/Integration Tests (Fase RED por SPEC)
- **Test File Paths**:
  - SPEC-1: `tests/lib/purchase-anti-bot.test.ts`
  - SPEC-2: `tests/api/admin-mint-orchestrator.test.ts`, `tests/lib/content-routes.test.ts`
  - SPEC-3: `tests/lib/solana-kit-squads.test.ts`
  - SPEC-4: `tests/lib/solana-kit-keypairs.test.ts`
  - SPEC-5: `tests/components/purchase-cta-wallet-reconnect.test.ts`
  - SPEC-6: `tests/lib/clean-code-audit.test.ts`
- **Command**: `pnpm test`
- **Assertion Goals (@spec BRI-12)**:
  1. `@spec BRI-12-REQ-1 (SPEC-1)`: Validar que `verifyAndConsumePurchaseChallenge` funcione idénticamente utilizando `address(...)` de `@solana/kit` y la decodificación de bytes Ed25519, fallando correctamente con `401` ante firmas inválidas.
  2. `@spec BRI-12-REQ-2 (SPEC-2)`: Validar que la reconciliación de firmas por Kit RPC (`app/api/admin/mint-orchestrator/jobs/[jobId]/reconcile`) reconozca los estados `confirmed` y `finalized`, rechace peticiones no autorizadas de roles distintos a `admin` (403) y responda con 400 ante payloads con firmas corruptas.
  3. `@spec BRI-12-REQ-3 (SPEC-3)`: Validar que la derivación de PDAs de Squads V4 y ATAs con `getProgramDerivedAddress` de `@solana/kit` entregue **exactamente las mismas direcciones base58** que la implementación legacy de `PublicKey.findProgramAddressSync`.
  4. `@spec BRI-12-REQ-4 (SPEC-4)`: Validar que la generación y carga de firmadores (`generateKeyPairSigner()`, `createKeyPairSignerFromBytes()`) produzcan firmadores válidos compatibles con `@solana/kit`, capaces de firmar mensajes y transacciones sin ninguna dependencia de `Keypair` de `@solana/web3.js`.
  5. `@spec BRI-12-REQ-5 (SPEC-5)`: Validar que al invocar la compra en `PurchaseCta` sin wallet activa, no sólo se impida la transacción sino que se active el modal/diálogo de reconexión y al presionar "Conectar Wallet" se despache el evento `WALLET_MODAL_OPEN_EVENT` (`dispatchOpenWalletModal`).
  6. `@spec BRI-12-REQ-6 (SPEC-6)`: Validar la ausencia total de archivos huérfanos/en blanco, imports sin uso e incompatibilidades de arquitectura en el árbol de archivos refactorizado.

## 5. Local Definition of Done (DoD)
- [ ] La rama parent `feature/jeisonsosa-BRI-12-solanakit-wallet-connection` gobierna las 6 SPECs.
- [ ] Se completa el flujo TDD (RED $\rightarrow$ GREEN $\rightarrow$ REFACTOR) en cada SPEC individual.
- [ ] La suite de pruebas unitarias y de integración pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] Se ejecutó Gate 1 y Gate 2 de `architect`.
- [ ] Aprobación explícita del humano (`Human Acceptance`) registrada antes del merge final de la rama parent a `develop`.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jeisonsosa-BRI-12-solanakit-wallet-connection.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/features/feature-jeisonsosa-BRI-12-solanakit-wallet-connection.md)
- **Solution Spec**: [feature-jeisonsosa-BRI-12-solanakit-wallet-connection-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/features/feature-jeisonsosa-BRI-12-solanakit-wallet-connection-implementation.md)
- **Linear Issue**: [Linear Ticket #BRI-12](https://linear.app/brids-app/issue/BRI-12)
