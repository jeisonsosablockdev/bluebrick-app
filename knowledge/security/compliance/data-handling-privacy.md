---
type: Compliance
title: Data Handling and Privacy
description: GDPR/privacy compliance for BRIDS user data, KYC, analytics, and webhooks
tags: [compliance, gdpr, privacy, data-protection, kyc, analytics, cookies]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/lib/auth.ts
---

# Data Handling and Privacy

## Data Controller
BRIDS platform (operated by Jeisson Sosa / jeissonsosablockdev)

## Legal Basis (GDPR Art. 6)
| Data Category | Legal Basis | Retention |
| --- | --- | --- |
| Wallet address / SIWS session | Contract (Art. 6.1.b) | 24h session + 90d audit |
| Profile data (name, email, country) | Contract + Consent (Art. 6.1.a) | Account lifetime + 30d |
| KYC documents (via Stripe) | Legal obligation (Art. 6.1.c) | Stripe retention (7y) |
| Purchase attempts | Contract (Art. 6.1.b) | 2y |
| Stake actions | Contract (Art. 6.1.b) | 2y |
| Analytics events | Legitimate interest (Art. 6.1.f) | 13m |
| Referral data | Contract + Consent | Account lifetime |

## Data Collected

### Wallet Authentication (SIWS)
- `wallet_public_key` (Ed25519, base58)
- `siws_session` (signed JWT, 24h TTL)
- `siws_nonce` (5-min TTL, in-memory store)
- Referral code (optional, from `?ref=` param)

### User Profile
- `first_name`, `last_name`, `email`, `country`, `bio`, `avatar_url`, `username`
- `compliance_status` (enum: unverified, pending_kyc, verified, restricted_aml, suspended)
- `is_suspended` (boolean)
- `onboarding_reward` status and timestamps

### KYC / Compliance (via Stripe Identity)
- Stripe `session_id`, `report_id`
- KYC status (unverified/pending/verified/rejected)
- AML screening results (clear/flagged)
- Compliance notes (admin only)

### Purchase Data
- `purchase_attempts`: wallet, candy_machine, quantity, signatures, status, asset addresses
- `purchase_challenges`: nonce, message, expiry, consumption status
- `purchase_flow_events`: per-step tracing (quote/challenge/prepare/submit)
- `purchase_rate_limit_events`: IP/wallet rate limit evidence

### Stake Data
- `stake_action_attempts`: wallet, asset, action (stake/unstake), status, signatures
- `stake_profile_events`: validated history for distribution eligibility
- `user_profile_stake_events`: derived for distribution prep

### Analytics
- `analytics_events`: route, action, timestamp, anon ID
- No PII in analytics events
- `x-flow-id` for purchase tracing (pseudonymous)

## Data Subject Rights (GDPR Art. 15-22)

### Access (Art. 15)
- `GET /api/protected/profile` — returns wallet-bound profile + KYC + reward
- `GET /api/protected/referrals/summary` — referral metrics
- Admin: `GET /api/admin/compliance/cases/:walletPublicKey/aml` — AML case

### Rectification (Art. 16)
- `PUT /api/protected/profile` — update name, country, email, bio, avatar
- Email change requires re-verification

### Erasure (Art. 17) — "Right to be Forgotten"
**Not fully automated** — requires admin action:
1. User requests via support
2. Admin runs manual cleanup:
   - Anonymize `user_profiles` (retain wallet hash for referential integrity)
   - Delete `purchase_attempts`, `stake_action_attempts` (or anonymize)
   - Revoke `siws_session`, `workos_session`
   - Stripe: request data deletion via Stripe Dashboard

### Restriction (Art. 18)
- `is_suspended` flag blocks purchase/stake actions
- `compliance_status = suspended` blocks financial actions

### Portability (Art. 20)
- No automated export endpoint yet — profile data export not implemented

### Objection (Art. 21)
- Analytics: `NEXT_PUBLIC_DISABLE_ANALYTICS=true` disables collection
- Referral: Don't share referral link

## Cookie Policy

| Cookie | Purpose | Type | TTL | Scope |
| --- | --- | --- | --- | --- |
| `siws_session` | Wallet auth | HttpOnly, Secure, SameSite=Lax | 24h | `/` |
| `siws_nonce` | Replay protection | HttpOnly, Secure, SameSite=Lax | 5 min | `/` |
| `workos_session` | Federated auth | HttpOnly, Secure (AuthKit) | AuthKit default | `/` |
| `brids-ui-theme` | Theme preference | LocalStorage | Persistent | Client |
| `brids_referral_hint` | Referral capture | LocalStorage | Until auth | Client |

## International Transfers
- **Vercel** (US) — hosting, edge functions, blob storage
- **Stripe** (US) — KYC Identity, webhooks
- **Helius** (US) — Solana RPC, DAS, webhooks
- **Mapbox** (US) — map tiles, geocoding
- **Google Maps** (US) — place autocomplete, embed
- **Pinata** (US) — IPFS pinning (metadata)
- **Supabase/Neon** (US/EU) — PostgreSQL (region configurable)

Standard Contractual Clauses (SCCs) in vendor DPAs.

## Data Minimization Practices
- No cardholder data (crypto payments on-chain)
- Analytics: pseudonymous, no PII
- Referral code: optional, not required
- KYC: only via Stripe, BRIDS stores only metadata
- Purchase: only wallet + transaction data
- Stake: only wallet + asset + action

## Security Measures
- TLS 1.2+ everywhere
- SIWS nonce replay protection (5-min, single-use)
- Purchase challenge consumption (single-use)
- Idempotency keys (UUIDv7, 5-min TTL)
- Purchase submit row lock (`FOR UPDATE`)
- Webhook HMAC validation (Stripe, Airwallex, Helius)
- Parameterized SQL queries
- CSP, COOP, CORP, frame-ancestors headers

## Breach Notification
- 72-hour notification to supervisory authority (GDPR Art. 33)
- Affected users notified without undue delay (Art. 34)
- Internal runbook: `SECURITY_BREACH.md` (internal)

## Children's Data
- No knowingly collected data from children < 16
- Age not collected in profile

## Automated Decision Making
- None — all financial actions require explicit wallet signature
- Compliance gates block actions but don't auto-execute

## Related
- [Auth Flow](../architecture/auth-flow.md)
- [Session Model](../architecture/session-model.md)
- [User Profile Model](../database/models/user-profile.md)
- [Purchase Attempt Model](../database/models/purchase-attempt.md)