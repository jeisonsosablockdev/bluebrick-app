# Solution Spec: monorepo-fdd-architecture Implementation (BRI-186)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `architect` & `frontend`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture

La solución establece una arquitectura dual basada en **Monorepo Workspaces (Nivel Macro)** y **Feature-Driven Design (FDD) en 4 capas (Nivel Micro)** organizadas en torno a las **secciones principales de la aplicación web de BRIDS** más la capa de recursos compartidos (`shared`):

```text
brids/                                      <-- Monorepo Root
├── programs/                               <-- Rust Anchor Smart Contracts (Solana)
├── apps/
│   └── web/                                <-- Next.js 16+ App Router
│       ├── app/                            <-- Thin App Router (Rutas, Layouts, Providers)
│       └── src/
│           ├── features/                   <-- Vertical Slices por Sección de Aplicación (FDD)
│           │   │
│           │   ├── landing/                <-- 🌐 1. LANDING & PUBLIC HERO
│           │   │   ├── index.ts            <-- Public API Boundary
│           │   │   ├── presentation/       <-- Hero Section, Dark Theme, Splash Screen, Motion 12
│           │   │   ├── application/        <-- Static Content Loaders, Editorial DTOs, SEO Metadata
│           │   │   ├── domain/             <-- Structured Data Models (JSON-LD, AI Discovery)
│           │   │   └── infrastructure/     <-- CMS / Content as Code repositories
│           │   │
│           │   ├── marketplace/            <-- 🛒 2. MARKETPLACE & PROPERTY CATALOG
│           │   │   ├── index.ts            <-- Public API Boundary
│           │   │   ├── presentation/       <-- 3D Visualizer, Mapbox Cards, Deal Economics, Detail View
│           │   │   ├── application/        <-- Property Selection Hooks, Filter Actions
│           │   │   ├── domain/             <-- Investment Rules, Token Price Calculations
│           │   │   └── infrastructure/     <-- Marketplace DB Repositories, Metaplex Core RPC Adapters
│           │   │
│           │   ├── checkout-payment/       <-- 💳 3. CHECKOUT & SINGLE PAYMENT FUNNEL (DEDICATED)
│           │   │   ├── index.ts            <-- Public API Boundary (Exporta Vistas /checkout y /checkout/success)
│           │   │   ├── presentation/       <-- CheckoutPageClient, PaymentMethodSelector, SuccessReceipt
│           │   │   ├── application/        <-- processCryptoPaymentAction, processAirwallexPaymentAction
│           │   │   ├── domain/             <-- Anti-bot Limits, Purchase Idempotency Rules
│           │   │   └── infrastructure/     <-- Airwallex Client, Solana Purchase Adapter, Attempt Repositories
│           │   │
│           │   ├── recurring-deposits/     <-- 💵 4. RECURRING FIAT TOP-UPS & SUBSCRIPTIONS (DEDICATED)
│           │   │   ├── index.ts            <-- Public API Boundary (Exporta Controles de Recarga Recurrente)
│           │   │   ├── presentation/       <-- RecurringTopupCard, ScheduleSelector, LittioSubscriptionManager
│           │   │   ├── application/        <-- setupRecurringDepositAction, processRecurringTopupWebhookAction
│           │   │   ├── domain/             <-- RecurringScheduleRules, TopupInvariants
│           │   │   └── infrastructure/     <-- Littio Client, Sphere Solana Adapter, Subscription Repository
│           │   │
│           │   ├── offline-recovery/       <-- 🛡️ 5. OFFLINE RECOVERY PROTOCOL & ANCHOR NOTARY (DEDICATED)
│           │   │   ├── index.ts            <-- Public API Boundary (Exporta Modal de Recuperación y Queue Offline)
│           │   │   ├── presentation/       <-- RecoveryPromptModal, InterruptedTransactionCard, SyncBadge
│           │   │   ├── application/        <-- recoverInterruptedTransactionAction, submitAnchorNotaryProofAction
│           │   │   ├── domain/             <-- RecoveryPayloadInvariants, AnchorNotaryRules, OfflineSessionState
│           │   │   └── infrastructure/     <-- AnchorNotaryRpcClient, IndexedDbSignatureStore, RecoveryRepo
│           │   │
│           │   ├── profile/                <-- 👤 6. USER PROFILE & KYC / IDENTITY (DEDICATED)
│           │   │   ├── index.ts            <-- Public API Boundary (Exporta Vista /profile/perfil)
│           │   │   ├── presentation/       <-- ProfileFormCard, KycIdentityStatusCard, RewardPromptModal
│           │   │   ├── application/        <-- saveProfileDetailsAction, completeKycAction
│           │   │   ├── domain/             <-- UserProfile Model, KycStatusInvariants, RewardRules
│           │   │   └── infrastructure/     <-- User DB Repository, Kyc Provider Adapter
│           │   │
│           │   ├── investor-portfolio/     <-- 📈 5. INVESTOR PORTFOLIO & HOLDINGS (DEDICATED)
│           │   │   ├── index.ts            <-- Public API Boundary (Exporta Vista /profile/portfolio)
│           │   │   ├── presentation/       <-- PortfolioOverviewWidget, HoldingsBreakdownChart, AssetCard
│           │   │   ├── application/        <-- fetchInvestorHoldingsQuery, calculatePortfolioReturnQuery
│           │   │   ├── domain/             <-- InvestorHolding Model, AssetValuationRules
│           │   │   └── infrastructure/     <-- Solana DAS Layer Indexer RPC, On-Chain Asset Fetcher
│           │   │
│           │   ├── referral-marketing/     <-- 🎁 6. REFERRAL SYSTEM & REWARDS (DEDICATED)
│           │   │   ├── index.ts            <-- Public API Boundary (Exporta Vista /profile/referrals)
│           │   │   ├── presentation/       <-- ReferralLinkCard, CommissionMetricsWidget, InviteModal
│           │   │   ├── application/        <-- generateReferralCodeAction, trackReferralCommissionAction
│           │   │   ├── domain/             <-- ReferralTierRules, MultiLevelCommissionRules
│           │   │   └── infrastructure/     <-- Referral DB Repository, Commission Ledger
│           │   │
│           │   ├── educational-resources/  <-- 📚 7. BLOG & AI DISCOVERY EDITORIAL (DEDICATED)
│           │   │   ├── index.ts            <-- Public API Boundary (Exporta /resources, /knowledge, /platform)
│           │   │   ├── presentation/       <-- ResourcePageTemplate, ArticleCardGrid, ArticleJsonLd
│           │   │   ├── application/        <-- getResourceBySlug, getAllResourcesQuery
│           │   │   ├── domain/             <-- ArticleEntity, EditorialSeoContracts
│           │   │   └── infrastructure/     <-- ContentAsCodeLoader, RssAiFeedGenerator
│           │   │
│           │   ├── pwa-notifications/      <-- 📱 8. PWA INSTALLABILITY & WEB PUSH (DEDICATED)
│           │   │   ├── index.ts            <-- Public API Boundary (Exporta Banner PWA, Bell de Notificaciones)
│           │   │   ├── presentation/       <-- PwaInstallBanner, WebPushNotificationModal, PushCampaignConsole
│           │   │   ├── application/        <-- subscribeToWebPushAction, sendPushCampaignAction, usePwaPrompt
│           │   │   ├── domain/             <-- PushPayloadRules, PwaInstallabilityInvariants
│           │   │   └── infrastructure/     <-- WebPushVapidAdapter, PushSubscriptionRepository, ServiceWorker
│           │   │
│           │   ├── admin/                  <-- ⚙️ 8. ADMIN SHELL & SYSTEM OPERATIONS
│           │   │   ├── index.ts            <-- Public API Boundary
│           │   │   ├── presentation/       <-- Admin Layout Shell, Navigation Sidebar, Audit Logs UI
│           │   │   ├── application/        <-- System Monitoring Actions, Admin Operations
│           │   │   ├── domain/             <-- Admin Authority Rules, System Audit Invariants
│           │   │   └── infrastructure/     <-- Authority Registry, Webhook Repositories
│           │   │
│           │   ├── property-management/    <-- 🏠 9. PROPERTY ASSET EDITOR & CONTENT (DEDICATED)
│           │   │   ├── index.ts            <-- Public API Boundary (Exporta Editores de Inmuebles)
│           │   │   ├── presentation/       <-- PropertyInformationEditor, DocumentsEditor, SummaryEditor
│           │   │   ├── application/        <-- savePropertyDetailsAction, uploadPropertyDocumentsAction
│           │   │   ├── domain/             <-- RealEstateAsset Model, Document Validation Rules
│           │   │   └── infrastructure/     <-- Property DB Repository, Pinata IPFS Upload Adapter
│           │   │
│           │   ├── staking-distribution/   <-- 💰 10. STAKING & SQUADS V4 CLAIMS (DEDICATED)
│           │   │   ├── index.ts            <-- Public API Boundary (Exporta Widgets para Admin y Profile)
│           │   │   ├── presentation/       <-- AdminDistributionConsole, InvestorClaimsWidget
│           │   │   ├── application/        <-- executeDistributionAction, claimDividendsAction
│           │   │   ├── domain/             <-- Distribution Engine Rules, Prorrateo Math, Squads Vaults
│           │   │   └── infrastructure/     <-- Squads v4 RPC Adapter, Stake History Repositories
│           │   │
│           │   ├── nft-minting/            <-- 🎨 11. METAPLEX CORE MINTING & CANDY MACHINE (DEDICATED)
│           │   │   ├── index.ts            <-- Public API Boundary (Exporta Notaría & Candy Machine UI)
│           │   │   ├── presentation/       <-- AdminCandyMachineConsole, NotarySigningCard
│           │   │   ├── application/        <-- createCollectionMintAction, executeCandyMachineMintAction
│           │   │   ├── domain/             <-- Anchor Notary Rules, Metaplex Core Collection Plugins
│           │   │   └── infrastructure/     <-- Umi / Metaplex Core RPC Adapters, IPFS Metadata Repositories
│           │   │
│           │   ├── asset-freeze-control/   <-- 🔒 12. ASSET FREEZE & THAW POLICIES (DEDICATED)
│           │   │   ├── index.ts            <-- Public API Boundary (Exporta Controles de Freeze/Thaw)
│           │   │   ├── presentation/       <-- FreezeThawControlCard, PermanentFreezePolicyUi
│           │   │   ├── application/        <-- freezeAssetAction, thawAssetAction, setPermanentFreezeAction
│           │   │   ├── domain/             <-- FreezeInvariants, Metaplex Core Freeze Plugin Rules
│           │   │   └── infrastructure/     <-- Freeze Authority RPC Client, On-Chain State Fetcher
│           │   │
│           │   ├── transparency-portal/    <-- 📊 13. TRANSPARENCY & ON-CHAIN STRATEGY PORTAL (DEDICATED)
│           │   │   ├── index.ts            <-- Public API Boundary (Exporta Vista /transparencia)
│           │   │   ├── presentation/       <-- TransparencyContent, InvestmentModelsSection
│           │   │   ├── application/        <-- fetchPublicMetricsAction, getInvestmentModelsQuery
│           │   │   ├── domain/             <-- InvestmentModelRules, TransparencyMetricsModel
│           │   │   └── infrastructure/     <-- Public On-Chain Metrics RPC, Financial Models Repository
│           │   │
│           │   └── shared/                 <-- 📦 RECURSOS COMPARTIDOS (Cross-Cutting)
│           │       ├── ui/                 <-- Look visual global, Design System UI Kit, Modo Oscuro/Claro, Motion 12
│           │       ├── wallet/             <-- Conexión de Red & Wallet Standard (@solana/kit, Wallet Modal)
│           │       ├── auth/               <-- SISTEMA DE AUTENTICACIÓN HÍBRIDA Y AUTORIZACIÓN
│           │       │   ├── siws/           <-- 🔐 Sign-In With Solana (Firma Criptográfica)
│           │       │   ├── workos/         <-- 📧 Login OAuth/OIDC WorkOS (Email / Social Fiat)
│           │       │   ├── reconciliation/ <-- 🔗 Reconciliador Híbrido (Vinculación Wallet ↔ Email)
│           │       │   └── rbac/           <-- 🛡️ RBAC Global Guards (Admin, Operator, Investor Roles)
│           │       ├── i18n/               <-- 🌐 Internacionalización (useI18n, LocaleProvider, localize)
│           │       ├── notifications/      <-- PWA Web Push & Transacciones Transactional
│           │       └── infrastructure/     <-- INFRAESTRUCTURA Y ADAPTADORES COMPARTIDOS
│           │           ├── db/             <-- Cliente Drizzle PostgreSQL y Esquemas Base
│           │           ├── solana-rpc/     <-- Cliente RPC Base Solana y Providers
│           │           ├── squads/         <-- Cliente SDK Squads v4 Multisig (@squads/v4)
│           │           ├── metaplex/       <-- INTEGRACIÓN METAPLEX CORE Y DAS LAYER
│           │           │   ├── das-fetcher/<-- 🔍 Lectura Indexada (DAS API: getAssetsByOwner/Group)
│           │           │   └── core-writer/<-- ✍️ Escritura On-Chain (Umi + mpl-core + Candy Machine)
│           │           └── ipfs/           <-- Cliente Upload Pinata IPFS
│           │
├── .agents/                                <-- Harness de Desarrollo y Agentes AI (Antigravity)
└── packages/
    └── solana-client/                      <-- Autogenerated Solana Client (@solana/kit via IDL)
```

