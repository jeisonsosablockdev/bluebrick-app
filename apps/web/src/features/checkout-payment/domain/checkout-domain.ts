export type CheckoutPaymentMethod = "crypto" | "airwallex";

export type OrderStatus = "draft" | "pending_payment" | "paid" | "failed" | "expired" | "canceled";
export type PaymentAttemptStatus = "initiated" | "requires_action" | "succeeded" | "failed";

export type TransitionResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string };

const allowedOrderTransitions: Record<OrderStatus, OrderStatus[]> = {
  draft: ["pending_payment", "canceled"],
  pending_payment: ["paid", "failed", "expired", "canceled"],
  paid: [],
  failed: ["pending_payment", "canceled"],
  expired: ["pending_payment", "canceled"],
  canceled: []
};

const allowedPaymentAttemptTransitions: Record<PaymentAttemptStatus, PaymentAttemptStatus[]> = {
  initiated: ["requires_action", "succeeded", "failed"],
  requires_action: ["succeeded", "failed"],
  succeeded: [],
  failed: []
};

export function canTransitionOrder(current: OrderStatus, next: OrderStatus): boolean {
  return allowedOrderTransitions[current]?.includes(next) ?? false;
}

export function transitionOrder(current: OrderStatus, next: OrderStatus): TransitionResult<OrderStatus> {
  if (current === next) {
    return { ok: true, value: current };
  }

  if (!canTransitionOrder(current, next)) {
    return {
      ok: false,
      reason: `Invalid order transition: ${current} -> ${next}`
    };
  }

  return { ok: true, value: next };
}

export function canTransitionPaymentAttempt(current: PaymentAttemptStatus, next: PaymentAttemptStatus): boolean {
  return allowedPaymentAttemptTransitions[current]?.includes(next) ?? false;
}

export function transitionPaymentAttempt(
  current: PaymentAttemptStatus,
  next: PaymentAttemptStatus
): TransitionResult<PaymentAttemptStatus> {
  if (current === next) {
    return { ok: true, value: current };
  }

  if (!canTransitionPaymentAttempt(current, next)) {
    return {
      ok: false,
      reason: `Invalid payment attempt transition: ${current} -> ${next}`
    };
  }

  return { ok: true, value: next };
}

export function ensurePositiveQuantity(quantity: number): number {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be a positive integer.");
  }

  return quantity;
}

export function ensureNonNegativeAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Amount must be a non-negative number.");
  }

  return Math.round(amount * 100) / 100;
}
