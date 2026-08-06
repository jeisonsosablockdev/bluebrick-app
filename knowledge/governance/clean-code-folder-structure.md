# 🏛️ BRIDS Clean Code & Folder Structure Specification
*(Governance Standard for Feature-Driven Design, 4-Layer Architecture & Monorepo Workspaces)*

---

## 1. Visión General y Filosofía de Diseño

Esta especificación define la estructura canónica de directorios y reglas de encapsulamiento para el proyecto **BRIDS**. Combina dos patrones arquitectónicos principales:

1. **Monorepo Workspaces (Nivel Macro)**: Aislamiento estricto entre el código on-chain en Rust (`programs/`), la aplicación web en Next.js (`apps/web/`), el harness de agentes e IA (`.agents/`), y los clientes autogenerados (`packages/`).
2. **Feature-Driven Design / FDD + 4 Capas Funcionales (Nivel Micro)**: Organización del código frontend/backend por **Vertical Slices de Negocio** (`src/features/[feature_name]/`), sustituyendo la organización tradicional por tipo de archivo técnico.

---

## 2. Mapa Completo de Carpetas de la Arquitectura

```text
brids/                                    <-- Raíz del Monorepo (pnpm-workspace.yaml)
├── programs/                             <-- 🔒 SOLANA SMART CONTRACTS (Rust / Anchor)
│   ├── brids-protocol/
│   │   ├── src/lib.rs                    <-- Lógica del programa en Rust
│   │   └── Cargo.toml
│   └── Anchor.toml
│
├── apps/                                 <-- 🌐 APLICACIONES Y MICROFRONTENDS
│   └── web/                              <-- Next.js 16+ App Router
│       ├── app/                          <-- Thin App Router (Solo Rutas, Layouts y Providers)
│       │   ├── (dashboard)/
│       │   ├── admin/
│       │   ├── marketplace/
│       │   ├── layout.tsx
│       │   └── providers.tsx
│       │
│       └── src/                          <-- Código Fuente de la App Web
│           ├── features/                 <-- 🎯 VERTICAL SLICES (Feature-Driven Design)
│           │   │
│           │   ├── landing/              <-- 🌐 1. SECCIÓN LANDING & CONTENIDO PÚBLICO
│           │   │   ├── index.ts          <-- Public API Boundary
│           │   │   ├── presentation/     <-- Dark Hero, Splash Screen, SEO Layouts, Motion 12
│           │   │   ├── application/      <-- Static Loaders, Editorial DTOs, SEO Metadata
│           │   │   ├── domain/           <-- Structured Data Models (JSON-LD, AI Discovery)
│           │   │   └── infrastructure/   <-- Content as Code / CMS Repositories
│           │   │
│           │   ├── marketplace/            <-- 🛒 2. SECCIÓN MARKETPLACE & CATÁLOGO DE INMUEBLES
│           │   │   ├── index.ts          <-- Public API Boundary
│           │   │   ├── presentation/     <-- Visualizador 3D, Mapas Mapbox, Deal Economics
│           │   │   ├── application/      <-- Hooks de Selección de Inmueble, Filtros
│           │   │   ├── domain/           <-- Reglas de Inversión, Precios
│           │   │   └── infrastructure/   <-- Repositorios DB Marketplace, Metaplex RPC Adapters
│           │   │
│           │   ├── checkout-payment/     <-- 💳 3. MÓDULO AUTÓNOMO CHECKOUT & PASARELAS DE PAGO
│           │   │   ├── index.ts          <-- Public API Boundary (Exporta Vistas /checkout y /checkout/success)
│           │   │   ├── presentation/     <-- CheckoutPageClient, PaymentMethodSelector, Recibo Exitoso
│           │   │   ├── application/      <-- Acciones de Pago Crypto (Solana) y Fiat (Airwallex), Créditos
│           │   │   ├── domain/           <-- Anti-bot Limits, Claves de Idempotencia de Compra
│           │   │   └── infrastructure/   <-- Airwallex Client, Solana Purchase Adapter, Attempt Repositories
│           │   │
│           │   ├── recurring-deposits/   <-- 💵 4. MÓDULO AUTÓNOMO RECARGAS RECURRENTES FIAT (LITTIO / SPHERE)
│           │   │   ├── index.ts          <-- Public API Boundary (Exporta Controles de Recarga Recurrente)
│           │   │   ├── presentation/     <-- RecurringTopupCard, ScheduleSelector, LittioSubscriptionManager
│           │   │   ├── application/      <-- setupRecurringDepositAction, processRecurringTopupWebhookAction
│           │   │   ├── domain/           <-- RecurringScheduleRules, TopupInvariants
│           │   │   └── infrastructure/   <-- Littio Client, Sphere Solana Adapter, Subscription Repository
│           │   │
│           │   ├── offline-recovery/     <-- 🛡️ 5. MÓDULO AUTÓNOMO RECUPERACIÓN OFFLINE & ANCHOR NOTARY
│           │   │   ├── index.ts          <-- Public API Boundary (Exporta Modal de Recuperación y Queue Offline)
│           │   │   ├── presentation/     <-- RecoveryPromptModal, InterruptedTransactionCard, SyncBadge
│           │   │   ├── application/      <-- recoverInterruptedTransactionAction, submitAnchorNotaryProofAction
│           │   │   ├── domain/           <-- RecoveryPayloadInvariants, AnchorNotaryRules, OfflineSessionState
│           │   │   └── infrastructure/   <-- AnchorNotaryRpcClient, IndexedDbSignatureStore, RecoveryRepo
│           │   │
│           │   ├── profile/                <-- 👤 4. SECCIÓN PERFIL & KYC IDENTIDAD
│           │   │   ├── index.ts          <-- Public API Boundary (Exporta Vista /profile/perfil)
│           │   │   ├── presentation/     <-- ProfileFormCard, KycIdentityStatusCard
│           │   │   ├── application/      <-- saveProfileDetailsAction, completeKycAction
│           │   │   ├── domain/           <-- UserProfile Model, KycStatusInvariants
│           │   │   └── infrastructure/   <-- User DB Repository, Kyc Provider Adapter
│           │   │
│           │   ├── investor-portfolio/   <-- 📈 5. MÓDULO AUTÓNOMO PORTAFOLIO DE INVERSIÓN & HOLDINGS
│           │   │   ├── index.ts          <-- Public API Boundary (Exporta Vista /profile/portfolio)
│           │   │   ├── presentation/     <-- PortfolioOverviewWidget, HoldingsBreakdownChart
│           │   │   ├── application/      <-- fetchInvestorHoldingsQuery, calculatePortfolioReturnQuery
│           │   │   ├── domain/           <-- InvestorHolding Model, AssetValuationRules
│           │   │   └── infrastructure/   <-- Solana DAS Layer Indexer RPC, On-Chain Fetchers
│           │   │
│           │   ├── referral-marketing/   <-- 🎁 6. MÓDULO AUTÓNOMO SISTEMA DE REFERIDOS Y RECOMPENSAS
│           │   │   ├── index.ts          <-- Public API Boundary (Exporta Vista /profile/referrals)
│           │   │   ├── presentation/     <-- ReferralLinkCard, CommissionMetricsWidget
│           │   │   ├── application/      <-- generateReferralCodeAction, trackReferralCommissionAction
│           │   │   ├── domain/           <-- ReferralTierRules, MultiLevelCommissionRules
│           │   │   └── infrastructure/   <-- Referral DB Repository, Commission Ledger
│           │   │
│           │   ├── educational-resources/<-- 📚 7. MÓDULO AUTÓNOMO BLOG & AI DISCOVERY EDITORIAL
│           │   │   ├── index.ts          <-- Public API Boundary (Exporta Vistas /resources, /knowledge, /platform)
│           │   │   ├── presentation/     <-- ResourcePageTemplate, ArticleCardGrid, ArticleJsonLd
│           │   │   ├── application/      <-- getResourceBySlug, getAllResourcesQuery
│           │   │   ├── domain/           <-- ArticleEntity, EditorialSeoContracts
│           │   │   └── infrastructure/   <-- ContentAsCodeLoader, RssAiFeedGenerator
│           │   │
│           │   ├── pwa-notifications/    <-- 📱 8. MÓDULO AUTÓNOMO PWA & NOTIFICACIONES WEB PUSH
│           │   │   ├── index.ts          <-- Public API Boundary (Exporta Banner PWA, Bell de Notificaciones)
│           │   │   ├── presentation/     <-- PwaInstallBanner, WebPushNotificationModal, PushCampaignConsole
│           │   │   ├── application/      <-- subscribeToWebPushAction, sendPushCampaignAction, usePwaPrompt
│           │   │   ├── domain/           <-- PushPayloadRules, PwaInstallabilityInvariants
│           │   │   └── infrastructure/   <-- WebPushVapidAdapter, PushSubscriptionRepository, ServiceWorker
│           │   │
│           │   ├── admin/                <-- ⚙️ 8. ADMIN SHELL & SYSTEM OPERATIONS
│           │   │   ├── index.ts          <-- Public API Boundary
│           │   │   ├── presentation/     <-- Admin Layout Shell, Navigation Sidebar, Audit Logs UI
│           │   │   ├── application/      <-- System Monitoring Actions, Admin Operations
│           │   │   ├── domain/           <-- Admin Authority Rules, System Audit Invariants
│           │   │   └── infrastructure/   <-- Authority Registry, Webhook Repositories
│           │   │
│           │   ├── property-management/  <-- 🏠 5. MÓDULO AUTÓNOMO GESTIÓN Y EDICIÓN DE PROPIEDADES
│           │   │   ├── index.ts          <-- Public API Boundary (Exporta Editores de Inmuebles)
│           │   │   ├── presentation/     <-- PropertyInformationEditor, DocumentsEditor, SummaryEditor
│           │   │   ├── application/      <-- savePropertyDetailsAction, uploadPropertyDocumentsAction
│           │   │   ├── domain/           <-- RealEstateAsset Model, Document Validation Rules
│           │   │   └── infrastructure/   <-- Property DB Repository, Pinata IPFS Upload Adapter
│           │   │
│           │   ├── staking-distribution/ <-- 💰 6. MÓDULO AUTÓNOMO STAKING & SQUADS V4 CLAIMS
│           │   │   ├── index.ts          <-- Public API Boundary (Exporta Widgets para Admin y Profile)
│           │   │   ├── presentation/     <-- AdminDistributionConsole, InvestorClaimsWidget
│           │   │   ├── application/      <-- executeDistributionAction, claimDividendsAction
│           │   │   ├── domain/           <-- Algoritmos de Prorrateo, Reglas Squads Vault
│           │   │   └── infrastructure/   <-- Squads v4 RPC Adapter, Repositorios de Historial
│           │   │
│           │   ├── nft-minting/          <-- 🎨 7. MÓDULO AUTÓNOMO METAPLEX CORE MINTING & CANDY MACHINE
│           │   │   ├── index.ts          <-- Public API Boundary (Exporta Notaría & Candy Machine UI)
│           │   │   ├── presentation/     <-- AdminCandyMachineConsole, NotarySigningCard
│           │   │   ├── application/      <-- createCollectionMintAction, executeCandyMachineMintAction
│           │   │   ├── domain/           <-- Anchor Notary Rules, Metaplex Core Collection Plugins
│           │   │   └── infrastructure/   <-- Umi / Metaplex Core RPC Adapters, IPFS Metadata Repositories
│           │   │
│           │   ├── asset-freeze-control/ <-- 🔒 8. MÓDULO AUTÓNOMO FREEZE & THAW POLICIES
│           │   │   ├── index.ts          <-- Public API Boundary (Exporta Controles de Freeze/Thaw)
│           │   │   ├── presentation/     <-- FreezeThawControlCard, PermanentFreezePolicyUi
│           │   │   ├── application/      <-- freezeAssetAction, thawAssetAction, setPermanentFreezeAction
│           │   │   ├── domain/           <-- FreezeInvariants, Metaplex Core Freeze Plugin Rules
│           │   │   └── infrastructure/   <-- Freeze Authority RPC Client, On-Chain State Fetcher
│           │   │
│           │   ├── transparency-portal/  <-- 📊 9. MÓDULO AUTÓNOMO TRANSPARENCIA Y ESTRATEGIA
│           │   │   ├── index.ts          <-- Public API Boundary (Exporta Vista /transparencia)
│           │   │   ├── presentation/     <-- TransparencyContent, InvestmentModelsSection
│           │   │   ├── application/      <-- fetchPublicMetricsAction, getInvestmentModelsQuery
│           │   │   ├── domain/           <-- InvestmentModelRules, TransparencyMetricsModel
│           │   │   └── infrastructure/   <-- Public On-Chain Metrics RPC, Financial Models Repository
│           │   │
│           │   └── shared/               <-- 📦 RECURSOS COMPARTIDOS (Cross-Cutting Infrastructure)
│           │       ├── ui/               <-- UI Kit Componentes globales, Modo Oscuro/Claro, Motion 12
│           │       ├── wallet/           <-- Conexión de Red & Wallet Standard (@solana/kit, Wallet Modal)
│           │       ├── auth/             <-- SISTEMA DE AUTENTICACIÓN HÍBRIDA Y AUTORIZACIÓN
│           │       │   ├── siws/         <-- 🔐 Sign-In With Solana (Firma Criptográfica)
│           │       │   ├── workos/       <-- 📧 Login OAuth/OIDC WorkOS (Email / Social Fiat)
│           │       │   ├── reconciliation/<-- 🔗 Reconciliador Híbrido (Vinculación Wallet ↔ Email)
│           │       │   └── rbac/         <-- 🛡️ RBAC Global Guards (Admin, Operator, Investor Roles)
│           │       ├── i18n/             <-- 🌐 Internacionalización (useI18n, LocaleProvider, localize)
│           │       └── infrastructure/   <-- INFRAESTRUCTURA Y ADAPTADORES COMPARTIDOS
│           │           ├── db/           <-- Cliente Drizzle PostgreSQL y Esquemas Base
│           │           ├── solana-rpc/   <-- Cliente RPC Base Solana y Providers
│           │           ├── squads/       <-- Cliente SDK Squads v4 Multisig (@squads/v4)
│           │           ├── metaplex/     <-- INTEGRACIÓN METAPLEX CORE Y DAS LAYER
│           │           │   ├── das-fetcher/ <-- 🔍 Lectura Indexada (DAS API: getAssetsByOwner/Group)
│           │           │   └── core-writer/ <-- ✍️ Escritura On-Chain (Umi + mpl-core + Candy Machine)
│           │           └── ipfs/         <-- Cliente Upload Pinata IPFS
│           │
├── .agents/                              <-- 🤖 HARNESS DE IA Y AGENTES (Antigravity)
│   ├── agents/                           <-- Perfiles YAML de Subagentes (architect, solana, etc.)
│   ├── graph.json                        <-- Grafo de conocimiento topológico de la app
│   └── hooks.json                        <-- Reglas de lifecycle y Double-Gatekeeper Protocol
│
└── packages/                             <-- 📦 LIBRERÍAS INTERNAS COMPARTIDAS
    └── solana-client/                    <-- Cliente @solana/kit autogenerado desde IDL Anchor
```