### Trazabilidad de Features Rastreadas desde el Índice OKF

| Sección Web / Feature Slice | Trazabilidad OKF / Iniciativas Rastreadas | Dominio y Funcionalidades |
| :--- | :--- | :--- |
| **`landing/`** | `BRI-39`, `BRI-65`, `BRI-68`, `BRI-121`, `BRI-168` | Portada principal, Dark Hero Section, Splash Screen de carga inicial, contenido institucional (`about`, `regulatory`). |
| **`marketplace/`** | `BRI-164` (S1-S44), `BRI-153` | Catálogo interactivo de propiedades tokenizadas, visualizador 3D, mapas dinámicos Mapbox, detalle de inmueble, deal economics y selector de oferta. |
| **`checkout-payment/`** | `EPIC-003` (Stories 01-06), `BRI-151`, `app/checkout` | Feature autónoma para el embudo de checkout y pasarelas de pago: pagos en Crypto (Solana) y Fiat (Airwallex), consumo de créditos de perfil (`BRI-151`), anti-bot limits, idempotencia de compra y recibo de éxito. |
| **`profile/`** | `BRI-151` (S1-S8), `BRI-153`, `app/profile/perfil` | Feature autónoma para perfil de usuario, completado de datos de cuenta, verificación KYC / identidad e incentivos de recompensa por perfil (Migración de `/protected/perfil` a `/profile/perfil`). |
| **`investor-portfolio/`** | `BRI-171`, `BRI-174`, `app/profile/portfolio` | Feature autónoma para el portafolio real del inversionista: holdings de tokens/NFTs en Solana DAS layer, gráficos de distribución de activos y cálculo de rentabilidad (Migración de `/protected/portfolio` a `/profile/portfolio`). |
| **`referral-marketing/`** | `BRI-16`, `app/profile/referrals` | Feature autónoma para el sistema de referidos y marketing: generación de códigos/links de invitación, seguimiento de comisiones multinivel y métricas de adquisición (Migración de `/protected/referrals` a `/profile/referrals`). |
| **`educational-resources/`** | `EPIC-010` (Stories 01-10), `app/resources`, `app/knowledge`, `app/platform` | Feature autónoma para el sistema de blog, artículos educativos, whitepapers y exportaciones AI Discovery: plantillas editoriales, cargador Content-as-Code, esquemas JSON-LD y feeds RSS/AI. |
| **`admin/`** | `BRI-123`, `EPIC-011` (Story 01) | Shell de la consola de administración, navegación general, layout de administración y monitoreo del sistema. |
| **`property-management/`** | `EPIC-011` (Stories 02-07), `BRI-10` | Feature autónoma para gestión y edición de propiedades: editores de información inmobiliaria, resumen financiero, adjuntos PDF/documentos y sugerencias contextuales de localización. |
| **`staking-distribution/`** | `BRI-6`, `BRI-7`, `BRI-8` (Stories & RFCs Squads v4) | Feature autónoma para Staking y Reclamaciones de Tesorería Squads v4: motor de cálculo de prorrateo, trazabilidad de dividendos, firma multisig de distribución para admins y widget de cobro individual para inversionistas. |
| **`nft-minting/`** | `solana-p0-05` (H1-H3, H8-H10), `solana-p0-06` (H1-H6), `BRI-5` | Feature autónoma para acuñación de NFTs Metaplex Core: Candy Machine deploys, Anchor Notary signatures, creación de colecciones e indexador DAS layer. |
| **`asset-freeze-control/`** | `solana-p0-05` (H4-H5, H7), `solana-p0-06` (H7), `BRI-170` | Feature autónoma para políticas de congelamiento: acciones de Freeze/Thaw de NFTs en la consola admin, Permanent Freeze policy, delegación de autoridades y salvaguardas de owner freeze. |
| **`transparency-portal/`** | `app/transparencia` | Feature autónoma para el portal público de transparencia y estrategia: modelos de inversión (Fix & Flip, Renting, Land development), métricas operativas on-chain y divulgación de estrategia. |
| **`shared/`** | `BRI-12`, `BRI-160`, `BRI-154`, `BRI-159`, `BRI-66`, `BRI-163`, `BRI-157`, `BRI-156` | UI Kit y Design System con Modo Oscuro/Claro y animaciones Motion 12, Conexión de red y modal de Wallet Standard con `@solana/kit`, Autenticación Híbrida (WorkOS + SIWS), Sistema de Autorización RBAC (`src/features/shared/auth/rbac/`), i18n, PWA Web Push Notifications, cliente base de base de datos (PostgreSQL/Drizzle). |

