---
type: Vulnerability Report
title: Stake/Unstake Release Visibility (BRI-170)
description: Fixed stake/unstake being incorrectly hidden in release environments while other dev-only modules were hidden
tags: [security, vulnerability, stake, unstake, release, visibility, bri-170]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-stake-unstake-release-visibility.md
---

# Stake/Unstake Release Visibility

## Summary
Fixed incorrect release visibility guard that was hiding `/protected/stake` in production/RC environments while it should remain visible as a release-visible product route.

## Vulnerability Details
- **Type**: Incorrect access control / Release visibility misconfiguration
- **Component**: Release visibility guard (`NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES`)
- **Impact**: Stake/Unstake feature hidden in production, breaking user access to core product functionality
- **Severity**: High (product availability)

## Root Cause
The release visibility guard (`BRI-152`) incorrectly included `/protected/stake` in the list of development-only routes to hide:
```typescript
// Incorrect - stake was in dev-only list
const devOnlyRoutes = [
  '/protected/portfolio',
  '/protected/rentas',
  '/protected/historial',
  '/protected/stake',  // ← WRONG: stake is a release feature
  '/admin/mint',
  '/admin/treasury',
  '/admin/distributions',
  '/admin/settings',
];
```

Stake/Unstake is a core product feature (BRI-5) that executes real owner-driven `freeze/unfreeze` actions on devnet, not a development-only module.

## Fix Applied
**Branch**: `fix-stake-unstake-release-visibility`

### Changes
1. **Removed `/protected/stake` from dev-only routes list**
2. **Updated release visibility guard** — stake route now respects normal auth flow (SIWS required)
3. **Added explicit comment** — stake is release-visible, guarded by wallet/session ownership checks

### Code Changes
- `lib/release-visibility.ts`: Updated route list
- `app/protected/stake/page.tsx`: Normal auth flow (no dev-only guard)
- `components/navigation/protected-nav.tsx`: Stake link always visible when authenticated

## Verification
- `/protected/stake` accessible in production/RC environments
- SIWS wallet session still required (no auth bypass)
- Stake/Unstake executes real devnet transactions
- No regression in dev environment (still works with `NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES=true`)

## Related
- [Stake Distribution API](../api/endpoints/stake-distribution.md)
- [Release Visibility Guard](../architecture/auth-flow.md#bri-152-release-visibility-guard)
- [Stake Action Model](../database/models/stake-action.md)