import type { PoolClient } from "pg";

import type {
  CheckoutPaymentMethod,
  OrderStatus,
  PaymentAttemptStatus
} from "@/lib/checkout-domain";
import { withDbClient } from "@/lib/db/pool";

export type CartRecord = {
  id: string;
  walletPublicKey: string;
  status: "active" | "converted" | "abandoned";
  createdAt: string;
  updatedAt: string;
};

export type CartItemRecord = {
  id: string;
  cartId: string;
  propertyId: string;
  quantity: number;
  unitPriceUsd: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderRecord = {
  id: string;
  walletPublicKey: string;
  sourceCartId: string | null;
  status: OrderStatus;
  paymentMethod: CheckoutPaymentMethod | null;
  totalAmountUsd: number;
  currency: string;
  expiresAt: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderItemRecord = {
  id: string;
  orderId: string;
  propertyId: string;
  quantity: number;
  unitPriceUsd: number;
  lineTotalUsd: number;
  createdAt: string;
  updatedAt: string;
};

export type PaymentAttemptRecord = {
  id: string;
  orderId: string;
  provider: string;
  providerIntentId: string | null;
  status: PaymentAttemptStatus;
  amountUsd: number;
  currency: string;
  idempotencyKey: string;
  clientSecret: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MarketplaceCheckoutProperty = {
  id: string;
  title: string;
  imageUrl: string;
  locationLabel: string;
  nftPriceUsd: number;
};

const cartColumns = `
  id,
  wallet_public_key,
  status,
  created_at,
  updated_at
`;

const cartItemColumns = `
  id,
  cart_id,
  property_id,
  quantity,
  unit_price_usd,
  created_at,
  updated_at
`;

const orderColumns = `
  id,
  wallet_public_key,
  source_cart_id,
  status,
  payment_method,
  total_amount_usd,
  currency,
  expires_at,
  idempotency_key,
  created_at,
  updated_at
`;

const orderItemColumns = `
  id,
  order_id,
  property_id,
  quantity,
  unit_price_usd,
  line_total_usd,
  created_at,
  updated_at
`;

const paymentAttemptColumns = `
  id,
  order_id,
  provider,
  provider_intent_id,
  status,
  amount_usd,
  currency,
  idempotency_key,
  client_secret,
  error_code,
  error_message,
  created_at,
  updated_at
`;

type DbOptions = {
  client?: PoolClient;
};

function toIso(value: string | Date | null): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function toNumber(value: string | number): number {
  return Number(value);
}

function mapCartRow(row: {
  id: string;
  wallet_public_key: string;
  status: "active" | "converted" | "abandoned";
  created_at: string | Date;
  updated_at: string | Date;
}): CartRecord {
  return {
    id: row.id,
    walletPublicKey: row.wallet_public_key,
    status: row.status,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString()
  };
}

function mapCartItemRow(row: {
  id: string;
  cart_id: string;
  property_id: string;
  quantity: number;
  unit_price_usd: string | number;
  created_at: string | Date;
  updated_at: string | Date;
}): CartItemRecord {
  return {
    id: row.id,
    cartId: row.cart_id,
    propertyId: row.property_id,
    quantity: Number(row.quantity),
    unitPriceUsd: toNumber(row.unit_price_usd),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString()
  };
}

function mapOrderRow(row: {
  id: string;
  wallet_public_key: string;
  source_cart_id: string | null;
  status: OrderStatus;
  payment_method: CheckoutPaymentMethod | null;
  total_amount_usd: string | number;
  currency: string;
  expires_at: string | Date | null;
  idempotency_key: string;
  created_at: string | Date;
  updated_at: string | Date;
}): OrderRecord {
  return {
    id: row.id,
    walletPublicKey: row.wallet_public_key,
    sourceCartId: row.source_cart_id,
    status: row.status,
    paymentMethod: row.payment_method,
    totalAmountUsd: toNumber(row.total_amount_usd),
    currency: row.currency,
    expiresAt: toIso(row.expires_at),
    idempotencyKey: row.idempotency_key,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString()
  };
}

function mapOrderItemRow(row: {
  id: string;
  order_id: string;
  property_id: string;
  quantity: number;
  unit_price_usd: string | number;
  line_total_usd: string | number;
  created_at: string | Date;
  updated_at: string | Date;
}): OrderItemRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    propertyId: row.property_id,
    quantity: Number(row.quantity),
    unitPriceUsd: toNumber(row.unit_price_usd),
    lineTotalUsd: toNumber(row.line_total_usd),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString()
  };
}

function mapPaymentAttemptRow(row: {
  id: string;
  order_id: string;
  provider: string;
  provider_intent_id: string | null;
  status: PaymentAttemptStatus;
  amount_usd: string | number;
  currency: string;
  idempotency_key: string;
  client_secret: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}): PaymentAttemptRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    provider: row.provider,
    providerIntentId: row.provider_intent_id,
    status: row.status,
    amountUsd: toNumber(row.amount_usd),
    currency: row.currency,
    idempotencyKey: row.idempotency_key,
    clientSecret: row.client_secret,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString()
  };
}

