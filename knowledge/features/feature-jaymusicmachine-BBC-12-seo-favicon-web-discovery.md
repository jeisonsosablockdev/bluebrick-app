# Problem Spec: seo-favicon-web-discovery

## What problem exists
Currently, the BlueBrick platform suffers from two interrelated architectural issues:
1. **Missing Native Next.js 16 Web Discovery & Branding Suite**: Lacks dynamic favicon generation (`icon.tsx`), Apple Touch icon (`apple-icon.tsx`), high-resolution social share cards (`opengraph-image.tsx`, `twitter-image.tsx`), PWA manifest (`manifest.ts`), and rich Schema.org JSON-LD structured data. Furthermore, `sitemap.ts` and `robots.ts` do not properly index the investor demo experience (`/dashboard` with Sofia's mock portfolio) or enforce strict crawler boundaries for private auth/API routes.
2. **Codebase Bloat, Redundant Dependencies & Suboptimal Font Loading (Ponytail Audit)**:
   - Unused dependencies in `package.json` (`@cfworker/json-schema` and redundant schema parser `valibot` alongside canonical `zod`).
   - Anti-pattern font loading: `InvestmentDashboard` dynamically injects Google Fonts `<link>` stylesheets in a client `useEffect`, introducing Cumulative Layout Shift (CLS) and blocking render.
   - Dead / orphan UI components and state files (`apps/web/src/components/theme/theme-toggle.tsx`, `apps/web/src/components/ui/card.tsx`, and `apps/web/src/lib/state/app-state.ts`).

## Why it matters
1. **Brand Identity, Social Sharing & Institutional Trust**: Links shared on Twitter/X, LinkedIn, WhatsApp, or Slack render blank or generic previews, degrading credibility for an institutional real estate investment platform.
2. **Search Engine Indexing & Organic Reach**: Search crawlers cannot parse fractional property opportunities or platform metadata without structured Schema.org JSON-LD entities (`FinancialService`, `RealEstateAgent`, `WebSite`) and dynamic sitemaps.
3. **Core Web Vitals & Clean Code Discipline**: Client-side font injection causes FOUT/CLS. Dead code and redundant dependencies increase bundle size, install times, and maintenance overhead without providing value.
4. **PWA & Mobile Add-to-Home Screen Readiness**: Without `manifest.ts` declaring theme tokens (`#0A1220`, `#C41230`, `#2F8F6B`), the mobile web app installation experience is degraded.

## What outcome is expected
1. **Native Next.js 16 Dynamic Favicon & Apple Touch Icons**:
   - `apps/web/src/app/icon.tsx`: Dynamically serves the 32x32 SVG/PNG icon with the official BlueBrick 4-bar angled isometric emblem (-14deg) with crimson accent (`#C41230`) on dark backdrop (`#0A1220`).
   - `apps/web/src/app/apple-icon.tsx`: Dynamically serves the 180x180 PNG Apple Touch Icon.
2. **Dynamic OpenGraph & Twitter Social Cards (1200x630)**:
   - `apps/web/src/app/opengraph-image.tsx` & `apps/web/src/app/twitter-image.tsx`: Renders branded high-resolution social cards with luxury dark gradients, official typography, and value proposition.
3. **Web App Manifest (PWA)**:
   - `apps/web/src/app/manifest.ts`: Configures application name, theme colors, display standalone, and icon metadata.
4. **Enhanced Sitemap & Secure Robots.txt**:
   - `apps/web/src/app/sitemap.ts`: Indexes `/` (priority 1.0) and `/dashboard` (priority 0.8 demo mode).
   - `apps/web/src/app/robots.ts`: Allows public paths while strictly disallowing `/api/`, `/callback`, and `/auth/`.
5. **Enriched Schema.org JSON-LD & Page Metadata**:
   - `apps/web/src/lib/pipelines/seo-metadata-pipeline.ts`: Emits Schema.org structured data (`FinancialService`, `RealEstateAgent`, `WebSite`).
   - Dedicated page metadata in `apps/web/src/app/dashboard/page.tsx` for Sofia's demo experience.
6. **Ponytail Clean-Code & Font Optimization**:
   - Native font loading in `layout.tsx` using `next/font/google` (`Space_Grotesk`, `Inter`, `JetBrains_Mono`) with CSS variables, removing the runtime `useEffect` font injector from `InvestmentDashboard`.
   - Pruning unused dependencies (`@cfworker/json-schema`, `valibot`) and dead code (`theme-toggle.tsx`, `card.tsx`, `app-state.ts`).

## What gaps exist today
- Missing `icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`, `twitter-image.tsx`, and `manifest.ts`.
- `robots.ts` did not explicitly disallow `/auth/`.
- `InvestmentDashboard` performed manual `<link>` DOM insertion for Google Fonts.
- `@cfworker/json-schema` and `valibot` remained in `package.json` despite `zod` being the sole canonical validator.
- Dead files `theme-toggle.tsx`, `card.tsx`, and `app-state.ts` added maintenance noise.

## What questions remain open
- None. Design decisions, indexing policies, and ponytail cleanup targets were fully resolved and aligned with the user.
