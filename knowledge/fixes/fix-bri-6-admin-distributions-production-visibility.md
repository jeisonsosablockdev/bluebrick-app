# BRI-6 - Admin distributions production visibility fix

## Problem

`/admin/distributions` is implemented and protected by admin RBAC, but it was also classified as a dev-only release-controlled module. In production this made the BRI-6 distribution console return `404` and removed the navigation entry unless `NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES=true`.

## Decision

Make `/admin/distributions` production-visible while preserving the existing admin session and wallet-role authorization enforced by the API routes and admin shell.

## Scope

- Remove `/admin/distributions` from release-controlled route hiding.
- Show the Distribution navigation item in production-like builds.
- Keep `/admin/mint`, `/admin/treasury`, `/admin/settings`, and protected investor modules behind the existing dev-only gate.

## Acceptance

- `/admin/distributions` is visible in production-like builds.
- The admin navigation includes Distribution in production-like builds.
- Existing BRI-6 API authorization remains unchanged.
- Focused release-visibility and BRI-6 tests pass.
