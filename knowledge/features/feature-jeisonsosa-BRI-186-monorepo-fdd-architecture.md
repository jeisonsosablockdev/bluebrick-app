# Problem Spec: monorepo-fdd-architecture (BRI-186)

## What problem exists
El proyecto BRIDS cuenta actualmente con una estructura donde la aplicación de Next.js, los componentes de UI, las llamadas a la blockchain de Solana, la base de datos y la configuración del harness de desarrollo conviven en la misma estructura monolítica de directorios (`app/`, `components/`, `lib/`, `db/`). 
Esta mezcla genera acoplamiento entre capas, dificulta el escalamiento del desarrollo por módulos/features independientes, y expone el runtime de la aplicación web a dependencias directas o duplicaciones en la integración con los contratos de Solana y las herramientas de IA.

## Why it matters
1. **Escalabilidad de Mantenimiento & DX**: A medida que crecen las funcionalidades de BRIDS (NFT Minting, Staking, Marketplace, Integraciones Web3), la falta de límites claros dificulta la refactorización y la adición de nuevas características sin romper flujos existentes.
2. **Desacoplamiento de Runtimes**: Los contratos de Solana en Rust (Anchor Framework) y el harness de IA con Antigravity en `.agents/` deben contar con fronteras claras respecto a la app web en Next.js.
3. **Calidad y Aislamiento de Capas**: Prevenir que la capa visual (Presentation Layer) acceda directamente a conexiones de base de datos o llamadas RPC de Solana sin pasar por la capa de aplicación y dominio.

## What outcome is expected
1. **Estructura Monorepo Workspaces**:
   - `programs/`: Smart contracts de Solana en Rust (Anchor) 100% aislados en la raíz.
   - `apps/web/`: Aplicación Next.js 16+ App Router estructurada internamente bajo **Feature-Driven Design (FDD)** en 16 Vertical Feature Slices autónomas (`landing`, `marketplace`, `checkout-payment`, `recurring-deposits`, `offline-recovery`, `profile`, `investor-portfolio`, `referral-marketing`, `educational-resources`, `pwa-notifications`, `admin`, `property-management`, `staking-distribution`, `nft-minting`, `asset-freeze-control`, `transparency-portal`).
   - `src/features/shared/`: Recursos compartidos cross-cutting desglosados explícitamente:
     - `auth/`: `siws/`, `workos/`, `reconciliation/`, `rbac/`.
     - `infrastructure/`: `db/`, `solana-rpc/`, `squads/`, `metaplex/` (`das-fetcher/` y `core-writer/`), `ipfs/`.
     - `ui/`: Design System UI Kit, Modo Oscuro/Claro (ThemeToggle) y animaciones Motion 12.
     - `wallet/`: Conexión Solana Kit & Modal Wallet Standard.
     - `i18n/`: Internacionalización.
   - `packages/solana-client`: Paquete para la auto-generación de clientes fuertemente tipados con `@solana/kit` derivados del IDL compilado desde Anchor.
2. **Migración de Rutas de Área Privada**: Renombrar las rutas de `/protected/*` a `/profile/*` (`/profile`, `/profile/perfil`, `/profile/portfolio`, `/profile/referrals`).
3. **Verificación & Gobernanza**: Pasar la suite `pnpm validate` y las comprobaciones de `check-monorepo-structure.sh` y `check-layered-architecture.sh`.

## What gaps exist today
- Falta de la estructura `apps/web/` y `packages/solana-client` en el monorepo.
- Componentes en `components/` y páginas en `app/` organizados horizontalmente en lugar de por 16 Vertical Feature Slices (FDD).
- Rutas legacy en `/protected/*` en lugar del nuevo estándar `/profile/*`.
- Clientes RPC de Solana, Metaplex y llamadas a base de datos dispersas en helpers dentro de `lib/`.

## What questions remain open
- Ninguna. Las decisiones principales de arquitectura, desacoplamiento de runtimes, co-localización de features autónomas y estrategia de migración gradual por 23 SPECs secuenciales fueron definidas y acordadas mediante la entrevista de alineación (`/grill-me`).