### Definición de las 4 Capas Funcionales dentro de cada Feature Slice (`src/features/[feature]/`):
1. **Presentation Layer (`presentation/`)**: Componentes de UI puros (React Server & Client Components) con animaciones de Motion 12 (`motion.dev`). Prohibido importar clientes de base de datos o llamadas directas a RPC de Solana.
2. **Application / Consumption Layer (`application/`)**: Server Actions, hooks reactivos (`useTransactionPool`, Zustand, TanStack Query) y DTOs de validación con Zod.
3. **Domain / Pipelines Layer (`domain/`)**: Lógica de negocio pura, Value Objects y construcciones de instrucciones de Solana con `@solana/kit` (`pipe()`). 100% independiente de frameworks UI o DBs.
4. **Infrastructure Layer (`infrastructure/`)**: Repositorios de persistencia (PostgreSQL/Drizzle), clientes RPC de Solana y llamadas a servicios externos.

## 3. Atomic Slices & Logical Sequence (Estrategia Incremental de Validación por Fases)

Para garantizar que **cada componente siga funcionando perfectamente** tras cada migración, la iniciativa se ejecutará de forma atómica a través de **23 SPECs secuenciales**. Cada SPEC está estrictamente acotado y especifica sus archivos de origen, destino en 4 capas FDD, tickets OKF resueltos y comando de verificación:

