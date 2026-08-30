# Solution Spec: seo-favicon-web-discovery Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend` & `api`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture
The solution delivers a unified, Next.js 16 native metadata and web discovery suite while resolving code bloat, font loading anti-patterns, and redundant dependencies identified in the audit.

1. **Layer 1: Presentation (Metadata, Routes & UI Shell)**
   - `apps/web/src/app/icon.tsx`: Dynamically renders the 32x32 SVG/PNG browser favicon using Next.js `ImageResponse` with the BlueBrick 4-bar angled emblem.
   - `apps/web/src/app/apple-icon.tsx`: Dynamically renders the 180x180 PNG Apple Touch Icon for iOS home screen shortcuts.
   - `apps/web/src/app/opengraph-image.tsx`: Dynamically generates the 1200x630 OpenGraph social share card with luxury brand tokens.
   - `apps/web/src/app/twitter-image.tsx`: Dynamically generates the 1200x630 Twitter card social preview.
   - `apps/web/src/app/manifest.ts`: Generates `manifest.webmanifest` defining PWA application metadata and theme colors (`#0A1220`, `#C41230`, `#2F8F6B`).
   - `apps/web/src/app/robots.ts`: Next.js dynamic robots handler controlling crawler access and linking to `sitemap.xml`.
   - `apps/web/src/app/sitemap.ts`: Next.js dynamic sitemap generator declaring entries for `/` (priority 1.0) and `/dashboard` (priority 0.8 demo).
   - `apps/web/src/app/layout.tsx`: Root HTML layout configuring `next/font/google` font optimization (`Space_Grotesk`, `Inter`, `JetBrains_Mono`), enhanced metadata, canonical links, robots parameters, and Schema.org JSON-LD embedding.
   - `apps/web/src/app/dashboard/page.tsx`: Injects dedicated title and metadata for the public demo experience.
   - `apps/web/src/components/dashboard/investment-dashboard.tsx`: Removes dynamic `useEffect` font injection and relies on CSS variables provided by `layout.tsx`.
   - `apps/web/src/components/seo/structured-data.tsx`: React component safely injecting Schema.org JSON-LD payloads into `<head>`.
   - **Pruning Dead Presentation Components**: Deletes orphan `apps/web/src/components/theme/theme-toggle.tsx` and `apps/web/src/components/ui/card.tsx`.

2. **Layer 2: Application / Consumption**
   - Direct consumption of metadata pipelines and structured data generators within Next.js App Router metadata conventions.
   - **Pruning Dead State**: Deletes orphan `apps/web/src/lib/state/app-state.ts`.

3. **Layer 3: Domain & Pipelines**
   - `apps/web/src/lib/pipelines/seo-metadata-pipeline.ts`: Domain pipeline providing:
     - `buildPageMetadata(config: SeoMetadataConfig): Metadata`: Constructs complete Next.js 16 metadata configurations.
     - `generatePlatformJsonLd(): SchemaOrgPlatform`: Emits multi-entity Schema.org structured data (`FinancialService`, `RealEstateAgent`, `WebSite`).

4. **Layer 4: Infrastructure & Package Cleanup**
   - Zero external third-party crawler dependencies. Relies exclusively on Next.js 16 App Router native edge/node rendering via `@vercel/og` (`ImageResponse`) and web standards.
   - `package.json`: Prunes `@cfworker/json-schema` and `valibot` dependencies, standardizing all schema validation on `zod`.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: SEO Metadata, Dynamic Favicons, OpenGraph Cards, Robots, Sitemap, Native Fonts & Code Cleanup (Branch: `feature/jaymusicmachine-BBC-12-seo-favicon-web-discovery`)
  - **Fase RED (TDD)**: Unit tests covering `buildPageMetadata`, `generatePlatformJsonLd`, `robots()` rules, `sitemap()` entries, `manifest()` properties, and starter utility refactors.
  - **Fase GREEN**: Implementation of `icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`, `twitter-image.tsx`, `manifest.ts`, updating `robots.ts`, `sitemap.ts`, `layout.tsx` (with `next/font/google`), `investment-dashboard.tsx`, pruning dead files, updating `package.json`, and adding mandatory in-code commentary.
  - **Fase REFACTOR**: Clean code refactoring audit (`code-refactoring-refactor-clean`), layer isolation verification, full typechecking, and `pnpm validate`.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `tests/unit/seo-metadata-pipeline.test.ts` & `tests/unit/seo-routes.test.ts`
- **Command**: `pnpm test tests/unit/seo-metadata-pipeline.test.ts`
- **Assertion Goals**:
  - Verify `generatePlatformJsonLd()` produces compliant Schema.org JSON-LD graph with valid `@context`, `@type: FinancialService` / `RealEstateAgent`, URLs, and logo references.
  - Verify `buildPageMetadata()` returns correct canonical URLs, OpenGraph image dimensions (1200x630), Twitter card types, and robots directives.
  - Verify `robots()` disallows `/api/`, `/callback`, and `/auth/` while permitting public roots and pointing to canonical `sitemap.xml`.
  - Verify `sitemap()` returns entries for `/` (priority 1.0) and `/dashboard` (priority 0.8) with valid ISO timestamps.
  - Verify `manifest()` exports valid PWA manifest fields (`name`, `short_name`, `theme_color`, `background_color`, `display: standalone`).

## 5. Local Definition of Done (DoD)
- [ ] El rastreador de estado `.agents/active_task_state.json` está sincronizado con la tarea `BBC-12`.
- [ ] La suite de pruebas de regresión pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] Los generadores dinámicos (`icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`, `manifest.ts`) compilan y responden correctamente.
- [ ] Google Fonts cargan de forma nativa vía `next/font/google` sin inyecciones en `useEffect`.
- [ ] Dependencias y archivos muertos podados limpiamente.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BBC-12-seo-favicon-web-discovery.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-12-seo-favicon-web-discovery.md)
- **Solution Spec**: [feature-jaymusicmachine-BBC-12-seo-favicon-web-discovery-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-12-seo-favicon-web-discovery-implementation.md)
- **Linear Issue**: [Linear Ticket #BBC-12](https://linear.app/brids-app/issue/BBC-12)
