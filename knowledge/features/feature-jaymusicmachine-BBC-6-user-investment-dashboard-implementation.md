# Solution Spec: BlueBrick Investor Platform Implementation (Landing + Neon Postgres + Dashboard UI + WorkOS + SEO/SEM)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend` & `db` & `api`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture
The platform is organized strictly under the 4-layer functional Web3/SaaS architecture:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 1: Presentation (app routes, UI components, SEO tags)             │
│ - apps/web/src/app/page.tsx (Landing Entrypoint & Mock Login)           │
│ - apps/web/src/app/dashboard/page.tsx (Live Investor Dashboard)         │
│ - apps/web/src/app/sitemap.ts (Dynamic XML sitemap)                     │
│ - apps/web/src/app/robots.ts (Robots crawling policy)                   │
│ - apps/web/src/components/landing/landing-hero.tsx                      │
│ - apps/web/src/components/landing/investor-login-card.tsx               │
│ - apps/web/src/components/dashboard/investment-dashboard.tsx            │
│ - apps/web/src/components/dashboard/blue-brick-mark.tsx                 │
│ - apps/web/src/components/dashboard/stat-chip.tsx                       │
│ - apps/web/src/components/dashboard/metric-row.tsx                      │
│ - apps/web/src/components/dashboard/status-badge.tsx                    │
│ - apps/web/src/components/profile/avatar-upload-modal.tsx                │
│ - apps/web/src/components/seo/json-ld.tsx (Structured Data / Rich)      │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 2: Application / Consumption (hooks, auth session, view-models)   │
│ - apps/web/src/lib/auth/workos-session.ts                               │
│ - apps/web/src/lib/hooks/use-count-up.ts                                │
│ - apps/web/src/lib/types/dashboard.ts                                   │
│ - apps/web/src/lib/types/db.ts                                          │
│ - apps/web/src/middleware.ts (WorkOS authkitMiddleware)                 │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 3: Domain / Pipelines / Services (business logic, SEO, uploads)   │
│ - apps/web/src/lib/pipelines/dashboard-metrics.ts                       │
│ - apps/web/src/lib/pipelines/user-sync-pipeline.ts                      │
│ - apps/web/src/lib/pipelines/blob-storage-pipeline.ts                   │
│ - apps/web/src/lib/pipelines/seo-metadata-pipeline.ts                   │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 4: Infrastructure (Neon Postgres repositories, Vercel Blob SDK)   │
│ - apps/web/src/lib/infrastructure/db/neon-client.ts                     │
│ - apps/web/src/lib/infrastructure/db/repositories/user-repository.ts    │
│ - apps/web/src/lib/infrastructure/db/repositories/property-repository.ts│
│ - apps/web/src/lib/infrastructure/blob/vercel-blob-client.ts            │
│ - apps/web/src/features/shared/infrastructure/db/migrations/*.sql       │
└─────────────────────────────────────────────────────────────────────────┘
```

## 3. Atomic Slices & Logical Sequence

### 🚪 SPEC-1: Landing Page de Entrada con Flujo de Mock Login
- **Rama**: `SPEC/jaymusicmachine-BBC-6-s01-landing-entrypoint-mock-login`
- **Alcance**: 
  - Landing page de entrada (`/`) con estética oscura de lujo BlueBrick (`#0A1220`, `#111B2E`, `#2F8F6B`, `#C41230`).
  - Tarjeta de acceso para inversionistas (`InvestorLoginCard`) con opción de "Iniciar Sesión como Inversionista (Sofía Martínez)" con 1-click.
  - Transición visual fluida y redirección hacia `/dashboard`.
- **TDD (Red-Green-Refactor)**:
  1. Structural RED: `tests/unit/landing-structural.test.ts`.
  2. Scaffolding stubs (Architect Gate 1).
  3. Behavioral RED: `tests/unit/landing-mock-login.test.ts`.
  4. GREEN: Implementación de la vista de landing y tarjeta de login.
  5. REFACTOR & Gate 2: Clean code audit.

---

### 🗄️ SPEC-2: Persistencia en Neon PostgreSQL & Migraciones de Seed
- **Rama**: `SPEC/jaymusicmachine-BBC-6-s02-neon-db-portfolio-seed`
- **Alcance**: 
  - Migración DDL: `001_create_investor_schema.sql` (`users`, `properties`, `user_investments`, `reinvestment_opportunities`).
  - Migración DML Seed: `002_seed_initial_properties.sql` con los datos exactos del diseño (Sofía Martínez, $163k invertido, 5 propiedades, 3 oportunidades).
  - Repositorios SQL y pool de conexiones serverless optimizado para Vercel.
- **TDD (Red-Green-Refactor)**:
  1. Structural RED: `tests/unit/neon-db-structural.test.ts`.
  2. Scaffolding stubs (Architect Gate 1).
  3. Behavioral RED: `tests/unit/neon-repositories.test.ts`.
  4. GREEN: Implementación de repositorios y migraciones.
  5. REFACTOR & Gate 2: Clean code audit.

---

### 🎨 SPEC-3: Dashboard de Inversiones con Datos Vivos de Neon & Vercel Blob (ENTREGA DE UI)
- **Rama**: `SPEC/jaymusicmachine-BBC-6-s03-user-investment-dashboard-live-data-blob`
- **Alcance**:
  - **Componentes Visuales**:
    - `InvestmentDashboard`: TopNav, Hero con métricas animadas (`useCountUp`), Donut Recharts de distribución, Carrusel con gradientes y barras de tiempo, Tabla detallada de propiedades y Banner de reinversión.
    - **Consumo de Datos Vivos**: El Server Component de `/dashboard` consulta directamente a Neon PostgreSQL para obtener el portafolio de Sofía Martínez.
  - **Vercel Blob Storage**: Subida de avatar del inversionista con `@vercel/blob`.
- **TDD (Red-Green-Refactor)**:
  1. Structural RED: `tests/unit/dashboard-ui-structural.test.ts`.
  2. Scaffolding stubs (Architect Gate 1).
  3. Behavioral RED: `tests/unit/dashboard-metrics.test.ts` & `tests/unit/blob-upload.test.ts`.
  4. GREEN: Implementación de UI y consumo de datos.
  5. REFACTOR & Gate 2: Auditoría clean-code y validación runtime con `next-dev-loop`.

---

### 🔐 SPEC-4: Integración de Autenticación Real con WorkOS AuthKit
- **Rama**: `SPEC/jaymusicmachine-BBC-6-s04-workos-auth-session`
- **Alcance**:
  - Middleware de protección de rutas (`authkitMiddleware`).
  - Helper de sesión `getAuthenticatedInvestor()` y sincronización JIT en Neon.
  - Conexión del botón de login del landing al flujo real de WorkOS.
- **TDD (Red-Green-Refactor)**:
  1. Structural RED: `tests/unit/workos-auth-structural.test.ts`.
  2. Scaffolding stubs (Architect Gate 1).
  3. Behavioral RED: `tests/unit/user-sync-pipeline.test.ts`.
  4. GREEN: Integración del middleware y flujo de sesión.
  5. REFACTOR & Gate 2: Clean code audit.

---

### 🚀 SPEC-5: Optimización SEO / SEM, Metadatos & Rendimiento Web
- **Rama**: `SPEC/jaymusicmachine-BBC-6-s05-seo-sem-optimization`
- **Alcance**:
  - Metadatos OpenGraph, Twitter Cards y canonical URLs.
  - Generación de `sitemap.ts` y `robots.ts` dinámicos.
  - Datos estructurados JSON-LD Schema.org (`FinancialProduct`, `RealEstateListing`, `Organization`).
  - Optimización de Core Web Vitals (LCP, INP, CLS) y fuentes sin layout shift.
- **TDD (Red-Green-Refactor)**:
  1. Structural RED: `tests/unit/seo-metadata-structural.test.ts`.
  2. Scaffolding stubs (Architect Gate 1).
  3. Behavioral RED: `tests/unit/seo-metadata-pipeline.test.ts`.
  4. GREEN: Generadores de metadatos y schemas.
  5. REFACTOR & Gate 2: Auditoría Lighthouse SEO/Performance y validación final `pnpm validate`.

---

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED por SPEC)
- **SPEC-1**: `tests/unit/landing-*.test.ts` (Validación de rendering de landing y mock login).
- **SPEC-2**: `tests/unit/neon-*.test.ts` (Validación de esquemas, seed SQL y queries).
- **SPEC-3**: `tests/unit/dashboard-*.test.ts` & `tests/unit/blob-*.test.ts` (Métricas, hooks y Live Data UI).
- **SPEC-4**: `tests/unit/workos-*.test.ts` (Validación de sesión y sincronización JIT).
- **SPEC-5**: `tests/unit/seo-*.test.ts` (Generación de JSON-LD, sitemaps y metatags).
- **Comando**: `pnpm test`

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] Las 5 SPECs se completan secuencialmente con sus pruebas unitarias en verde.
- [ ] Las migraciones de Neon Postgres se ejecutan limpiamente con `pnpm db:migrate`.
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] `next-dev-loop` valida el renderizado y estado en runtime sin errores de compilación o consola.
- [ ] Metadatos SEO y sitemaps validados sin errores de Schema.org.
- [ ] Aprobación explícita del humano registrada antes del PR final.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BBC-6-user-investment-dashboard.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-6-user-investment-dashboard.md)
- **Solution Spec**: [feature-jaymusicmachine-BBC-6-user-investment-dashboard-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-6-user-investment-dashboard-implementation.md)
- **Linear Issue**: [Linear Ticket #BBC-6](https://linear.app/brids-app/issue/BBC-6)




