---
type: Compliance
title: PCI Compliance Notes
description: Payment Card Industry Data Security Standard compliance notes for BRIDS payment flows
tags: [compliance, pci, payment, stripe, airwallex, crypto, checkout]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/app/api/checkout
---

# PCI Compliance Notes

## Scope
BRIDS handles payment processing through:
- **Crypto payments** (primary): USDC on Solana devnet via Candy Guard `tokenPayment`
- **Airwallex** (suspended): Card payments via Airwallex PaymentIntents
- **Stripe Identity**: KYC verification (not payment processing)

## Current Status: SAQ A-EP (Partial)

Since crypto payments are processed on-chain (buyer signs transaction, backend co-signs as third-party signer), BRIDS **never handles raw cardholder data**. This significantly reduces PCI scope.

### What BRIDS Does NOT Handle
- ❌ Card numbers (PAN)
- ❌ CVV/CVC
- ❌ Expiration dates
- ❌ Track data
- ❌ PIN/password

### What BRIDS Does Handle (Indirect)
- ✅ Payment intent creation (Airwallex server-to-server)
- ✅ Webhook signature validation (Airwallex, Stripe)
- ✅ Order/payment status reconciliation
- ✅ Onboarding reward discount application

## Crypto Payments (Primary)
- **Method**: USDC on Solana devnet
- **Flow**: Candy Guard `tokenPayment` → buyer signs → backend co-signs as `thirdPartySigner`
- **PCI Impact**: Zero cardholder data touches BRIDS infrastructure
- **Validation**: On-chain guard revalidation in `/api/purchase/prepare`

## Airwallex (Suspended)
- **Method**: Server-to-server PaymentIntents
- **Flow**: Backend creates PaymentIntent → frontend receives `clientSecret` → Airwallex hosted fields → webhook reconciliation
- **PCI Impact**: BRIDS never sees card data; Airwallex is PCI Level 1
- **Status**: `PAYMENT_METHOD_DISABLED` returned for card checkout

## Stripe Identity (KYC Only)
- **Purpose**: Identity verification for compliance
- **Data**: BRIDS stores only `session_id`, `report_id`, status
- **PCI Impact**: No payment data processed

## Compliance Controls Implemented

### Network Security
- All API communication over TLS 1.2+
- HSTS, CSP, HSTS headers configured
- No mixed content

### Access Control
- Admin routes: SIWS + `ADMIN_WALLETS` allowlist
- Purchase APIs: SIWS wallet session required
- Webhooks: HMAC signature validation (Airwallex, Stripe)
- Internal routes: `COMPLIANCE_INTERNAL_TOKEN` or admin SIWS

### Data Protection
- No cardholder data stored
- Secrets in Vercel Encrypted Environment Variables
- Database: Parameterized queries, no raw SQL
- Secrets rotation documented

### Monitoring
- Webhook signature validation failures logged
- Failed payment attempts tracked in `purchase_attempts`
- Health checks for payment endpoints

## Gaps / Future Work
| Gap | Mitigation |
| --- | --- |
| No formal PCI SAQ completed | Document scope reduction via crypto-only |
| Airwallex webhook secret rotation | Add rotation schedule |
| Formal incident response for payment | Document in runbooks |
| Third-party vendor review | Annual review of Airwallex/Stripe compliance |

## Related
- [Payment Integration](../api/endpoints/payment.md)
- [Checkout Flow](../architecture/auth-flow.md#bri-42-checkout-dual-crypto-airwallex-session-notes)
- [Webhooks](../api/endpoints/webhooks.md)