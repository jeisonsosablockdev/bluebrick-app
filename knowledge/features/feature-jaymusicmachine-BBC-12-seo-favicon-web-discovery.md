# Problem Spec: seo-favicon-web-discovery

## What problem exists
Currently, the BlueBrick platform lacks comprehensive, native Next.js 16 metadata generation for branding assets (favicons, Apple Touch icons, OpenGraph cards, Twitter preview images, Web App Manifest), dynamic sitemap indexing, and search engine discoverability. While basic metadata exists in `layout.tsx`, there is no `icon.tsx` / `apple-icon.tsx` route, no dynamic social share image generator (`opengraph-image.tsx`), no `manifest.ts` PWA descriptor, and the dynamic sitemap does not properly index the investor demo experience (`/dashboard` with Sofia's mock portfolio) or enforce strict crawler boundaries for private API/auth routes.

## Why it matters
1. **Brand Identity & Professional Trust**: Investors and institutional partners accessing the platform or bookmarking it on desktop and mobile browsers encounter missing/default favicons and blank social preview cards when links are shared on Twitter/X, LinkedIn, or messaging platforms.
2. **Search Engine Visibility & Organic Discovery**: High-intent search traffic for fractional real estate, commercial property tokenization, and institutional yields cannot index or interpret platform capabilities without structured Schema.org JSON-LD definitions (`FinancialService`, `RealEstateAgent`, `WebSite`) and dynamic sitemaps.
3. **PWA & Mobile Add-to-Home Screen Readiness**: Without a modern `manifest.ts` web app manifest specifying theme colors (`#0A1220`, `#C41230`, `#2F8F6B`), display modes (`standalone`), and app icons, the mobile browser installation experience is degraded.
4. **Controlled Crawl Budget & Privacy**: Search engines must cleanly index public landing pages and the public demo dashboard while strictly ignoring internal authentication handlers (`/callback`, `/auth/*`) and server API endpoints (`/api/*`).

## What outcome is expected
1. **Native Dynamic Favicon & Apple Touch Icons**:
   - `apps/web/src/app/icon.tsx`: Generates a high-contrast 32x32 SVG/PNG icon rendering the official BlueBrick 4-bar angled isometric emblem (-14deg) with crimson accent (`#C41230`) on dark backdrop (`#0A1220`).
   - `apps/web/src/app/apple-icon.tsx`: Generates a 180x180 PNG Apple Touch Icon optimized for iOS home screens and Safari bookmarks.
2. **Dynamic OpenGraph & Twitter Social Cards**:
   - `apps/web/src/app/opengraph-image.tsx` & `apps/web/src/app/twitter-image.tsx`: Produces high-resolution 1200x630 branded preview cards with radial luxury gradients, official typography (`Space Grotesk`), isometric emblem, and localized value propositions.
3. **Web App Manifest (PWA)**:
   - `apps/web/src/app/manifest.ts`: Configures `name`, `short_name`, `theme_color`, `background_color`, `display`, and icon resolutions.
4. **Enhanced Sitemap & Secure Robots.txt**:
   - `apps/web/src/app/sitemap.ts`: Indexes `/` (priority 1.0, weekly change) and `/dashboard` (priority 0.8, daily change, demo mode).
   - `apps/web/src/app/robots.ts`: Rules allowing `/` and `/dashboard` while explicitly disallowing `/api/`, `/callback`, and `/auth/`.
5. **Enriched Schema.org JSON-LD & Page Metadata**:
   - `apps/web/src/lib/pipelines/seo-metadata-pipeline.ts`: Emits comprehensive Schema.org JSON-LD entities (`FinancialService`, `RealEstateAgent`, `WebSite`) and standardized OpenGraph/Twitter payloads.
   - Dedicated page metadata in `apps/web/src/app/dashboard/page.tsx` for the Sofia Martinez demo investment dashboard.

## What gaps exist today
- Missing `apps/web/src/app/icon.tsx` and `apps/web/src/app/apple-icon.tsx`.
- Missing `apps/web/src/app/opengraph-image.tsx` and `apps/web/src/app/twitter-image.tsx`.
- Missing `apps/web/src/app/manifest.ts`.
- `apps/web/src/app/robots.ts` did not explicitly disallow `/auth/`.
- `apps/web/src/app/sitemap.ts` lacked full metadata properties and demo context documentation.
- `apps/web/src/lib/pipelines/seo-metadata-pipeline.ts` lacked multi-entity Schema.org structured data generators for Real Estate + Financial Service composite contracts.

## What questions remain open
- None. Design and architectural decisions were fully resolved via the `/grill-me` socratic phase. The landing page retains its minimalist conversion focus while `/dashboard` is indexed as the demo investor experience.
