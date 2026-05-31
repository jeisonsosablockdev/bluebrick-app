# S24 Plan: Property Detail Content Decomposition

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s24-detail-decomposition`.
- Runtime scope when implemented:
  - `components/marketplace/PropertyDetailContent.tsx`
  - new focused components under `components/marketplace/`
  - shared format helpers where appropriate

## Problem
`components/marketplace/PropertyDetailContent.tsx` is a 317-line client component that owns:
- currency, percent, month, date, and location formatting
- Google Maps public key resolution
- Google Maps URL/embed URL construction
- motion variants
- hero summary
- investment summary
- property information
- Google Maps section
- deal economics
- fees and projected return
- execution and exit
- governance
- documents
- blockchain info

Why this matters:
- Detail-page changes require scanning a large mixed-responsibility component.
- Formatting logic is harder to reuse and test directly.
- Google Maps rendering is coupled to every other detail section.
- The component will keep growing as marketplace detail content grows.

## Solution
Split the component into focused section components and move reusable formatting to helpers.

Suggested target components:
- `PropertyDetailHero`
- `PropertyInvestmentSummary`
- `PropertyInformationCard`
- `PropertyGoogleMapsCard`
- `PropertyEconomicsCard`
- `PropertyFeesCard`
- `PropertyExecutionCard`
- `PropertyGovernanceCard`
- `PropertyDocumentsCard`
- `PropertyBlockchainCard`

Suggested helper extraction:
- currency/percent/month/date formatters into `lib/marketplace-format.ts` or a dedicated detail formatter helper.
- location content builder into a small local helper if it remains detail-specific.
- Google Maps key resolution should stay simple and explicit; do not introduce a broad config layer unless other pages need it.

## TDD Plan
1. Add focused component tests around the Google Maps card and key fallback before extraction.
2. Add formatter tests for any formatter moved out of the component.
3. Extract one card at a time with stable snapshots/queries.
4. Keep the detail page visually and behaviorally unchanged.
5. Run targeted component tests and `npm run validate`.

## Acceptance Criteria
- `PropertyDetailContent.tsx` becomes a composition component rather than owning every section.
- Google Maps embed behavior remains unchanged.
- Formatting output remains unchanged for existing locales.
- Marketplace detail remains a traditional detail page, not a Mapbox 3D state surface.
- `npm run validate` passes.
