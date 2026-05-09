import "server-only";

import {
  createAirwallexPaymentIntent,
  type AirwallexRuntimeMode,
  retrieveAirwallexPaymentIntent
} from "@/lib/airwallex-client";
import { getCheckoutPaymentMethodDisabledError } from "@/lib/checkout-payment-methods";
import {
  ensureNonNegativeAmount,
  ensurePositiveQuantity,
  transitionOrder,
  transitionPaymentAttempt,
  type CheckoutPaymentMethod,
  type OrderStatus,
  type PaymentAttemptStatus
} from "@/lib/checkout-domain";
import {
  createOrder,
  createPaymentAttempt,
  deleteCartItem,
  getMarketplacePriceUsd,
  getOrderById,
  getOrCreateActiveCart,
  getPaymentAttemptByProviderIntentId,
  insertOrderItem,
  insertPaymentEvent,
  listCartItems,
  listMarketplaceCheckoutProperties,
  listOrderItems,
  markCartConverted,
  updateOrderStatus,
  updatePaymentAttempt,
  upsertCartItem,
  withCheckoutTransaction,
  type CartItemRecord,
  type MarketplaceCheckoutProperty,
  type OrderRecord,
  type OrderItemRecord
} from "@/lib/checkout-repository";
import {
  consumeOnboardingRewardReservationForOrder,
  getOnboardingRewardForWallet,
  releaseOnboardingRewardReservationForOrder,
  reserveOnboardingRewardForOrder,
  type OnboardingRewardSnapshot
} from "@/lib/onboarding-reward-service";
import { generateUuidV7 } from "@/lib/uuid-v7";

const ORDER_EXPIRY_MINUTES = 30;

export class CheckoutError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, status = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = "CheckoutError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type CheckoutCartItem = {
  propertyId: string;
  title: string;
  imageUrl: string;
  locationLabel: string;
  quantity: number;
  unitPriceUsd: number;
  lineTotalUsd: number;
};

export type CheckoutCart = {
  cartId: string;
  walletPublicKey: string;
  items: CheckoutCartItem[];
  totalItems: number;
  totalAmountUsd: number;
  onboardingReward: OnboardingRewardSnapshot | null;
};

export type CheckoutOrder = {
  orderId: string;
  status: OrderStatus;
  paymentMethod: CheckoutPaymentMethod | null;
  currency: string;
  subtotalAmountUsd: number;
  discountAmountUsd: number;
  totalAmountUsd: number;
  appliedOnboardingRewardId: string | null;
  expiresAt: string | null;
  items: Array<{
    propertyId: string;
    quantity: number;
    unitPriceUsd: number;
    lineTotalUsd: number;
  }>;
};

