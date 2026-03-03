# Session Model

## Scope
- Feature: SIWS-backed wallet session for Next.js App Router frontend.
- Roles: `user` and `admin` resolved from wallet allowlist on the server.

## Cookie Strategy
- Cookie type: `httpOnly`, `secure` (production), `sameSite=lax`.
- Expiration:
  - 24 hours (`maxAge` + matching server-side expiry).
- Rotation policy:
  - Session token regenerated on each successful SIWS verification.

## Session Lifecycle
1. Create session:
   - Server creates random token after SIWS verification and nonce checks.
   - Session stored in in-memory map keyed by token.
   - Cookie `siws_session` written with path `/`.
2. Refresh session:
   - Not implemented; user re-authenticates with SIWS.
3. Revoke session:
   - `POST /api/auth/logout` deletes server record and clears cookie.

## Validation Rules
- Authentication:
  - Missing/expired/unknown session token = unauthenticated.
- Role resolution:
  - If authenticated, role is computed from `ADMIN_WALLETS` and wallet pubkey.
  - Role is never trusted from client state.
- Server-side checks per request:
  - `GET /api/auth/me` exposes `{ authenticated, pubkey, role }`.
  - `GET /api/protected/me` requires a valid session and returns `401` otherwise.
  - `/admin/**` middleware redirects unauthorized requests to `/403`.
  - Admin pages and `/api/admin/*` handlers perform explicit role re-checks.

## Authorization Layers
1. Session layer:
   - Cookie `siws_session` maps to server-side in-memory session token.
2. Role layer:
   - Role is derived from `ADMIN_WALLETS` and wallet pubkey.
3. Middleware layer:
   - `/admin/**` blocked early unless role resolves to `admin`.
4. Handler/page layer:
   - `/api/admin/ping` and `app/admin/page.tsx` repeat the role check (defense in depth).

## Security Notes
- CSRF strategy:
  - SameSite `lax` + POST-only mutation endpoints.
- Replay protections:
  - Single-use nonce with 5-minute TTL.
- Persistence caveat:
  - Session store is currently process-local in-memory.
  - App restart invalidates sessions.
  - Shared store (for example Redis) is required before horizontal scaling.

Last Updated: 2026-03-03 17:04:23 UTC