---

### 🔴 Fase 1: Pruebas Iniciales de Arquitectura (TDD Baseline)

#### **`SPEC-01 (TDD Baseline & Monorepo FDD Architecture Harness)`**
* **Objetivo & Alcance**: Diseñar y escribir la suite de pruebas de gobernanza FDD en `tests/harness/specs/09-monorepo-fdd-architecture.test.ts` (Fase RED). Esta suite audita que ningún archivo en `presentation/` o `application/` importe librerías de base de datos o Solana v1, que cada feature exporte su API vía `index.ts` y que no existan importaciones cruzadas prohibidas.
* **Archivos Afectados**: `[NEW] tests/harness/specs/09-monorepo-fdd-architecture.test.ts`.
* **Trazabilidad OKF**: `AGENTS.md` (Gatekeeper 1 & Double-Gatekeeper protocol).
* **Verificación**: `pnpm test tests/harness/specs/09-monorepo-fdd-architecture.test.ts` (Debe fallar intencionalmente antes de migrar código).

---

### 🏗️ Fase 2: Infraestructura Monorepo & Recursos Compartidos (`shared/`)

#### **`SPEC-02 (Monorepo Root & Workspace Isolation)`**
* **Objetivo & Alcance**: Configurar la estructura física de monorepo pnpm workspaces. Mover el proyecto Next.js a `apps/web/`, aislar los smart contracts de Rust en `programs/` en la raíz y configurar la librería cliente autogenerada `packages/solana-client`.
* **Archivos Afectados**: `[NEW] pnpm-workspace.yaml`, `[MODIFY] package.json`, `[NEW] apps/web/`, `[NEW] packages/solana-client/`.
* **Trazabilidad OKF**: `BRI-186`, `clean-code-folder-structure.md`.
* **Verificación**: `pnpm validate:architecture` y compilación limpia con `pnpm dev`.