---

## 3. Matriz Estricta de Permisos de Importación (Import Matrix)

Para mantener la independencia y la modularidad del código, se aplican dos reglas de importación fundamentales:

### Regla A: Jerarquía Vertical de Capas (Dentro de una Feature)
```text
Layer 1: Presentation  --->  Layer 2: Application  --->  Layer 3: Domain  <--- Layer 4: Infrastructure
```
1. **Presentation Layer (`presentation/`)**:
   - ✅ Puede importar: `application/`, `shared/ui`
   - ❌ **PROHIBIDO**: Importar `domain/` directamente, `infrastructure/`, `@solana/kit` o conexiones de DB.
2. **Application Layer (`application/`)**:
   - ✅ Puede importar: `domain/`, `infrastructure/` (vía interfaces/repositorios)
   - ❌ **PROHIBIDO**: Importar componentes JSX/React de `presentation/`.
3. **Domain Layer (`domain/`)**:
   - ✅ Puede importar: `@solana/kit`, Zod, utilidades puras de TypeScript.
   - ❌ **PROHIBIDO**: Importar React, Next.js, HTML, UI, Prisma, Drizzle, PostgreSQL o HTTP clients. Debe ser 100% agnóstico a frameworks.
4. **Infrastructure Layer (`infrastructure/`)**:
   - ✅ Puede importar: PostgreSQL, Drizzle, Solana RPC, SDKs de terceros (Resend, Pinata).
   - ❌ **PROHIBIDO**: Importar componentes JSX o React Hooks.

