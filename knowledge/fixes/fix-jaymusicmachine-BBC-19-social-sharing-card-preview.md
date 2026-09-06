# Problem Spec: social-sharing-card-preview

## What problem exists
1. **Degraded Social Share Preview on WhatsApp & Social Media**:
   When users share the platform link (`https://portal.bluebrick.capital`) on WhatsApp, Telegram, LinkedIn, or iMessage, the link preview renders as a small, compressed square logo icon on the left with text on the right (Image 2), rather than the intended high-impact full-width 1200x630 rich card banner (Image 1).
2. **404 Image Fetch Failure via metadataBase**:
   The root cause of the fallback to the square icon is that `metadataBase` in `apps/web/src/app/layout.tsx` and `DEFAULT_SITE_URL` in `apps/web/src/lib/pipelines/seo-metadata-pipeline.ts` default to `https://bluebrick-app.vercel.app`. This domain does not exist and returns `HTTP 404 DEPLOYMENT_NOT_FOUND`. When the WhatsApp crawler parses the page and attempts to fetch `https://bluebrick-app.vercel.app/opengraph-image?...`, the request fails. WhatsApp then falls back to scraping the square `/brand/bluebrick-mark-dark.svg` and `/icon.png` from `<link rel="icon">`, producing the degraded thumbnail card.
3. **Outdated Social Sharing Copy**:
   The metadata texts currently defined in `apps/web/src/app/layout.tsx` and `apps/web/src/app/opengraph-image.tsx` display generic and obsolete copy:
   - **Current OpenGraph Title**: "BlueBrick | Inversión Inmobiliaria Fraccionada"
   - **Current OpenGraph Description**: "Plataforma privada de inversión en fracciones inmobiliarias comerciales, industriales y residenciales con alta rentabilidad."
   - **Current Banner Texts**:
     - Badge: "Inversión Inmobiliaria Fraccionada"
     - Title: "Activos Inmobiliarios Premium con Retornos Transparentes"
     - Subtitle: "Participa en fracciones comerciales, industriales y residenciales con dividendos mensuales y respaldo institucional."
     - Footer: "bluebrick-app.vercel.app" · "Institucional · Transparente · Regulado"

## Why it matters
1. **Institutional Trust & First Impression**:
   WhatsApp and social media shares are the primary viral conversion funnel for prospective investors. A broken card preview showing a tiny generic icon severely damages brand prestige and reduces click-through rates.
2. **Value Proposition Clarity**:
   The updated copy aligns with the client's direct messaging strategy:
   - "CREACIÓN DE PATRIMONIO"
   - "Capital Inteligente. Activos Reales"
   - "Oportunidades inmobiliarias seleccionadas para crear y hacer crecer tu patrimonio."
   - 3 Strategic Pillars:
     1. Real Estate / Inversión Inmobiliaria
     2. Gestión Profesional / Estrategia y Control
     3. Patrimonio / Crecimiento Sostenible

## What outcome is expected
1. **Full-Width 1200x630 Card Banner on Social Sharing**:
   - `metadataBase` in `apps/web/src/app/layout.tsx` dynamically resolves to `process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL : "https://portal.bluebrick.capital")`.
   - `DEFAULT_SITE_URL` in `apps/web/src/lib/pipelines/seo-metadata-pipeline.ts` set to `https://portal.bluebrick.capital`.
   - `openGraph.images` and `twitter.images` explicitly defined in `layout.tsx` with width `1200`, height `630`, type `image/png`, and alt text.
2. **Aligned Social Sharing Copy in Metadata**:
   - **OpenGraph & Twitter Title**: "BlueBrick | Capital Inteligente · Activos Reales"
   - **OpenGraph & Twitter Description**: "Oportunidades inmobiliarias seleccionadas para crear y hacer crecer tu patrimonio."
3. **Aligned Dynamic Banner Generator (`opengraph-image.tsx`)**:
   - **Badge**: "CREACIÓN DE PATRIMONIO"
   - **Headline**: "Capital Inteligente. Activos Reales"
   - **Subtitle**: "Oportunidades inmobiliarias seleccionadas para crear y hacer crecer tu patrimonio."
   - **Pillars**:
     - "Real Estate · Inversión Inmobiliaria"
     - "Gestión Profesional · Estrategia y Control"
     - "Patrimonio · Crecimiento Sostenible"
   - **Footer**: "portal.bluebrick.capital" · "Crecimiento Sostenible · Gestión Profesional"
4. **100% Quality & Verification**:
   - All unit tests passing (`pnpm test:unit`).
   - `pnpm validate` passes cleanly with zero errors and zero warnings.

## What gaps exist today
- `layout.tsx` had an invalid production fallback URL (`https://bluebrick-app.vercel.app`) in `metadataBase`.
- `layout.tsx` did not explicitly declare `openGraph.images` or `twitter.images` array structures.
- `opengraph-image.tsx` content strings did not reflect the client's approved texts.

## What questions remain open
- None. The client-provided texts and canonical domain `portal.bluebrick.capital` are confirmed.