#### **`SPEC-03 (Shared Infrastructure: Drizzle Database & Persistence Layer)`**
* **Objetivo & Alcance**: Estructurar `src/features/shared/infrastructure/db/`. Migrar el cliente base de PostgreSQL/Drizzle y los modelos de esquemas relacionales.
* **Archivos Afectados**: `lib/db.ts` ➔ `src/features/shared/infrastructure/db/drizzle-client.ts`, `db/schema.ts` ➔ `src/features/shared/infrastructure/db/schema.ts`.
* **Trazabilidad OKF**: `BRI-12`, `BRI-160`.
* **Verificación**: `pnpm validate:db` y `pnpm test tests/lib/knowledge-system.test.ts`.

#### **`SPEC-04 (Shared Network Wallet Connection, Hybrid Auth & Global RBAC)`**
* **Objetivo & Alcance**: Estructurar `src/features/shared/wallet/` y `src/features/shared/auth/`. Migrar la conexión de red RPC con `@solana/kit`, el modal Wallet Standard y desglosar la autenticación/autorización en 4 sub-módulos autónomos: `siws/` (Sign-In With Solana), `workos/` (OAuth Email/Social Fiat), `reconciliation/` (Reconciliador Híbrido de Identidades) y `rbac/` (Guards Globales de Autorización).
* **Archivos Afectados**: `lib/solana-wallet.ts` ➔ `src/features/shared/wallet/wallet-adapter.ts`, `lib/auth.ts` ➔ `src/features/shared/auth/reconciliation/hybrid-auth-service.ts`, `[NEW] src/features/shared/auth/rbac/rbac-guards.ts`.
* **Trazabilidad OKF**: `BRI-154`, `BRI-159`, `BRI-123`.
* **Verificación**: `pnpm test tests/lib/content-contracts.test.ts`, pruebas de firma SIWS y tests unitarios de guards RBAC.

#### **`SPEC-05 (Shared UI Kit, Dark Mode & Motion 12 Design System)`**
* **Objetivo & Alcance**: Estructurar `src/features/shared/ui/`. Migrar componentes atómicos globales (`Button`, `Modal`, `Card`, `Input`, `Navbar`, `Sidebar`), el selector de tema Modo Oscuro/Claro (`ThemeToggle`) y pulido visual con animaciones de Motion 12 (`motion.dev`).
* **Archivos Afectados**: `components/ui/*` ➔ `src/features/shared/ui/components/*`, `components/theme-toggle.tsx` ➔ `src/features/shared/ui/theme-toggle.tsx`.
* **Trazabilidad OKF**: `BRI-66`, `BRI-163`.
* **Verificación**: `pnpm build` y verificación visual del selector de tema en navegador.

#### **`SPEC-06 (Shared Metaplex Core & DAS Layer Infrastructure)`**
* **Objetivo & Alcance**: Estructurar `src/features/shared/infrastructure/metaplex/` dividiéndolo explícitamente en `das-fetcher/` (lectura indexada rápida de activos/NFTs) y `core-writer/` (escritura on-chain Umi + `mpl-core`).
* **Archivos Afectados**: `lib/das-layer-fetcher.ts` ➔ `src/features/shared/infrastructure/metaplex/das-fetcher/das-client.ts`, `lib/metaplex-core-admin.ts` ➔ `src/features/shared/infrastructure/metaplex/core-writer/umi-client.ts`.
* **Trazabilidad OKF**: `solana-p0-05`, `solana-p0-06`.
* **Verificación**: Tests unitarios de cliente Umi y llamada JSON-RPC a DAS `getAssetsByOwner`.

#### **`SPEC-07 (Shared Squads v4 Multisig Infrastructure)`**
* **Objetivo & Alcance**: Estructurar `src/features/shared/infrastructure/squads/`. Crear el cliente e integrador del SDK de Squads v4 (`@squads/v4`) para la gestión de propuestas multisig, firma de transacciones de tesorería y bóvedas on-chain.
* **Archivos Afectados**: `lib/squads-v4-client.ts` ➔ `src/features/shared/infrastructure/squads/squads-v4-client.ts`.
* **Trazabilidad OKF**: `EPIC-014`, `BRI-6/7/8`.
* **Verificación**: Test unitario del builder de propuestas multisig Squads v4.

---

### 🌐 Fase 3: Migración Incremental de Vertical Feature Slices