export type StartPaymentResult = {
  orderId: string;
  paymentMethod: CheckoutPaymentMethod;
  paymentAttemptId: string;
  status: PaymentAttemptStatus;
  airwallex?: {
    intentId: string;
    clientSecret: string;
    amount: number;
    currency: string;
    env: "demo" | "prod";
    successUrl: string;
  };
  crypto?: {
    mode: "existing_flow";
    message: string;
  };
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function asCheckoutItem(item: CartItemRecord, property: MarketplaceCheckoutProperty): CheckoutCartItem {
  return {
    propertyId: item.propertyId,
    title: property.title,
    imageUrl: property.imageUrl,
    locationLabel: property.locationLabel,
    quantity: item.quantity,
    unitPriceUsd: roundMoney(item.unitPriceUsd),
    lineTotalUsd: roundMoney(item.quantity * item.unitPriceUsd)
  };
}

async function buildCart(walletPublicKey: string): Promise<CheckoutCart> {
  const cart = await getOrCreateActiveCart(walletPublicKey, generateUuidV7());
  const cartItems = await listCartItems(cart.id);

  const propertyMap = new Map<string, MarketplaceCheckoutProperty>();
  const properties = await listMarketplaceCheckoutProperties(cartItems.map((item) => item.propertyId));
  for (const property of properties) {
    propertyMap.set(property.id, property);
  }

  const items: CheckoutCartItem[] = [];
  for (const item of cartItems) {
    const property = propertyMap.get(item.propertyId);
    if (!property) {
      continue;
    }
    items.push(asCheckoutItem(item, property));
  }

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmountUsd = roundMoney(items.reduce((acc, item) => acc + item.lineTotalUsd, 0));
  const onboardingReward = await getOnboardingRewardForWallet(walletPublicKey).catch(() => null);

  return {
    cartId: cart.id,
    walletPublicKey: cart.walletPublicKey,
    items,
    totalItems,
    totalAmountUsd,
    onboardingReward
  };
}

export async function getCart(walletPublicKey: string): Promise<CheckoutCart> {
  return buildCart(walletPublicKey);
}

export async function upsertCartItemQuantity(input: {
  walletPublicKey: string;
  propertyId: string;
  quantity: number;
}): Promise<CheckoutCart> {
  const quantity = ensurePositiveQuantity(input.quantity);
  const propertyId = input.propertyId.trim();

  if (!propertyId) {
    throw new CheckoutError("PROPERTY_REQUIRED", "propertyId is required.", 400);
  }

  const unitPriceUsd = await getMarketplacePriceUsd(propertyId);
  if (typeof unitPriceUsd !== "number") {
    throw new CheckoutError("PROPERTY_NOT_FOUND", "Property was not found in marketplace.", 404);
  }

  const cart = await getOrCreateActiveCart(input.walletPublicKey, generateUuidV7());
  await upsertCartItem({
    id: generateUuidV7(),
    cartId: cart.id,
    propertyId,
    quantity,
    unitPriceUsd: ensureNonNegativeAmount(unitPriceUsd)
  });

  return buildCart(input.walletPublicKey);
}

export async function removeCartItemByProperty(input: {
  walletPublicKey: string;
  propertyId: string;
}): Promise<CheckoutCart> {
  const propertyId = input.propertyId.trim();
  if (!propertyId) {
    throw new CheckoutError("PROPERTY_REQUIRED", "propertyId is required.", 400);
  }

  const cart = await getOrCreateActiveCart(input.walletPublicKey, generateUuidV7());
  await deleteCartItem({ cartId: cart.id, propertyId });

  return buildCart(input.walletPublicKey);
}

function toOrderView(order: OrderRecord, items: OrderItemRecord[]): CheckoutOrder {
  return {
    orderId: order.id,
    status: order.status,
    paymentMethod: order.paymentMethod,
    currency: order.currency,
    subtotalAmountUsd: roundMoney(order.subtotalAmountUsd),
    discountAmountUsd: roundMoney(order.discountAmountUsd),
    totalAmountUsd: roundMoney(order.totalAmountUsd),
    appliedOnboardingRewardId: order.appliedOnboardingRewardId,
    expiresAt: order.expiresAt,
    items: items.map((item) => ({
      propertyId: item.propertyId,
      quantity: item.quantity,
      unitPriceUsd: roundMoney(item.unitPriceUsd),
      lineTotalUsd: roundMoney(item.lineTotalUsd)
    }))
  };
}

function resolveOrderExpiryIso(now = Date.now()): string {
  return new Date(now + ORDER_EXPIRY_MINUTES * 60 * 1_000).toISOString();
}

export async function createOrderFromCart(input: {
  walletPublicKey: string;
  paymentMethod: CheckoutPaymentMethod;
  idempotencyKey?: string;
  applyOnboardingReward?: boolean;
}): Promise<CheckoutOrder> {
  const method = input.paymentMethod;
  if (method !== "crypto" && method !== "airwallex") {
    throw new CheckoutError("PAYMENT_METHOD_INVALID", "Unsupported payment method.", 400);
  }

  const disabledMethodError = getCheckoutPaymentMethodDisabledError(method);
  if (disabledMethodError) {
    throw new CheckoutError(
      disabledMethodError.code,
      disabledMethodError.message,
      disabledMethodError.status
    );
  }

  const idempotencyKey = input.idempotencyKey?.trim() || generateUuidV7();

  return withCheckoutTransaction(async (client) => {
    const cart = await getOrCreateActiveCart(input.walletPublicKey, generateUuidV7(), { client });
    const items = await listCartItems(cart.id, { client });

    if (items.length === 0) {
      throw new CheckoutError("CART_EMPTY", "Cart is empty.", 400);
    }

    const subtotalAmountUsd = roundMoney(
      items.reduce((acc, item) => acc + roundMoney(item.quantity * item.unitPriceUsd), 0)
    );
    const orderId = generateUuidV7();
    const reservedReward =
      input.applyOnboardingReward === false
        ? null
        : await reserveOnboardingRewardForOrder({
            walletPublicKey: input.walletPublicKey,
            orderId,
            subtotalAmountUsd
          }, { client });
    const discountAmountUsd = roundMoney(reservedReward?.discountAmountUsd ?? 0);
    const totalAmountUsd = roundMoney(Math.max(0, subtotalAmountUsd - discountAmountUsd));

    const order = await createOrder({
      id: orderId,
      walletPublicKey: input.walletPublicKey,
      sourceCartId: cart.id,
      status: "pending_payment",
      paymentMethod: method,
      subtotalAmountUsd,
      discountAmountUsd,
      totalAmountUsd,
      appliedOnboardingRewardId: reservedReward?.rewardId ?? null,
      currency: "USD",
      expiresAt: resolveOrderExpiryIso(),
      idempotencyKey
    }, { client });

    for (const item of items) {
      await insertOrderItem({
        id: generateUuidV7(),
        orderId: order.id,
        propertyId: item.propertyId,
        quantity: item.quantity,
        unitPriceUsd: item.unitPriceUsd,
        lineTotalUsd: roundMoney(item.quantity * item.unitPriceUsd)
      }, { client });
    }

    await markCartConverted(cart.id, { client });

    const orderItems = await listOrderItems(order.id, { client });
    return toOrderView(order, orderItems);
  });
}

async function assertOrderOwnedByWallet(orderId: string, walletPublicKey: string): Promise<OrderRecord> {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new CheckoutError("ORDER_NOT_FOUND", "Order not found.", 404);
  }

  if (order.walletPublicKey !== walletPublicKey) {
    throw new CheckoutError("UNAUTHORIZED", "Order does not belong to current wallet.", 403);
  }

  return order;
}

