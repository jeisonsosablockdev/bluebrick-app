---
type: ADR
title: Auth Flow — Hybrid WorkOS + SIWS
description: Comprehensive authentication architecture for BRIDS — WorkOS AuthKit account entry, Phantom SIWS wallet auth, hybrid composition, trust boundaries, replay protection, and endpoint map
tags: [architecture, auth, workos, siws, phantom, hybrid, rbac, security, trust-boundaries]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/auth-flow.md
---

# Auth Flow (Hybrid WorkOS + SIWS)

## Overview
BRIDS implements a **hybrid authentication model** combining:
- **WorkOS AuthKit** — low-authority account entry (email/social login)
- **Phantom SIWS** — strong identity layer (wallet signature verification)
- **Server-side composition** — hybrid context when both layers exist

No new auth cookies, tokens, roles, or trust boundaries are introduced by feature slices; all slices reuse the existing authority model.

## Key Boundaries

| Boundary | Auth Required | Role | Notes |
| --- | --- | --- | --- |
| `/protected` | WorkOS **or** SIWS | `user` / `admin` | Account or wallet session |
| `/protected/stake`, `/protected/referrals` | SIWS only | `user` | Wallet-bound actions |
| `/admin/**` | SIWS + `ADMIN_WALLETS` | `admin` | Wallet-first, allowlisted |
| `/api/auth/*` | None | None | Public auth endpoints |

## Trust Boundaries

### Client Responsibilities
- Request nonce, sign SIWS message, submit signature
- Request purchase challenge, sign canonical message
- Edit profile fields (ownership/validation server-enforced)
- Trigger Stripe KYC via server-issued session URL

### Server Responsibilities
- Signature verification, nonce replay protection, session issuance
- Role calculation, authorization, idempotent orchestration
- Stripe Identity session creation, webhook validation
- AML screening on KYC kickoff and verified webhooks
- Purchase flow: quote cache, challenge issuance, rate-limiting, on-chain revalidation
- Checkout: wallet-bound cart/order/payment, reward discount from persisted state only

### External Webhook Responsibilities
- Helius: pushes signature lifecycle events (validated via optional secret + dedupe)
- Stripe: KYC webhooks (HMAC verified, idempotent by provider event ID)

## Replay Protection
- SIWS nonce TTL: 5 minutes, bound to signed cookie, cleared after verify attempt
- Purchase challenge TTL: 120s (configurable), single-use, transitions to `consumed`
- Stripe KYC rate limit: wallet/IP window
- Purchase submit idempotency: UUIDv7 `idempotencyKey` (5 min TTL), dedupe by `(wallet_public_key, idempotency_key)`
- Webhook dedupe: exactly one ingestion per `(provider, eventId)` or `(provider, eventFingerprint)`

## Endpoint Map (Key Routes)

| Endpoint | Method | Auth | Role | Purpose |
| --- | --- | --- | --- | --- |
| `/sign-in` | GET | No | None | Start WorkOS AuthKit |
| `/callback` | GET | No | None | Complete WorkOS, create/resume BRIDS account |
| `/api/auth/nonce` | GET | No | None | Issue SIWS nonce + signed cookie |
| `/api/auth/verify` | POST | No | None | Verify SIWS, set `siws_session` |
| `/api/auth/me` | GET | Optional | None | Hybrid auth introspection |
| `/api/auth/logout` | POST | Optional | None | Revoke SIWS session |
| `/api/protected/profile` | GET/PUT | Yes | `user`/`admin` | Wallet-bound profile + KYC + reward |
| `/api/protected/kyc/stripe/session` | POST | Yes | `user`/`admin` | Create Stripe Identity session |
| `/api/purchase/quote` | POST | No | None | Cached Candy Guard quote |
| `/api/purchase/challenge` | POST | Yes | `user`/`admin` | Issue purchase challenge |
| `/api/purchase/prepare` | POST | Yes | `user`/`admin` | Verify challenge, revalidate guard, return tx + idempotencyKey |
| `/api/purchase/submit` | POST | Yes | `user`/`admin` | Lock attempt, validate tx, persist `submitted` |
| `/api/admin/mint-orchestrator/jobs` | POST/GET | Yes | `admin` | Create/list mint jobs |
| `/api/admin/collections/:id` | GET/PATCH | Yes | `admin` | Collection detail with ownership verification |
| `/api/webhooks/helius/*` | POST | No | None | Helius event ingestion (deduped) |
| `/api/webhooks/stripe/identity` | POST | No | None | Stripe KYC webhook (HMAC verified) |

## Hybrid Composition Rules
1. WorkOS sign-in → creates/resumes BRIDS `account_id` (no wallet permissions)
2. SIWS verification → creates `siws_session` with `pubkey` + `role` (admin if in `ADMIN_WALLETS`)
3. When both exist → hybrid context (`workos_session + siws_session`)
4. Conflicting accounts (different `account_id`) → **fail closed** on introspection
5. `/admin/**` always requires SIWS + allowlisted wallet

## Devnet-First Enforcement
- All wallet-bound actions execute on Solana devnet
- Real signatures required (no mocks)
- On-chain state verified via RPC/DAS before persistence
- Devnet transaction proof mandatory for blockchain changes

---

See also: [`purchase-tracing.md`](purchase-tracing.md) for reusable tracing playbook.