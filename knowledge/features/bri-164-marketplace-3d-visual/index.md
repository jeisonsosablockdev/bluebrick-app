---
type: Feature Index
title: BRI-164 Marketplace 3D Visual
description: All slices for the marketplace 3D visual feature — map surface, detail cards, camera controls, performance, security audit
tags: [feature, bri-164, marketplace, 3d, mapbox, motion]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/knowledge/features/bri-164-marketplace-3d-visual
---

# BRI-164 Marketplace 3D Visual

Complete feature slices for the interactive 3D marketplace visualization using Mapbox GL JS and Motion 12.

## Slices

### Core Feature
* [Feature Overview](feature-app-create-a-marketplace-3d-visual-bri-164.md) — Main feature specification

### Implementation Slices (S01-S14 in separate branches)
* [S15: Web Vitals SEO Audit](feature-app-create-a-marketplace-3d-visual-bri-164-s15-web-vitals-seo-audit.md)
* [S16: Clean Code Refactor Audit](feature-app-create-a-marketplace-3d-visual-bri-164-s16-clean-code-refactor-audit.md)
* [S21: P2 Debt Inventory](feature-app-create-a-marketplace-3d-visual-bri-164-s21-p2-debt-inventory.md)
* [S22: Admin Safe Create Errors](feature-app-create-a-marketplace-3d-visual-bri-164-s22-admin-safe-create-errors.md)
* [S23: Read Result Contract](feature-app-create-a-marketplace-3d-visual-bri-164-s23-read-result-contract.md)
* [S24: Page Degraded State](feature-app-create-a-marketplace-3d-visual-bri-164-s24-page-degraded-state.md)
* [S25: Read Failure Logging](feature-app-create-a-marketplace-3d-visual-bri-164-s25-read-failure-logging.md)
* [S26: Row Mapper Extraction](feature-app-create-a-marketplace-3d-visual-bri-164-s26-row-mapper-extraction.md)
* [S27: Read Repository Extraction](feature-app-create-a-marketplace-3d-visual-bri-164-s27-read-repository-extraction.md)
* [S28: Write Repository Extraction](feature-app-create-a-marketplace-3d-visual-bri-164-s28-write-repository-extraction.md)
* [S29: Selector Extraction](feature-app-create-a-marketplace-3d-visual-bri-164-s29-selector-extraction.md)
* [S30: Sync Status Extraction](feature-app-create-a-marketplace-3d-visual-bri-164-s30-sync-status-extraction.md)
* [S31: Server Facade Cleanup](feature-app-create-a-marketplace-3d-visual-bri-164-s31-server-facade-cleanup.md)
* [S32: Detail Formatters Extraction](feature-app-create-a-marketplace-3d-visual-bri-164-s32-detail-formatters-extraction.md)

### Detail Components
* [S33: Detail Google Maps Card](feature-app-create-a-marketplace-3d-visual-bri-164-s33-detail-google-maps-card.md)
* [S34: Detail Hero Section](feature-app-create-a-marketplace-3d-visual-bri-164-s34-detail-hero-section.md)
* [S35: Detail Investment Summary](feature-app-create-a-marketplace-3d-visual-bri-164-s35-detail-investment-summary.md)
* [S36: Detail Property Info](feature-app-create-a-marketplace-3d-visual-bri-164-s36-detail-property-info.md)
* [S37: Detail Deal Economics](feature-app-create-a-marketplace-3d-visual-bri-164-s37-detail-deal-economics.md)
* [S38: Detail Fees Return](feature-app-create-a-marketplace-3d-visual-bri-164-s38-detail-fees-return.md)
* [S39: Detail Execution Governance](feature-app-create-a-marketplace-3d-visual-bri-164-s39-detail-execution-governance.md)
* [S40: Detail Documents Blockchain](feature-app-create-a-marketplace-3d-visual-bri-164-s40-detail-documents-blockchain.md)

### Validation & Hardening
* [S41: Coordinate Range Validation](feature-app-create-a-marketplace-3d-visual-bri-164-s41-coordinate-range-validation.md)
* [S42: Mapbox Lazy Boundary](feature-app-create-a-marketplace-3d-visual-bri-164-s42-mapbox-lazy-boundary.md)
* [S43: Web Vitals Recheck](feature-app-create-a-marketplace-3d-visual-bri-164-s43-web-vitals-recheck.md)
* [S44: Security Audit Plan](feature-app-create-a-marketplace-3d-visual-bri-164-s44-security-audit-plan.md)

## Implementation Branches
Each slice implemented in dedicated branch:
```
feature/app-create-a-marketplace-3d-visual-bri-164-sNN-<slice-slug>
```

## Tech Stack
- Mapbox GL JS v3 for 3D map rendering
- Motion 12 for animations/transitions
- Next.js App Router with server components
- Responsive: 320px–1024px+ breakpoints