function assertOrderIsPayable(order: OrderRecord): void {
  const transition = transitionOrder(order.status, "pending_payment");
  if (!transition.ok && order.status !== "pending_payment") {
    throw new CheckoutError("ORDER_NOT_PAYABLE", `Order in status ${order.status} cannot start payment.`, 409);
  }

  if (order.expiresAt) {
    const expiresAtMs = new Date(order.expiresAt).getTime();
    if (!Number.isNaN(expiresAtMs) && expiresAtMs <= Date.now()) {
      throw new CheckoutError("ORDER_EXPIRED", "Order is expired.", 409);
    }
  }
}

function resolveCheckoutSuccessUrl(orderId: string): string {
  const explicit = process.env.CHECKOUT_SUCCESS_URL?.trim();
  if (explicit) {
    const separator = explicit.includes("?") ? "&" : "?";
    return `${explicit}${separator}orderId=${encodeURIComponent(orderId)}`;
  }

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return `${appBaseUrl}/checkout/success?orderId=${encodeURIComponent(orderId)}`;
}

function normalizeAirwallexStatus(status: string): PaymentAttemptStatus {
  const normalized = status.trim().toUpperCase();

  if (["REQUIRES_CUSTOMER_ACTION", "REQUIRES_PAYMENT_METHOD", "PENDING"].includes(normalized)) {
    return "requires_action";
  }

  if (["SUCCEEDED", "PAID", "SETTLED", "CAPTURE_REQUESTED", "AUTHORIZED"].includes(normalized)) {
    return "succeeded";
  }

  if (["FAILED", "CANCELLED", "EXPIRED"].includes(normalized)) {
    return "failed";
  }

  return "initiated";
}

function toPaymentProviderCheckoutError(reason: unknown): CheckoutError {
  const message = reason instanceof Error ? reason.message : "Unknown payment provider error.";

  if (message.includes("AIRWALLEX_SANDBOX_CLIENT_ID and AIRWALLEX_SANDBOX_API_KEY are required")) {
    return new CheckoutError(
      "PAYMENT_PROVIDER_NOT_CONFIGURED",
      "Sandbox mode is enabled but Airwallex sandbox credentials are missing.",
      503
    );
  }

  if (message.includes("AIRWALLEX_CLIENT_ID and AIRWALLEX_API_KEY are required for live mode")) {
    return new CheckoutError(
      "PAYMENT_PROVIDER_NOT_CONFIGURED",
      "Live mode is enabled but Airwallex live credentials are missing.",
      503
    );
  }

  return new CheckoutError(
    "PAYMENT_PROVIDER_ERROR",
    `Airwallex payment initialization failed: ${message}`,
    502
  );
}