async function runWithClient<T>(work: (client: PoolClient) => Promise<T>, options?: DbOptions): Promise<T> {
  if (options?.client) {
    return work(options.client);
  }

  return withDbClient(work);
}

export async function getMarketplacePriceUsd(propertyId: string, options?: DbOptions): Promise<number | null> {
  return runWithClient(async (client) => {
    const result = await client.query<{ nft_price_usd: string | number }>(
      `SELECT nft_price_usd
       FROM marketplace_entries
       WHERE id = $1
       LIMIT 1`,
      [propertyId]
    );

    const row = result.rows[0];
    return row ? Number(row.nft_price_usd) : null;
  }, options);
}

export async function listMarketplaceCheckoutProperties(
  propertyIds: string[],
  options?: DbOptions
): Promise<MarketplaceCheckoutProperty[]> {
  if (propertyIds.length === 0) {
    return [];
  }

  return runWithClient(async (client) => {
    const result = await client.query<{
      id: string;
      title: string;
      image_url: string;
      location_label: string;
      nft_price_usd: string | number;
    }>(
      `SELECT id, title, image_url, location_label, nft_price_usd
       FROM marketplace_entries
       WHERE id = ANY($1::text[])`,
      [propertyIds]
    );

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      imageUrl: row.image_url,
      locationLabel: row.location_label,
      nftPriceUsd: Number(row.nft_price_usd)
    }));
  }, options);
}

export async function getOrCreateActiveCart(walletPublicKey: string, cartId: string, options?: DbOptions): Promise<CartRecord> {
  return runWithClient(async (client) => {
    const existing = await client.query<{
      id: string;
      wallet_public_key: string;
      status: "active" | "converted" | "abandoned";
      created_at: string | Date;
      updated_at: string | Date;
    }>(
      `SELECT ${cartColumns}
       FROM carts
       WHERE wallet_public_key = $1
         AND status = 'active'
       LIMIT 1`,
      [walletPublicKey]
    );

    if (existing.rows[0]) {
      return mapCartRow(existing.rows[0]);
    }

    const inserted = await client.query<{
      id: string;
      wallet_public_key: string;
      status: "active" | "converted" | "abandoned";
      created_at: string | Date;
      updated_at: string | Date;
    }>(
      `INSERT INTO carts (id, wallet_public_key, status)
       VALUES ($1, $2, 'active')
       RETURNING ${cartColumns}`,
      [cartId, walletPublicKey]
    );

    return mapCartRow(inserted.rows[0]);
  }, options);
}

export async function listCartItems(cartId: string, options?: DbOptions): Promise<CartItemRecord[]> {
  return runWithClient(async (client) => {
    const result = await client.query<{
      id: string;
      cart_id: string;
      property_id: string;
      quantity: number;
      unit_price_usd: string | number;
      created_at: string | Date;
      updated_at: string | Date;
    }>(
      `SELECT ${cartItemColumns}
       FROM cart_items
       WHERE cart_id = $1
       ORDER BY created_at ASC`,
      [cartId]
    );

    return result.rows.map(mapCartItemRow);
  }, options);
}

export async function upsertCartItem(input: {
  id: string;
  cartId: string;
  propertyId: string;
  quantity: number;
  unitPriceUsd: number;
}, options?: DbOptions): Promise<CartItemRecord> {
  return runWithClient(async (client) => {
    const result = await client.query<{
      id: string;
      cart_id: string;
      property_id: string;
      quantity: number;
      unit_price_usd: string | number;
      created_at: string | Date;
      updated_at: string | Date;
    }>(
      `INSERT INTO cart_items (id, cart_id, property_id, quantity, unit_price_usd)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (cart_id, property_id)
       DO UPDATE SET
         quantity = EXCLUDED.quantity,
         unit_price_usd = EXCLUDED.unit_price_usd
       RETURNING ${cartItemColumns}`,
      [input.id, input.cartId, input.propertyId, input.quantity, input.unitPriceUsd]
    );

    return mapCartItemRow(result.rows[0]);
  }, options);
}