#### **`SPEC-08 (Feature Slice: Landing & Public Hero)`**
* **Objetivo & Alcance**: Migrar portada principal, Dark Hero Section, Splash Screen de carga inicial y páginas legales a `src/features/landing/`. Convertir `app/page.tsx` y `app/about/page.tsx` en Thin Wrappers.
* **Capas FDD**: `presentation/` (Hero, Splash), `application/` (EditorialLoaders), `domain/` (HeroDataModel), `infrastructure/` (CmsLoader).
* **Archivos Afectados**: `components/landing/*` ➔ `src/features/landing/presentation/*`, `app/page.tsx` ➔ Thin Wrapper.
* **Trazabilidad OKF**: `BRI-39`, `BRI-65`, `BRI-68`.
* **Verificación**: `pnpm validate:seo`, `pnpm validate:routes` y comprobación visual de la portada.

#### **`SPEC-09 (Feature Slice: Educational Resources & AI Discovery Blog - EPIC-010)`**
* **Objetivo & Alcance**: Migrar las rutas `/resources`, `/knowledge`, `/platform` y el cargador Content-as-Code (`EPIC-010`) a `src/features/educational-resources/`. Configurar datos estructurados `JSON-LD` y feeds RSS/AI (`/llms.txt`).
* **Capas FDD**: `presentation/` (ArticleCardGrid, ResourcePageTemplate), `application/` (getResourceBySlug), `domain/` (ArticleEntity), `infrastructure/` (ContentAsCodeLoader, RssAiFeedGenerator).
* **Archivos Afectados**: `app/resources/*`, `app/data/*` ➔ `src/features/educational-resources/*`.
* **Trazabilidad OKF**: `EPIC-010` (Stories 01-10).
* **Verificación**: `pnpm validate:seo`, `pnpm test` de validación Content-as-Code y verificación de `JSON-LD`.

#### **`SPEC-10 (Feature Slice: PWA Installability & Web Push Notifications - EPIC-013)`**
* **Objetivo & Alcance**: Migrar componentes de instalación PWA (`PwaInstallBanner`), gestor de suscripciones VAPID y consola admin de campañas Web Push (`EPIC-013`) a `src/features/pwa-notifications/`.
* **Capas FDD**: `presentation/` (PwaInstallBanner, WebPushPermissionModal), `application/` (subscribeToWebPushAction), `domain/` (PushPayloadRules), `infrastructure/` (WebPushVapidAdapter, ServiceWorker).
* **Archivos Afectados**: `components/pwa/*` ➔ `src/features/pwa-notifications/*`, `app/manifest.ts`.
* **Trazabilidad OKF**: `EPIC-013`.
* **Verificación**: `pnpm test` de Service Worker y suscripción VAPID Push.

#### **`SPEC-11 (Feature Slice: Transparency & Strategy Portal)`**
* **Objetivo & Alcance**: Migrar la página pública `/transparencia`, modelos de inversión (Fix & Flip, Renting) y métricas auditables on-chain a `src/features/transparency-portal/`. Convertir `app/transparencia/page.tsx` en Thin Wrapper.
* **Capas FDD**: `presentation/` (TransparencyContent, InvestmentModelsSection), `application/` (fetchPublicMetricsAction), `domain/` (InvestmentModelRules), `infrastructure/` (PublicOnChainMetricsRpc).
* **Archivos Afectados**: `app/transparencia/*` ➔ `src/features/transparency-portal/*`.
* **Trazabilidad OKF**: `app/transparencia`.
* **Verificación**: `pnpm validate:routes` y comprobación visual del portal de transparencia.

#### **`SPEC-12 (Feature Slice: Marketplace & 3D Property Catalog)`**
* **Objetivo & Alcance**: Migrar catálogo de inmuebles, tarjetas Mapbox, visualizador 3D y deal economics a `src/features/marketplace/`. Convertir `app/marketplace/*` en Thin Wrappers.
* **Capas FDD**: `presentation/` (Visualizer3D, MapboxCardGrid, PropertyDetailView), `application/` (usePropertyFilter), `domain/` (DealEconomicsRules), `infrastructure/` (MarketplaceRepository, DAS layer consumer).
* **Archivos Afectados**: `components/marketplace/*`, `app/marketplace/*` ➔ `src/features/marketplace/*`.
* **Trazabilidad OKF**: `BRI-164` (S1-S44), `BRI-153`.
* **Verificación**: `pnpm validate:content` y comprobación interactiva del catálogo 3D.

#### **`SPEC-13 (Feature Slice: Checkout & Single Payment Funnel - EPIC-003)`**
* **Objetivo & Alcance**: Migrar el embudo de compra única, pasarelas de pago Crypto (Solana) y Fiat (Airwallex), consumo de créditos (`BRI-151`), anti-bot limits y recibo de éxito (`app/checkout`, `app/checkout/success`) a `src/features/checkout-payment/`.
* **Capas FDD**: `presentation/` (CheckoutPageClient, PaymentMethodSelector), `application/` (processCryptoPaymentAction, processAirwallexPaymentAction), `domain/` (AntiBotLimits, PurchaseIdempotencyRules), `infrastructure/` (AirwallexClient, SolanaPurchaseAdapter).
* **Archivos Afectados**: `app/checkout/*`, `components/checkout/*` ➔ `src/features/checkout-payment/*`.
* **Trazabilidad OKF**: `EPIC-003` (Stories 01-06), `BRI-151`.
* **Verificación**: `pnpm e2e:playwright` (smoke test de compra) y tests de pasarela Airwallex.