export async function startOrderPayment(input: {
  walletPublicKey: string;
  orderId: string;
  paymentMethod: CheckoutPaymentMethod;
  runtimeMode?: AirwallexRuntimeMode;
}): Promise<StartPaymentResult> {
  const disabledMethodError = getCheckoutPaymentMethodDisabledError(input.paymentMethod);
  if (disabledMethodError) {
    throw new CheckoutError(
      disabledMethodError.code,
      disabledMethodError.message,
      disabledMethodError.status
    );
  }

  const order = await assertOrderOwnedByWallet(input.orderId, input.walletPublicKey);
  assertOrderIsPayable(order);

  const orderMethod = order.paymentMethod;
  if (orderMethod && orderMethod !== input.paymentMethod) {
    throw new CheckoutError("PAYMENT_METHOD_MISMATCH", "Payment method differs from order setup.", 409);
  }

  if (input.paymentMethod === "crypto") {
    const paymentAttempt = await createPaymentAttempt({
      id: generateUuidV7(),
      orderId: order.id,
      provider: "crypto",
      providerIntentId: null,
      status: "initiated",
      amountUsd: order.totalAmountUsd,
      currency: order.currency,
      idempotencyKey: generateUuidV7(),
      clientSecret: null,
      errorCode: null,
      errorMessage: null
    });

    return {
      orderId: order.id,
      paymentMethod: "crypto",
      paymentAttemptId: paymentAttempt.id,
      status: paymentAttempt.status,
      crypto: {
        mode: "existing_flow",
        message: "Use existing crypto purchase flow for blockchain confirmation."
      }
    };
  }

  const successUrl = resolveCheckoutSuccessUrl(order.id);
  const runtimeMode: AirwallexRuntimeMode = input.runtimeMode ?? "live";
  let intent: Awaited<ReturnType<typeof createAirwallexPaymentIntent>>;
  try {
    intent = await createAirwallexPaymentIntent({
      requestId: generateUuidV7(),
      merchantOrderId: order.id,
      amount: roundMoney(order.totalAmountUsd),
      currency: order.currency,
      returnUrl: successUrl,
      metadata: {
        order_id: order.id,
        wallet_public_key: input.walletPublicKey
      }
    }, runtimeMode);
  } catch (reason) {
    await releaseOnboardingRewardReservationForOrder(order.id);
    await updateOrderStatus({
      orderId: order.id,
      status: "failed"
    });
    throw toPaymentProviderCheckoutError(reason);
  }

  if (!intent.clientSecret) {
    await releaseOnboardingRewardReservationForOrder(order.id);
    await updateOrderStatus({
      orderId: order.id,
      status: "failed"
    });
    throw new CheckoutError(
      "PAYMENT_PROVIDER_ERROR",
      "Airwallex did not return client_secret. Verify the PaymentIntent response.",
      502
    );
  }

  const mappedStatus = normalizeAirwallexStatus(intent.status);
  const paymentAttempt = await createPaymentAttempt({
    id: generateUuidV7(),
    orderId: order.id,
    provider: "airwallex",
    providerIntentId: intent.intentId,
    status: mappedStatus,
    amountUsd: intent.amount,
    currency: intent.currency,
    idempotencyKey: generateUuidV7(),
    clientSecret: intent.clientSecret,
    errorCode: null,
    errorMessage: null
  });

  return {
    orderId: order.id,
    paymentMethod: "airwallex",
    paymentAttemptId: paymentAttempt.id,
    status: paymentAttempt.status,
    airwallex: {
      intentId: intent.intentId,
      clientSecret: intent.clientSecret,
      amount: intent.amount,
      currency: intent.currency,
      env: intent.env,
      successUrl
    }
  };
}