export async function deleteCartItem(input: { cartId: string; propertyId: string }, options?: DbOptions): Promise<void> {
  await runWithClient(async (client) => {
    await client.query(
      `DELETE FROM cart_items
       WHERE cart_id = $1
         AND property_id = $2`,
      [input.cartId, input.propertyId]
    );
  }, options);
}

export async function createOrder(input: {
  id: string;
  walletPublicKey: string;
  sourceCartId: string;
  status: OrderStatus;
  paymentMethod: CheckoutPaymentMethod;
  totalAmountUsd: number;
  currency: string;
  expiresAt: string | null;
  idempotencyKey: string;
}, options?: DbOptions): Promise<OrderRecord> {
  return runWithClient(async (client) => {
    const result = await client.query<{
      id: string;
      wallet_public_key: string;
      source_cart_id: string | null;
      status: OrderStatus;
      payment_method: CheckoutPaymentMethod | null;
      total_amount_usd: string | number;
      currency: string;
      expires_at: string | Date | null;
      idempotency_key: string;
      created_at: string | Date;
      updated_at: string | Date;
    }>(
      `INSERT INTO orders (
         id,
         wallet_public_key,
         source_cart_id,
         status,
         payment_method,
         total_amount_usd,
         currency,
         expires_at,
         idempotency_key
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (wallet_public_key, idempotency_key)
       DO UPDATE SET updated_at = NOW()
       RETURNING ${orderColumns}`,
      [
        input.id,
        input.walletPublicKey,
        input.sourceCartId,
        input.status,
        input.paymentMethod,
        input.totalAmountUsd,
        input.currency,
        input.expiresAt,
        input.idempotencyKey
      ]
    );

    return mapOrderRow(result.rows[0]);
  }, options);
}

export async function insertOrderItem(input: {
  id: string;
  orderId: string;
  propertyId: string;
  quantity: number;
  unitPriceUsd: number;
  lineTotalUsd: number;
}, options?: DbOptions): Promise<OrderItemRecord> {
  return runWithClient(async (client) => {
    const result = await client.query<{
      id: string;
      order_id: string;
      property_id: string;
      quantity: number;
      unit_price_usd: string | number;
      line_total_usd: string | number;
      created_at: string | Date;
      updated_at: string | Date;
    }>(
      `INSERT INTO order_items (
         id,
         order_id,
         property_id,
         quantity,
         unit_price_usd,
         line_total_usd
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${orderItemColumns}`,
      [input.id, input.orderId, input.propertyId, input.quantity, input.unitPriceUsd, input.lineTotalUsd]
    );

    return mapOrderItemRow(result.rows[0]);
  }, options);
}

export async function markCartConverted(cartId: string, options?: DbOptions): Promise<void> {
  await runWithClient(async (client) => {
    await client.query(
      `UPDATE carts
       SET status = 'converted'
       WHERE id = $1
         AND status = 'active'`,
      [cartId]
    );
  }, options);
}

export async function getOrderById(orderId: string, options?: DbOptions): Promise<OrderRecord | null> {
  return runWithClient(async (client) => {
    const result = await client.query<{
      id: string;
      wallet_public_key: string;
      source_cart_id: string | null;
      status: OrderStatus;
      payment_method: CheckoutPaymentMethod | null;
      total_amount_usd: string | number;
      currency: string;
      expires_at: string | Date | null;
      idempotency_key: string;
      created_at: string | Date;
      updated_at: string | Date;
    }>(
      `SELECT ${orderColumns}
       FROM orders
       WHERE id = $1
       LIMIT 1`,
      [orderId]
    );

    const row = result.rows[0];
    return row ? mapOrderRow(row) : null;
  }, options);
}

export async function updateOrderStatus(input: {
  orderId: string;
  status: OrderStatus;
}, options?: DbOptions): Promise<OrderRecord | null> {
  return runWithClient(async (client) => {
    const result = await client.query<{
      id: string;
      wallet_public_key: string;
      source_cart_id: string | null;
      status: OrderStatus;
      payment_method: CheckoutPaymentMethod | null;
      total_amount_usd: string | number;
      currency: string;
      expires_at: string | Date | null;
      idempotency_key: string;
      created_at: string | Date;
      updated_at: string | Date;
    }>(
      `UPDATE orders
       SET status = $2
       WHERE id = $1
       RETURNING ${orderColumns}`,
      [input.orderId, input.status]
    );

    const row = result.rows[0];
    return row ? mapOrderRow(row) : null;
  }, options);
}