### Regla B: Encapsulamiento Horizontal entre Features (Public API Boundary)
```text
Feature A  --->  features/B/index.ts (Public API)  --->  Feature B Internals
```
* Una feature `features/nft-minting` **solo puede importar** de otra feature `features/auth` a través del archivo de entrada público: `features/auth/index.ts`.
* ❌ **PROHIBIDO**: Importaciones profundas dentro de las tripas de otra feature (ej: `import { SecretButton } from '@/features/auth/presentation/components/SecretButton'`).

---

## 4. Convenciones de Código y Patrones de Sintaxis

1. **Functional-First over OOP**:
   - Prohibido el uso de la palabra clave `class` para modelos o controladores.
   - Toda la lógica se expresa mediante **Funciones Puras** y composición con `pipe()` de TypeScript.
2. **Solana Modern Stack**:
   - Prohibido importar `@solana/web3.js` (v1).
   - Prohibido instanciar objetos imperativos como `new Connection()` o `new Transaction()`.
   - Uso obligatorio de la suite funcional `@solana/kit` (`@solana/client`, `@solana/transaction-messages`).
3. **Validación Zod Obligatoria**:
   - Toda Server Action o endpoint de entrada debe validar sus DTOs con esquemas Zod en la capa de `application/dtos/`.

---

## 5. Instrucciones de Inyección para el Agente `architect`

Cuando el subagente `architect` ejecute sus revisiones de **Gatekeeper 1 (Pre-Code)** o **Gatekeeper 2 (Post-Code)**, debe verificar:

1. **Grafo de Grafo de Conocimiento**: Consultar `.agents/graph.json` para verificar la topología del archivo modificado.
2. **Ubicación Física del Archivo**: Validar que si el archivo reside en `apps/web/src/features/[name]/presentation/`, no contenga ningún import de `@solana/kit`, `pg`, `drizzle` ni `infrastructure`.
3. **Barrels de Importación**: Validar que los imports entre carpetas de `features/` pasen exclusivamente por el `index.ts` raíz de la feature correspondiente.
4. **Validación de Whitelist**: Asegurar que no se creen carpetas fuera de la estructura de Monorepo Whitelist.
