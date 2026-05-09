# BRI-152 — Hide development-only modules in RC and release

## Summary
- Hide selected protected and admin modules in RC and release while keeping them available for internal development work.
- Remove those modules from visible navigation in release-like environments.
- Return `404` on direct access to the hidden routes.
- Keep an explicit environment flag for internal reactivation when needed outside local development.

## Environment Policy
- Local development: modules remain visible by default.
- RC and release: modules are hidden by default.
- Explicit reactivation flag: `NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES=true`

## Protected Routes Hidden In RC/Release
- `/protected/portfolio`
- `/protected/stake`
- `/protected/rentas`
- `/protected/historial`

## Admin Routes Hidden In RC/Release
- `/admin/mint`
- `/admin/treasury`
- `/admin/distributions`
- `/admin/settings`

## Acceptance Checklist
- Hidden protected modules do not appear in protected navigation in RC/release.
- Hidden admin modules do not appear in admin navigation in RC/release.
- Direct access to hidden protected routes returns `404` in RC/release.
- Direct access to hidden admin routes returns `404` in RC/release.
- Internal cross-links do not surface hidden routes in RC/release.
- Develop/local workflows keep access to the hidden modules for internal usage.
- Desktop and mobile navigation remain stable after the removals.

## Scope
- `app/protected/portfolio/page.tsx`
- `app/protected/stake/page.tsx`
- `app/protected/rentas/page.tsx`
- `app/protected/historial/page.tsx`
- `app/admin/mint/page.tsx`
- `app/admin/treasury/page.tsx`
- `app/admin/distributions/page.tsx`
- `app/admin/settings/page.tsx`
- `components/dashboard/protected-shell.tsx`
- `components/admin/admin-shell-navigation.tsx`
- `components/dashboard/portfolio-module.tsx`
- `components/admin/admin-collections-state-panels.tsx`
- `components/admin/treasury-console.tsx`
- `components/admin/distributions-console.tsx`