#### **`SPEC-14 (Feature Slice: Recurring Fiat Top-Ups & Subscriptions - EPIC-008)`**
* **Objetivo & Alcance**: Migrar el módulo autónomo de recargas recurrentes de saldo Fiat/USDC (Littio / Sphere Solana) a `src/features/recurring-deposits/`.
* **Capas FDD**: `presentation/` (RecurringTopupCard, ScheduleSelector), `application/` (setupRecurringDepositAction, processWebhookAction), `domain/` (RecurringScheduleRules), `infrastructure/` (LittioClient, SphereAdapter).
* **Archivos Afectados**: `lib/recurring-topup.ts`, `components/recurring-topup/*` ➔ `src/features/recurring-deposits/*`.
* **Trazabilidad OKF**: `EPIC-008`.
* **Verificación**: Tests unitarios de lógica de suscripción periódica y webhook handlers.

#### **`SPEC-15 (Feature Slice: Offline Recovery Protocol & Anchor Notary - EPIC-007)`**
* **Objetivo & Alcance**: Migrar el protocolo de recuperación offline, firmas diferidas en IndexedDB y notariado Anchor a `src/features/offline-recovery/`.
* **Capas FDD**: `presentation/` (RecoveryPromptModal, SyncBadge), `application/` (recoverTransactionAction), `domain/` (AnchorNotaryRules), `infrastructure/` (AnchorNotaryRpcClient, IndexedDbStore).
* **Archivos Afectados**: `lib/offline-recovery.ts`, `components/recovery/*` ➔ `src/features/offline-recovery/*`.
* **Trazabilidad OKF**: `EPIC-007`.
* **Verificación**: Tests unitarios de resiliencia offline y firma notariada Anchor.

#### **`SPEC-16 (Feature Slice: User Profile & KYC / Identity - Renaming /protected/perfil -> /profile/perfil)`**
* **Objetivo & Alcance**: Migrar perfil de usuario, completado de cuenta y verificación KYC/AML a `src/features/profile/`. Renombrar todas las rutas de `/protected/perfil` a `/profile/perfil` y `/profile`.
* **Capas FDD**: `presentation/` (ProfileFormCard, KycIdentityStatusCard), `application/` (saveProfileDetailsAction, completeKycAction), `domain/` (UserProfileModel, KycStatusInvariants), `infrastructure/` (UserRepository, KycAdapter).
* **Archivos Afectados**: `app/protected/perfil/*` ➔ `app/profile/perfil/*`, `src/features/profile/*`.
* **Trazabilidad OKF**: `BRI-151` (S1-S8), `EPIC-004`.
* **Verificación**: `pnpm test` de lógica de perfil y verificación de acceso a `/profile/perfil`.

#### **`SPEC-17 (Feature Slice: Investor Portfolio & Real Holdings - Renaming /protected/portfolio -> /profile/portfolio)`**:
* **Objetivo & Alcance**: Migrar vista de portafolio del inversionista, lectura de holdings on-chain en Solana DAS layer y gráficos ECharts a `src/features/investor-portfolio/`. Renombrar la ruta `/protected/portfolio` a `/profile/portfolio`.
* **Capas FDD**: `presentation/` (PortfolioOverviewWidget, HoldingsBreakdownChart), `application/` (fetchInvestorHoldingsQuery), `domain/` (InvestorHoldingModel), `infrastructure/` (DAS layer consumer).
* **Archivos Afectados**: `app/protected/portfolio/*` ➔ `app/profile/portfolio/*`, `src/features/investor-portfolio/*`.
* **Trazabilidad OKF**: `BRI-171`, `BRI-174`.
* **Verificación**: `pnpm test` de consulta de portafolio en la nueva ruta `/profile/portfolio`.

#### **`SPEC-18 (Feature Slice: Referral Marketing System - Renaming /protected/referrals -> /profile/referrals)`**:
* **Objetivo & Alcance**: Migrar el sistema de referidos, generación de links únicos de invitación y comisiones multinivel (`BRI-16`) a `src/features/referral-marketing/`. Renombrar la ruta `/protected/referrals` a `/profile/referrals`.
* **Capas FDD**: `presentation/` (ReferralLinkCard, CommissionMetricsWidget), `application/` (generateReferralCodeAction), `domain/` (ReferralTierRules), `infrastructure/` (ReferralRepository).
* **Archivos Afectados**: `app/protected/referrals/*` ➔ `app/profile/referrals/*`, `src/features/referral-marketing/*`.
* **Trazabilidad OKF**: `BRI-16`.
* **Verificación**: Tests unitarios de motor de referidos en la nueva ruta `/profile/referrals`.

#### **`SPEC-19 (Feature Slice: Property Asset Management - EPIC-001 & EPIC-011)`**:
* **Objetivo & Alcance**: Migrar la consola de gestión de propiedades de la administración (`app/admin/assets`, editores de resúmenes financieros, cargadores de PDFs) a `src/features/property-management/`.
* **Capas FDD**: `presentation/` (PropertyInformationEditor, DocumentsEditor), `application/` (savePropertyDetailsAction), `domain/` (RealEstateAssetModel), `infrastructure/` (PropertyRepository, IPFSAdapter).
* **Archivos Afectados**: `app/admin/assets/*`, `components/admin/property/*` ➔ `src/features/property-management/*`.
* **Trazabilidad OKF**: `EPIC-001`, `EPIC-011` (Stories 02-07).
* **Verificación**: `pnpm validate:content` y tests de edición de propiedades.

