# S15 Audit: Marketplace Core Web Vitals and SEO

## Scope
- Route: `/marketplace`
- Feature: BRI-164 marketplace map experience
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s15-web-vitals-seo-audit`
- Audit type: technical SEO, on-page SEO, and Core Web Vitals readiness
- Implementation changes: none planned for this slice

## Assumptions
- Site type: tokenized real estate marketplace/public platform.
- Primary goal: support discovery and conversion on marketplace inventory.
- Target route market: USA marketplace entries; site language defaults to the configured app locale.
- Search Console, production field Core Web Vitals, and analytics data are not available in this local audit.
- Score reflects readiness of the audited route, not guaranteed rankings.

## Evidence Commands
- `npm run validate:seo`
- `npm run build`
- `PORT=3100 npm run start`
- `curl -s http://localhost:3100/robots.txt`
- `curl -s http://localhost:3100/sitemap.xml`
- Playwright metadata/resource probe against `http://localhost:3100/marketplace`
- `npx -y lighthouse@12.8.2 http://localhost:3100/marketplace --only-categories=performance,seo --preset=desktop --output=json --output-path=artifacts/lighthouse-marketplace-s15-desktop.json --chrome-flags='--headless=new --no-sandbox' --quiet`
- `npx -y lighthouse@12.8.2 http://localhost:3100/marketplace --only-categories=performance,seo --output=json --output-path=artifacts/lighthouse-marketplace-s15-mobile.json --chrome-flags='--headless=new --no-sandbox' --quiet`

## Executive Summary
- `/marketplace` is crawlable in the production local server, has a canonical URL, a valid meta description, a single H1, and appears in the XML sitemap.
- Lighthouse SEO scored `100` in both desktop and mobile lab runs.
- Core Web Vitals readiness is the main risk: desktop LCP is acceptable in lab (`1.7s`), but mobile lab LCP is poor (`8.0s`) and both desktop/mobile show high Total Blocking Time.
- The deferred camera motion slice protects the animation itself from initial load, but the default map-first state still loads Mapbox resources during the initial marketplace experience.
- No runtime fix is included in this audit slice.

## SEO Health Index
- **Overall Score:** 86 / 100
- **Health Status:** Good

| Category | Score | Weight | Weighted Contribution |
| --- | ---: | ---: | ---: |
| Crawlability & Indexation | 100 | 30 | 30.00 |
| Technical Foundations | 69 | 25 | 17.25 |
| On-Page Optimization | 90 | 20 | 18.00 |
| Content Quality & E-E-A-T | 88 | 15 | 13.20 |
| Authority & Trust Signals | 80 | 10 | 8.00 |

What limits the score:
- Mobile lab LCP and Total Blocking Time are not yet strong enough for a premium marketplace route.
- The default map-first view loads Mapbox resources early.
- Metadata language and visible H1 language are not fully aligned.
- Listing-level structured data is not present on `/marketplace`.
- Authority and field performance data were not available in this local audit.

## Findings
### Finding 1: Mobile lab LCP is above the Core Web Vitals target
- **Category:** Technical Foundations
- **Evidence:** Lighthouse mobile local production run reported LCP `8.0s`; desktop LCP was `1.7s`.
- **Severity:** High
- **Confidence:** High
- **Why It Matters:** LCP above `2.5s` can make the marketplace feel slow on mobile and can hurt page experience signals.
- **Score Impact:** `-10` from Technical Foundations.
- **Recommendation:** Defer non-critical map work further on mobile, inspect the mobile LCP path, and verify production field data once deployed.

### Finding 2: JavaScript execution cost is high
- **Category:** Technical Foundations
- **Evidence:** Lighthouse reported Total Blocking Time `830ms` desktop and `870ms` mobile, `27` scripts, and estimated unused JavaScript savings around `674-675 KiB`.
- **Severity:** High
- **Confidence:** High
- **Why It Matters:** High blocking time increases INP risk and can make map/list interactions feel delayed.
- **Score Impact:** `-10` from Technical Foundations.
- **Recommendation:** Audit route-level client bundles, wallet/modal providers, Mapbox loading boundaries, and dynamic imports for code that does not need to hydrate before interaction.

