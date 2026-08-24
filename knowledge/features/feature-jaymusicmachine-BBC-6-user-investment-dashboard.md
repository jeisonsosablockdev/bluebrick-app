# Problem Spec: BlueBrick Investor Platform (Landing Entrypoint + Neon Postgres + Dashboard UI + WorkOS + SEO)

## What problem exists
BlueBrick requires a cohesive, visually stunning investor platform starting with an entrypoint landing page and mock login flow, backed by a relational database in Neon PostgreSQL containing seeded investor portfolio records, a complete dark-luxury investment dashboard in Next.js 16 (App Router) and React 19, WorkOS authentication integration, and comprehensive SEO/SEM optimizations.

## Why it matters
Stakeholders and investors need an intuitive entrypoint (`/`) that demonstrates the investor login journey and immediately directs users into the active dashboard (`/dashboard`). The dashboard metrics ($163,000 USD invested, 13.7% weighted ROI, property allocations, and reinvestment opportunities) must be served dynamically from Neon PostgreSQL rather than static hardcoded arrays, providing a true database-driven experience that is ready for production.

## What outcome is expected
1. **Landing Page & Mock Login Entrypoint (`/`)**:
   - Clean, branded entrance view showcasing BlueBrick branding and a prominent "Iniciar Sesión como Inversionista" mock button that transitions seamlessly into `/dashboard`.
2. **Database Persistence & Seed Fixtures (Neon PostgreSQL)**:
   - Schema migrations for `users`, `properties`, `user_investments`, and `reinvestment_opportunities`.
   - Seed migration populating the exact investor portfolio data (Sofía Martínez, 5 properties, 3 reinvestment options) into Neon Postgres.
   - Database repository layer with serverless connection pooling.
3. **Complete Investor Dashboard UI (`/dashboard`)**:
   - 100% faithful visual implementation of the luxury dark theme design (`#0A1220`, `#111B2E`, `#2F8F6B`, `#C41230`, `#EDF1F5`).
   - Server Component data hydration directly from Neon PostgreSQL database records.
   - Animated count-up totals, interactive Recharts distribution donut, investment card carousel, detailed portfolio table, and reinvestment banner.
4. **Vercel Blob & WorkOS AuthKit Foundation**:
   - User avatar upload pipeline using `@vercel/blob`.
   - WorkOS AuthKit middleware and session handler.
5. **SEO / SEM & Performance Optimization**:
   - Dynamic `sitemap.ts`, `robots.ts`, OpenGraph / Twitter metadata, and Schema.org JSON-LD structured data.

## What gaps exist today
- Entrypoint landing page currently shows a generic starter instead of the branded mock login experience.
- Database migrations and seed fixtures in Neon PostgreSQL are not yet created.
- Investor dashboard components are not yet created or connected to database repositories.

## What questions remain open
- On-chain Solana wallet and web3 smart contract connections are confirmed **out of scope** for this milestone.



