# Solution Spec: seo-favicon-web-discovery Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend` & `api`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture
The solution establishes an enterprise-grade, Next.js 16 native metadata and web discovery suite, structured strictly across the 4 canonical functional layers:

1. **Layer 1: Presentation (Metadata & Route Handlers)**
   - `apps/web/src/app/icon.tsx`: Dynamically renders the 32x32 SVG/PNG browser favicon using Next.js `ImageResponse` with the BlueBrick 4-bar angled emblem.
   - `apps/web/src/app/apple-icon.tsx`: Dynamically renders the 180x180 PNG Apple Touch Icon for iOS home screen shortcuts.
   - `apps/web/src/app/opengraph-image.tsx`: Dynamically generates the 1200x630 OpenGraph social share card with luxury brand tokens.
   - `apps/web/src/app/twitter-image.tsx`: Dynamically generates the 1200x630 Twitter card social preview.
   - `apps/web/src/app/manifest.ts`: Generates `manifest.webmanifest` defining PWA application metadata and theme colors (`#0A1220`, `#C41230`, `#2F8F6B`).
   - `apps/web/src/app/robots.ts`: Next.js dynamic robots handler controlling crawler access and linking to `sitemap.xml`.
   - `apps/web/src/app/sitemap.ts`: Next.js dynamic sitemap generator declaring entries for `/` (priority 1.0) and `/dashboard` (priority 0.8 demo).
   - `apps/web/src/app/layout.tsx`: Root HTML layout configuring enhanced metadata, canonical links, robots parameters, and Schema.org JSON-LD embedding.
   - `apps/web/src/app/dashboard/page.tsx`: Injects dedicated title and metadata for the public demo experience.
   - `apps/web/src/components/seo/structured-data.tsx`: React component safely injecting Schema.org JSON-LD payloads into `<head>`.

2. **Layer 2: Application / Consumption**
   - Direct consumption of metadata pipelines and structured data generators within Next.js App Router metadata conventions.

3. **Layer 3: Domain & Pipelines**
   - `apps/web/src/lib/pipelines/seo-metadata-pipeline.ts`: Domain pipeline providing:
     - `buildPageMetadata(config: SeoMetadataConfig): Metadata`: Constructs complete Next.js 16 metadata configurations.
     - `generatePlatformJsonLd(): SchemaOrgPlatform`: Emits multi-entity Schema.org structured data (`FinancialService`, `RealEstateAgent`, `WebSite`).

4. **Layer 4: Infrastructure**
   - Zero external third-party crawler dependencies. Relies exclusively on Next.js 16 App Router native edge/node rendering via `@vercel/og` (`ImageResponse`) and web standards.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: SEO Metadata, Dynamic Favicons, OpenGraph Cards, Robots & Sitemap (Branch: `feature/jaymusicmachine-BBC-12-seo-favicon-web-discovery`)
  - **Fase RED (TDD)**: Unit tests covering `buildPageMetadata`, `generatePlatformJsonLd`, `robots()` rules, `sitemap()` entries, and `manifest()` properties.
  - **Fase GREEN**: Implementation of `icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`, `twitter-image.tsx`, `manifest.ts`, updating `robots.ts`, `sitemap.ts`, `layout.tsx`, and `seo-metadata-pipeline.ts` with mandatory in-code commentary.
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
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BBC-12-seo-favicon-web-discovery.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-12-seo-favicon-web-discovery.md)
- **Solution Spec**: [feature-jaymusicmachine-BBC-12-seo-favicon-web-discovery-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/features/feature-jaymusicmachine-BBC-12-seo-favicon-web-discovery-implementation.md)
- **Linear Issue**: [Linear Ticket #BBC-12](https://linear.app/brids-app/issue/BBC-12)
