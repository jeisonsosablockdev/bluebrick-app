# Fix Next Proxy Convention (BRI-144)

## Scope
- Replace the deprecated root `middleware.ts` convention with Next.js 16 `proxy.ts`.
- Preserve the existing `/admin/:path*` admin gate behavior without changing RBAC semantics.

## What Changed
- Moved the root request gate entrypoint from `middleware.ts` to `proxy.ts`.
- Renamed the exported function to `proxy`, following the current Next.js file convention.
- Extracted the auth gate into `lib/auth-admin-proxy.ts` so the behavior stays testable without relying on the root file convention.

## Behavioral Parity
- `/admin/**` still calls `/api/auth/me` with the request cookie.
- Unauthenticated users still redirect to `/403`.
- Authenticated non-admin users still redirect to `/403`.
- Authenticated admins still pass through to the route handler/page.

## Verification
- Added focused unit coverage for the proxy gate helper.
- `npm run validate`
