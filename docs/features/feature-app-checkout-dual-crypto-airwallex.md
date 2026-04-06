# Feature: Checkout Dual Crypto + Airwallex (BRI-42)

## Summary
- Added first version of checkout flow under `/checkout`.
- Introduced dual payment start path:
  - `crypto` keeps current purchase flow behavior as existing path.
  - `airwallex` creates PaymentIntent and redirects via Airwallex Components SDK.

## Backend Scope
- New checkout APIs:
  - `GET|POST|PATCH|DELETE /api/checkout/cart`
  - `POST /api/checkout/order`
  - `GET /api/checkout/order/:orderId`
  - `POST /api/checkout/payment/start`
- New Airwallex webhook:
  - `POST /api/webhooks/airwallex`
  - validates `x-timestamp` and `x-signature` with `AIRWALLEX_WEBHOOK_SECRET`
  - idempotent by provider event id

## Data Model
- Added migration `018_checkout_dual_payment.sql`:
  - `carts`, `cart_items`, `orders`, `order_items`, `payment_attempts`, `payment_events`
  - enums for `order_status`, `checkout_payment_method`, `payment_attempt_status`
  - partial unique index for one active cart per wallet

## Frontend Scope
- New pages/components:
  - `/checkout`
  - `/checkout/success`
  - `components/checkout/CheckoutPageClient.tsx`
- Added "Add to cart" action in `PurchaseCta` to route users into checkout.

## Environment Variables
- `AIRWALLEX_CLIENT_ID`
- `AIRWALLEX_API_KEY`
- `AIRWALLEX_ENV` (`demo|prod`)
- `AIRWALLEX_WEBHOOK_SECRET`
- `CHECKOUT_SUCCESS_URL` (optional override)

## Risks / Follow-up
- Crypto path is still bridged to existing purchase flow and requires integration completion for full parity.
- Webhook-driven transitions depend on correct Airwallex webhook setup in environment.

## Temporary Sandbox Runtime Toggle (must harden before production)
- UI includes a temporary test toggle in checkout to send `runtimeMode: sandbox|live`.
- API accepts `runtimeMode` and blocks sandbox in `NODE_ENV=production`.

Hardening removal checklist (`HARDENING-PREPROD`):
1. Remove sandbox toggle in:
   - `components/checkout/CheckoutPageClient.tsx`
2. Remove payload override support from:
   - `app/api/checkout/payment/start/route.ts`
3. Force live mode only in checkout payment start path:
   - `lib/checkout-service.ts` / `lib/airwallex-client.ts`
4. Keep production guard that rejects sandbox calls.
