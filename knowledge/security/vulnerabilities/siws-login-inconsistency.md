---
type: Vulnerability Report
title: SIWS Login Inconsistency — SignMessage Race / Nonce/Session (BRI-66)
description: Fix for sign-in race condition between Phantom autoConnect and SIWS nonce/session handling
tags: [security, vulnerability, siws, phantom, auth, race-condition, bri-66]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-siws-session-nonce-stateless-bri-66.md
---

# SIWS Login Inconsistency

## Summary
Fixed race condition in SIWS authentication flow where Phantom's `autoConnect` could interfere with nonce/session state during sign-in.

## Vulnerability Details
- **Type**: Race condition / State inconsistency
- **Component**: SIWS authentication (`lib/siws.ts`, wallet modal)
- **Trigger**: Phantom `autoConnect` on page load vs explicit sign-in flow
- **Impact**: Failed sign-in attempts, nonce/session state corruption
- **Severity**: Medium

## Root Cause
Phantom wallet adapter's `autoConnect` feature (enabled for `/admin/assets/new`) would automatically connect the wallet on page load, but the SIWS flow expects explicit user action to:
1. Request nonce via `GET /api/auth/nonce`
2. Sign message with wallet
3. Submit signature via `POST /api/auth/verify`

When `autoConnect` ran before explicit sign-in, it could:
- Set wallet adapter state before nonce request
- Cause nonce/session mismatch on verify
- Leave stale `siws_nonce` cookie

## Fix Applied
**Branch**: `fix-siws-session-nonce-stateless-bri-66`

### Changes
1. **Scoped `autoConnect` to `/admin/assets/new` only** — Public login surfaces no longer auto-connect Phantom
2. **Explicit wallet modal states** — Connected wallet without SIWS shows "pending sign-in" not anonymous chooser
3. **Nonce cookie cleared after verify** — Both success and failure clear `siws_nonce` to force fresh challenge
4. **Cross-tab sync via BroadcastChannel** — Auth state revalidated on `focus`/`visibilitychange`

### Code Changes
- `lib/si `lib/siws.ts`: Nonce store clearing logic
- `components/wallet/wallet-modal.tsx`: Modal state matrix (anonymous/connected/pending/authenticated)
- `lib/wallet-proof-view-model.ts`: Wallet adapter connection vs SIWS session distinction
- `app/providers.tsx`: Wallet runtime moved out of root layout, mounted per-surface

## Verification
- Sign-in flow works from anonymous state
- Phantom `autoConnect` only triggers on `/admin/assets/new`
- Nonce cookie properly cleared after verify attempt
- Cross-tab auth sync works via BroadcastChannel
- No regression in admin mint flow (where `autoConnect` is needed)

## Related
- [Auth Flow](../architecture/auth-flow.md)
- [Session Model](../architecture/session-model.md)
- [Wallet Modal UX Guardrails](../architecture/auth-flow.md#wallet-modal-ux-guardrails)