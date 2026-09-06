# Solution Spec: social-sharing-card-preview Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture
The solution aligns the social sharing metadata, dynamic OpenGraph image generator, and canonical domain resolution with 4-Layer Functional Web3 Architecture:

### Layer 1: Presentation (App Router & UI)
- `apps/web/src/app/layout.tsx`:
  - Dynamically configure `metadataBase` to use `process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://portal.bluebrick.capital")`.
  - Add explicit `openGraph.images` declaration:
    ```ts
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "BlueBrick | Capital Inteligente · Activos Reales",
      },
    ],
    ```
  - Update `openGraph.title`: `"BlueBrick | Capital Inteligente · Activos Reales"`.
  - Update `openGraph.description`: `"Oportunidades inmobiliarias seleccionadas para crear y hacer crecer tu patrimonio."`.
  - Update `twitter.card` to `"summary_large_image"`, with `images: ["/opengraph-image"]`, title, and description.
- `apps/web/src/app/opengraph-image.tsx`:
  - Update badge text: `"CREACIÓN DE PATRIMONIO"`.
  - Update main headline: `"Capital Inteligente. Activos Reales"`.
  - Update subtitle text: `"Oportunidades inmobiliarias seleccionadas para crear y hacer crecer tu patrimonio."`.
  - Add 3 strategic value pillars:
    - `"Real Estate · Inversión Inmobiliaria"`
    - `"Gestión Profesional · Estrategia y Control"`
    - `"Patrimonio · Crecimiento Sostenible"`
  - Update footer watermark: `"portal.bluebrick.capital"` on left, and `"Patrimonio · Crecimiento Sostenible"` on right.
  - Maintain canonical brand tokens (`BRAND_COLORS.deepNavy`, `BRAND_COLORS.pureWhite`, `BRAND_COLORS.crimsonRed`, `BRAND_GEOMETRY`).

### Layer 2: Application / Consumption
- Consumption of metadata is handled natively by Next.js 16 App Router during SSR / static rendering.

### Layer 3: Domain & Pipelines
- `apps/web/src/lib/pipelines/seo-metadata-pipeline.ts`:
  - Update `DEFAULT_SITE_URL` from `"https://bluebrick-app.vercel.app"` to `"https://portal.bluebrick.capital"`.
  - Ensure `buildPageMetadata` aligns image fallback URLs with the canonical production domain.

### Layer 4: Infrastructure
- Next.js Edge / Vercel OG image generation engine with standard PNG MIME headers and caching directives.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1**: Social Sharing Card Banner & Metadata Alignment (Rama: `SPEC/jaymusicmachine-BBC-19-s01-social-sharing-card-preview`)
  - Red Phase: Design failing tests asserting updated titles, descriptions, explicit image dimension contracts, and dynamic domain resolution.
  - Green Phase: Update `layout.tsx`, `opengraph-image.tsx`, and `seo-metadata-pipeline.ts` with explicit in-code commentary.
  - Refactor Phase: Clean code audit, remove any dead fallback strings, verify Gate 2 compliance.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `tests/unit/seo-metadata-pipeline.test.ts` & `tests/unit/seo-routes.test.ts`
- **Command**: `pnpm test:unit`
- **Assertion Goals**:
  1. `buildPageMetadata` uses `https://portal.bluebrick.capital` as the default site URL.
  2. `layout.tsx` metadata contains explicit `openGraph.images` array with `1200x630` dimensions and type `image/png`.
  3. `layout.tsx` metadata title is `"BlueBrick | Capital Inteligente · Activos Reales"`.
  4. `layout.tsx` metadata description is `"Oportunidades inmobiliarias seleccionadas para crear y hacer crecer tu patrimonio."`.
  5. `opengraph-image.tsx` exports correct `size` (1200x630), `contentType` (`image/png`), and `alt`.

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas unitarias (`tests/unit/seo-metadata-pipeline.test.ts`, `tests/unit/seo-routes.test.ts`) pasa al 100%.
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] WhatsApp / Social share card metadata probada y validada contra los contratos institucionales.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [fix-jaymusicmachine-BBC-19-social-sharing-card-preview.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/fixes/fix-jaymusicmachine-BBC-19-social-sharing-card-preview.md)
- **Solution Spec**: [fix-jaymusicmachine-BBC-19-social-sharing-card-preview-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/knowledge/fixes/fix-jaymusicmachine-BBC-19-social-sharing-card-preview-implementation.md)
- **Linear Issue**: [BBC-19: Bugfix: OpenGraph Dynamic Card Preview and Social Sharing Metadata Alignment](https://linear.app/bluebrick/issue/BBC-19)