### Finding 3: Mapbox resources load in the initial map-first experience
- **Category:** Technical Foundations
- **Evidence:** Playwright observed the map shell present on first load and Lighthouse attributed roughly `575-747 KiB` of third-party transfer to Mapbox resources in local production runs.
- **Severity:** Medium
- **Confidence:** High
- **Why It Matters:** The map is the desired premium surface, but early third-party map work competes with initial mobile performance.
- **Score Impact:** `-5` from Technical Foundations.
- **Recommendation:** Consider an additional lazy map hydration boundary or mobile-specific delayed map activation while keeping the list visible immediately.

### Finding 4: Local `next start` returns 404 for Vercel Speed Insights script
- **Category:** Technical Foundations
- **Evidence:** Playwright captured `404` for `/_vercel/speed-insights/script.js` in the local production server.
- **Severity:** Low
- **Confidence:** Medium
- **Why It Matters:** This appears local to `next start`, but it creates noisy error evidence and should be verified in Vercel production.
- **Score Impact:** `-1` from Technical Foundations after confidence adjustment.
- **Recommendation:** Treat as a production verification item rather than a local blocker.

### Finding 5: Marketplace metadata language does not fully match visible page language
- **Category:** On-Page Optimization
- **Evidence:** Playwright captured title `Marketplace | BRIDS` and English meta description while the H1 rendered as `Marketplace de propiedades tokenizadas`.
- **Severity:** Medium
- **Confidence:** High
- **Why It Matters:** Mixed language signals can dilute search intent and snippet consistency, especially if the target market/language is explicit.
- **Score Impact:** `-5` from On-Page Optimization.
- **Recommendation:** Align title, meta description, and visible H1 for the intended locale or add explicit localized metadata strategy.

### Finding 6: `/marketplace` has no JSON-LD structured data
- **Category:** On-Page Optimization
- **Evidence:** Playwright found `0` `application/ld+json` scripts on `/marketplace`.
- **Severity:** Medium
- **Confidence:** High
- **Why It Matters:** Structured data is not mandatory, but marketplace/listing context can be clearer to crawlers with an appropriate schema strategy.
- **Score Impact:** `-5` from On-Page Optimization.
- **Recommendation:** Evaluate `ItemList`, `Offer`, or property-listing schema only after the product/legal schema contract is approved.

### Finding 7: Marketplace page content depth is thin when inventory is small
- **Category:** Content Quality & E-E-A-T
- **Evidence:** Playwright captured approximately `797` visible body-text characters for the audited state.
- **Severity:** Medium
- **Confidence:** Medium
- **Why It Matters:** A sparse marketplace route may rank less reliably for competitive real-estate/tokenization queries, even when technical SEO is valid.
- **Score Impact:** `-5` from Content Quality & E-E-A-T after rounding.
- **Recommendation:** Add concise, useful marketplace context, risk framing, and trust cues without burying the inventory.

### Finding 8: Authority and field data were not available
- **Category:** Authority & Trust Signals
- **Evidence:** No Google Search Console, analytics, backlink, or production field Core Web Vitals data was available in this local audit.
- **Severity:** Low
- **Confidence:** Low
- **Why It Matters:** The audit can validate readiness, but cannot prove organic visibility, rankings, or real-user page experience.
- **Score Impact:** `-5` from Authority & Trust Signals after confidence adjustment.
- **Recommendation:** Re-run the audit with Search Console and production field data after release.

## Prioritized Action Plan
### Critical Blockers
- None found. No crawl/index blocker was observed for production local `/marketplace`.
- Expected score recovery: `0` unless production field data reveals a hidden blocker.

### High-Impact Improvements
- Address Finding 1 and Finding 2 together by reducing initial mobile JavaScript and map work.
- Related findings: 1, 2, 3.
- Expected score recovery: `10-20` points in Technical Foundations.

### Quick Wins
- Align marketplace metadata language with the visible H1.
- Verify Speed Insights behavior in deployed Vercel production.
- Related findings: 4, 5.
- Expected score recovery: `4-6` points across Technical Foundations and On-Page Optimization.

### Longer-Term Opportunities
- Add an approved structured-data strategy for marketplace inventory.
- Add useful above/below-inventory marketplace context that supports trust and search intent.
- Collect Search Console and field Core Web Vitals data after release.
- Related findings: 6, 7, 8.
- Expected score recovery: `8-15` points across On-Page, Content Quality, and Authority signals.

## Explicit Limitations
- No Google Search Console data was available.
- No production field Core Web Vitals data was available.
- Local Lighthouse and browser evidence can identify lab risk, but it does not replace field data.
- Authority score is directional and not exhaustive.