export async function listOrderItems(orderId: string, options?: DbOptions): Promise<OrderItemRecord[]> {
  return runWithClient(async (client) => {
    const result = await client.query<{
      id: string;
      order_id: string;
      property_id: string;
      quantity: number;
      unit_price_usd: string | number;
      line_total_usd: string | number;
      created_at: string | Date;
      updated_at: string | Date;
    }>(
      `SELECT ${orderItemColumns}
       FROM order_items
       WHERE order_id = $1
       ORDER BY created_at ASC`,
      [orderId]
    );

    return result.rows.map(mapOrderItemRow);
  }, options);
}

export async function createPaymentAttempt(input: {
  id: string;
  orderId: string;
  provider: string;
  providerIntentId: string | null;
  status: PaymentAttemptStatus;
  amountUsd: number;
  currency: string;
  idempotencyKey: string;
  clientSecret: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}, options?: DbOptions): Promise<PaymentAttemptRecord> {
  return runWithClient(async (client) => {
    const result = await client.query<{
      id: string;
      order_id: string;
      provider: string;
      provider_intent_id: string | null;
      status: PaymentAttemptStatus;
      amount_usd: string | number;
      currency: string;
      idempotency_key: string;
      client_secret: string | null;
      error_code: string | null;
      error_message: string | null;
      created_at: string | Date;
      updated_at: string | Date;
    }>(
      `INSERT INTO payment_attempts (
         id,
         order_id,
         provider,
         provider_intent_id,
         status,
         amount_usd,
         currency,
         idempotency_key,
         client_secret,
         error_code,
         error_message
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (idempotency_key)
       DO UPDATE SET updated_at = NOW()
       RETURNING ${paymentAttemptColumns}`,
      [
        input.id,
        input.orderId,
        input.provider,
        input.providerIntentId,
        input.status,
        input.amountUsd,
        input.currency,
        input.idempotencyKey,
        input.clientSecret,
        input.errorCode,
        input.errorMessage
      ]
    );

    return mapPaymentAttemptRow(result.rows[0]);
  }, options);
}

export async function getPaymentAttemptByProviderIntentId(
  provider: string,
  providerIntentId: string,
  options?: DbOptions
): Promise<PaymentAttemptRecord | null> {
  return runWithClient(async (client) => {
    const result = await client.query<{
      id: string;
      order_id: string;
      provider: string;
      provider_intent_id: string | null;
      status: PaymentAttemptStatus;
      amount_usd: string | number;
      currency: string;
      idempotency_key: string;
      client_secret: string | null;
      error_code: string | null;
      error_message: string | null;
      created_at: string | Date;
      updated_at: string | Date;
    }>(
      `SELECT ${paymentAttemptColumns}
       FROM payment_attempts
       WHERE provider = $1
         AND provider_intent_id = $2
       LIMIT 1`,
      [provider, providerIntentId]
    );

    const row = result.rows[0];
    return row ? mapPaymentAttemptRow(row) : null;
  }, options);
}

export async function updatePaymentAttempt(input: {
  id: string;
  status: PaymentAttemptStatus;
  errorCode?: string | null;
  errorMessage?: string | null;
}, options?: DbOptions): Promise<PaymentAttemptRecord | null> {
  return runWithClient(async (client) => {
    const result = await client.query<{
      id: string;
      order_id: string;
      provider: string;
      provider_intent_id: string | null;
      status: PaymentAttemptStatus;
      amount_usd: string | number;
      currency: string;
      idempotency_key: string;
      client_secret: string | null;
      error_code: string | null;
      error_message: string | null;
      created_at: string | Date;
      updated_at: string | Date;
    }>(
      `UPDATE payment_attempts
       SET
         status = $2,
         error_code = $3,
         error_message = $4
       WHERE id = $1
       RETURNING ${paymentAttemptColumns}`,
      [input.id, input.status, input.errorCode ?? null, input.errorMessage ?? null]
    );

    const row = result.rows[0];
    return row ? mapPaymentAttemptRow(row) : null;
  }, options);
}

export async function insertPaymentEvent(input: {
  id: string;
  provider: string;
  providerEventId: string;
  eventName: string;
  payloadJson: unknown;
}, options?: DbOptions): Promise<boolean> {
  return runWithClient(async (client) => {
    const result = await client.query<{ id: string }>(
      `INSERT INTO payment_events (id, provider, provider_event_id, event_name, payload_json)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (provider, provider_event_id) DO NOTHING
       RETURNING id`,
      [input.id, input.provider, input.providerEventId, input.eventName, JSON.stringify(input.payloadJson)]
    );

    return Boolean(result.rows[0]);
  }, options);
}

export async function withCheckoutTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  return withDbClient(async (client) => {
    await client.query("BEGIN");

    try {
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}