export async function getOrderSnapshot(input: {
  walletPublicKey: string;
  orderId: string;
}): Promise<CheckoutOrder> {
  const order = await assertOrderOwnedByWallet(input.orderId, input.walletPublicKey);
  const items = await listOrderItems(order.id);
  return toOrderView(order, items);
}

function mapWebhookEventToStatuses(eventName: string): {
  paymentAttemptStatus: PaymentAttemptStatus | null;
  orderStatus: OrderStatus | null;
} {
  const normalizedEvent = eventName.trim().toLowerCase();

  if (["payment_intent.succeeded", "payment_attempt.paid", "payment_attempt.settled"].includes(normalizedEvent)) {
    return {
      paymentAttemptStatus: "succeeded",
      orderStatus: "paid"
    };
  }

  if (["payment_intent.requires_customer_action", "payment_intent.pending"].includes(normalizedEvent)) {
    return {
      paymentAttemptStatus: "requires_action",
      orderStatus: null
    };
  }

  if (
    [
      "payment_intent.cancelled",
      "payment_intent.requires_payment_method",
      "payment_attempt.failed_to_process",
      "payment_attempt.capture_failed",
      "payment_attempt.authorization_failed",
      "payment_attempt.cancelled",
      "payment_attempt.expired"
    ].includes(normalizedEvent)
  ) {
    return {
      paymentAttemptStatus: "failed",
      orderStatus: "failed"
    };
  }

  return {
    paymentAttemptStatus: null,
    orderStatus: null
  };
}

export async function reconcileAirwallexPaymentIntent(input: {
  providerEventId: string;
  eventName: string;
  payload: unknown;
}): Promise<{ processed: boolean; reason?: string }> {
  const payload = input.payload as {
    data?: {
      object?: {
        id?: string;
      };
      payment_intent?: {
        id?: string;
      };
    };
  };

  const paymentIntentId = payload?.data?.object?.id || payload?.data?.payment_intent?.id;
  if (!paymentIntentId) {
    return { processed: false, reason: "missing_payment_intent_id" };
  }

  return withCheckoutTransaction(async (client) => {
    const inserted = await insertPaymentEvent({
      id: generateUuidV7(),
      provider: "airwallex",
      providerEventId: input.providerEventId,
      eventName: input.eventName,
      payloadJson: input.payload
    }, { client });

    if (!inserted) {
      return { processed: false, reason: "duplicate_event" };
    }

    const paymentAttempt = await getPaymentAttemptByProviderIntentId("airwallex", paymentIntentId, { client });
    if (!paymentAttempt) {
      return { processed: false, reason: "payment_attempt_not_found" };
    }

    const providerIntent = await retrieveAirwallexPaymentIntent(paymentIntentId);
    const normalizedProviderStatus = normalizeAirwallexStatus(providerIntent.status);
    const eventMapped = mapWebhookEventToStatuses(input.eventName);
    const nextPaymentStatus = eventMapped.paymentAttemptStatus ?? normalizedProviderStatus;

    const paymentTransition = transitionPaymentAttempt(paymentAttempt.status, nextPaymentStatus);
    if (paymentTransition.ok) {
      await updatePaymentAttempt({
        id: paymentAttempt.id,
        status: paymentTransition.value,
        errorCode: paymentTransition.value === "failed" ? "AIRWALLEX_WEBHOOK_FAILURE" : null,
        errorMessage: paymentTransition.value === "failed" ? `Webhook event: ${input.eventName}` : null
      }, { client });
    }

    if (!eventMapped.orderStatus) {
      return { processed: true };
    }

    const order = await getOrderById(paymentAttempt.orderId, { client });
    if (!order) {
      return { processed: false, reason: "order_not_found" };
    }

    const orderTransition = transitionOrder(order.status, eventMapped.orderStatus);
    if (!orderTransition.ok) {
      return { processed: false, reason: "invalid_order_transition" };
    }

    await updateOrderStatus({
      orderId: order.id,
      status: orderTransition.value
    }, { client });

    if (orderTransition.value === "paid") {
      await consumeOnboardingRewardReservationForOrder(order.id, { client });
    } else if (["failed", "expired", "canceled"].includes(orderTransition.value)) {
      await releaseOnboardingRewardReservationForOrder(order.id, { client });
    }

    return { processed: true };
  });
}
