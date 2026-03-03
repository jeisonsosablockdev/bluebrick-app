# Session Model

## Scope
- Feature: SIWS-backed wallet session for Next.js App Router frontend.

## Cookie Strategy
- Cookie type: httpOnly [x] secure [x in production] sameSite [lax]
- Expiration:
  - 24 hours (`maxAge` cookie + matching server-side session expiry).
- Rotation policy:
  - Session token regenerated on each successful SIWS verify call.

## Session Lifecycle
1. Create session:
   - Server creates random token after signature and nonce checks pass.
   - Session stored in in-memory map keyed by token.
   - Cookie `siws_session` written with path `/`.
2. Refresh session:
   - Not implemented yet; user re-authenticates with SIWS to rotate session.
3. Revoke session:
   - `POST /api/auth/logout` deletes server record and clears cookie.

## Validation Rules
- Session binding (wallet/user/device):
  - Session token binds to verified Solana public key only.
- Server-side checks per request:
  - Server component reads cookie and resolves token from session store.
  - Expired/missing tokens are treated as unauthenticated.
- Failure behavior:
  - Core UI remains visible.
  - Wallet modal and top-right indicator surface signed-in/signed-out state.
  - Protected actions (when added) must enforce server-validated SIWS session.

## Security Notes
- CSRF strategy:
  - SameSite `lax` cookie + POST-only logout/verify endpoints.
- Replay protections:
  - Nonce is single-use and time-bounded (5 minutes), consumed on successful verification.
- Audit logging:
  - Not implemented in this phase.

Last Updated: 2026-03-03 08:55:00 UTC