#### **`SPEC-20 (Feature Slice: Staking & Squads v4 Treasury Claims - EPIC-014)`**:
* **Objetivo & Alcance**: Migrar el módulo de Staking, prorrateo de rentas y cobro de dividendos (`BRI-6/7/8`) a `src/features/staking-distribution/`. Incluye el widget de cobro para el inversionista y la consola admin respaldada por `shared/infrastructure/squads`.
* **Capas FDD**: `presentation/` (AdminDistributionConsole, InvestorClaimsWidget), `application/` (executeDistributionAction, claimDividendsAction), `domain/` (ProrrateoMath, DistributionRules), `infrastructure/` (Squads v4 consumer).
* **Archivos Afectados**: `app/protected/stake/*`, `components/admin/distributions/*` ➔ `src/features/staking-distribution/*`.
* **Trazabilidad OKF**: `EPIC-014`, `BRI-6/7/8`.
* **Verificación**: `pnpm test tests/lib/knowledge-system.test.ts` y tests unitarios de distribución de rentas.

#### **`SPEC-21 (Feature Slice: Metaplex Core NFT Minting & Candy Machine - EPIC-002)`**:
* **Objetivo & Alcance**: Migrar la consola de acuñación de colecciones Metaplex Core, deploys de Candy Machine v3 y firma notariada Anchor (`solana-p0-05/06`) a `src/features/nft-minting/`.
* **Capas FDD**: `presentation/` (AdminCandyMachineConsole, NotarySigningCard), `application/` (createCollectionMintAction), `domain/` (AnchorNotaryRules), `infrastructure/` (Metaplex core-writer consumer).
* **Archivos Afectados**: `app/admin/mint/*`, `components/admin/metaplex-core-mint-panel.tsx` ➔ `src/features/nft-minting/*`.
* **Trazabilidad OKF**: `EPIC-002` (Stories 01-07), `solana-p0-05`.
* **Verificación**: `pnpm test` de validación de metadatos Metaplex Core.

#### **`SPEC-22 (Feature Slice: Asset Freeze & Thaw Policies - EPIC-006)`**:
* **Objetivo & Alcance**: Migrar las políticas de congelamiento/descongelamiento de activos (Freeze Authority, Permanent Freeze) a `src/features/asset-freeze-control/`.
* **Capas FDD**: `presentation/` (FreezeThawControlCard, PermanentFreezePolicyUi), `application/` (freezeAssetAction), `domain/` (FreezeInvariants), `infrastructure/` (FreezeAuthorityRpcClient).
* **Archivos Afectados**: `lib/core-freeze-control.ts`, `components/admin/freeze/*` ➔ `src/features/asset-freeze-control/*`.
* **Trazabilidad OKF**: `EPIC-006`, `solana-p0-05-h4/h5`.
* **Verificación**: Tests unitarios de invariantes de Freeze y firma de congelamiento.

---

### 🧹 Fase 4: Limpieza & Cierre de Gobernanza

#### **`SPEC-23 (Clean Code Audit, Final Hardening & Monorepo Validation)`**
* **Objetivo & Alcance**: Eliminación de carpetas y archivos obsoletos en la raíz (`components/`, `lib/`), verificación de cero código legado (`@solana/web3.js` v1), sincronización del grafo de conocimiento `.agents/graph.json` y auditoría de Gatekeeper 2 por parte del `architect`.
* **Archivos Afectados**: Limpieza general de archivos en la raíz.
* **Trazabilidad OKF**: `AGENTS.md` (Definition of Done & Gatekeeper 2).
* **Verificación**: Ejecución limpia de `pnpm validate` al 100% verde (0 errores, 0 warnings).

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `tests/harness/specs/09-monorepo-fdd-architecture.test.ts` y `tests/lib/monorepo-fdd-governance.test.ts`
- **Command**: `pnpm test tests/harness/specs/09-monorepo-fdd-architecture.test.ts`
- **Assertion Goals**:
  - Validar que `check-monorepo-structure.sh` acepte la estructura de workspaces (`apps/`, `programs/`, `packages/`, `.agents/`).
  - Validar que las 4 secciones principales (`landing`, `marketplace`, `profile`, `admin`) y `shared` respeten los límites de la Public API Boundary (`index.ts`).
  - Validar que ninguna ruta en `apps/web/src/features/*/presentation` contenga importaciones de capas de infraestructura o base de datos directas.
  - Verificar que el cliente de Solana en `packages/solana-client` consuma `@solana/kit` fáci de importar en los Feature Slices.

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas de regresión pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] La documentación de gobernanza y arquitectura del monorepo está actualizada.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jeisonsosa-BRI-186-monorepo-fdd-architecture.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/features/feature-jeisonsosa-BRI-186-monorepo-fdd-architecture.md)
- **Solution Spec**: [feature-jeisonsosa-BRI-186-monorepo-fdd-architecture-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/features/feature-jeisonsosa-BRI-186-monorepo-fdd-architecture-implementation.md)
- **Linear Issue**: [Linear Ticket #BRI-186](https://linear.app/brids-app/issue/BRI-186)

