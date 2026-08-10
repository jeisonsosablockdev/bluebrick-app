import type { CheckoutPaymentMethod } from "@/lib/checkout-domain";

export const AIRWALLEX_CHECKOUT_ENABLED = false;

export function isCheckoutPaymentMethodEnabled(method: CheckoutPaymentMethod): boolean {
  if (method === "airwallex") {
    return AIRWALLEX_CHECKOUT_ENABLED;
  }

  return true;
}

export function getCheckoutPaymentMethodDisabledError(method: CheckoutPaymentMethod): {
  code: string;
  message: string;
  status: number;
} | null {
  if (isCheckoutPaymentMethodEnabled(method)) {
    return null;
  }

  if (method === "airwallex") {
    return {
      code: "PAYMENT_METHOD_DISABLED",
      message: "Card payments are temporarily unavailable.",
      status: 403
    };
  }

  return null;
}
