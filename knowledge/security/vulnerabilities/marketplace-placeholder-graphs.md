---
type: Vulnerability Report
title: Marketplace Release Placeholder Graphs (BRI-153)
description: Fixed development-only marketplace analytics placeholder charts being visible in production
tags: [security, vulnerability, marketplace, placeholder, release, visibility, bri-153]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-app-marketplace-release-placeholder-graphs-bri-153.md
---

# Marketplace Release Placeholder Graphs

## Summary
Fixed development-only marketplace analytics placeholder charts that were incorrectly visible in production/RC environments.

## Vulnerability Details
- **Type**: Information exposure / Development artifact in production
- **Component**: Marketplace detail page analytics charts
- **Impact**: Placeholder/dev charts exposed real data patterns in production
- **Severity**: Low (information exposure)

## Root Cause
Marketplace detail page included placeholder analytics charts (charts showing fake/sample data) that were only meant for development. These were not properly guarded by the release visibility flag.

## Fix Applied
**Branch**: `fix-app-marketplace-release-placeholder-graphs-bri-153`

### Changes
1. **Wrapped placeholder charts in dev-only guard**:
   ```tsx
   {process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES === 'true' && (
     <PlaceholderAnalyticsCharts />
   )}
   ```
2. **Charts hidden by default in production/RC**
3. **Re-enabled only with explicit flag**: `NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES=true`

### Code Changes
- `components/marketplace/MarketplaceDetailAnalytics.tsx`: Wrapped in dev-only condition
- `app/marketplace/[id]/page.tsx`: Conditional render

## Verification
- Placeholder charts hidden in production/RC
- Charts visible in local development (default)
- Charts visible in non-release with `NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES=true`
- Real marketplace data unaffected

## Related
- [Release Visibility Guard](../architecture/auth-flow.md#bri-152-release-visibility-guard)
- [Marketplace Detail Media Carousel](../features/feature-app-marketplace-detail-media-carousel-bri-164.md)