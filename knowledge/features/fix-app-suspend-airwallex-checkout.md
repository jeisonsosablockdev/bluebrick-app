# Fix: Suspend Airwallex Checkout

## Summary
- Suspended card checkout without removing checkout schema or provider infrastructure.
- Hid the `Buy with card` positioning from the marketplace UI by turning that CTA into a neutral cart/checkout entrypoint.
- Locked backend order creation and payment start so `paymentMethod = airwallex` now returns `PAYMENT_METHOD_DISABLED`.
- Kept migrations, retained webhook route, and underlying provider code intact for future reactivation.

## Scope
- `components/marketplace/PurchaseCta.tsx`
- `components/checkout/CheckoutPageClient.tsx`
- `app/api/checkout/order/route.ts`
- `app/api/checkout/payment/start/route.ts`
- `lib/checkout-payment-methods.ts`
- `lib/checkout-service.ts`
- `knowledge/auth-flow.md`
- `knowledge/session-model.md`

## Behavior
- Marketplace now exposes:
  - `Buy with crypto`
  - `Add to cart`
- Checkout now presents crypto as the only active payment method.
- Direct backend requests using `airwallex` are rejected with:
  - code: `PAYMENT_METHOD_DISABLED`
  - status: `403`

## Intent
- Pause credit card / Airwallex usage safely without deleting the checkout domain or creating drift between UI and API.
