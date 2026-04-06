CREATE TYPE order_status AS ENUM ('draft', 'pending_payment', 'paid', 'failed', 'expired', 'canceled');
CREATE TYPE checkout_payment_method AS ENUM ('crypto', 'airwallex');
CREATE TYPE payment_attempt_status AS ENUM ('initiated', 'requires_action', 'succeeded', 'failed');

CREATE TABLE IF NOT EXISTS carts (
  id TEXT PRIMARY KEY,
  wallet_public_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES marketplace_entries(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_usd NUMERIC(14,2) NOT NULL CHECK (unit_price_usd >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, property_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  wallet_public_key TEXT NOT NULL,
  source_cart_id TEXT REFERENCES carts(id),
  status order_status NOT NULL DEFAULT 'draft',
  payment_method checkout_payment_method,
  total_amount_usd NUMERIC(14,2) NOT NULL CHECK (total_amount_usd >= 0),
  currency CHAR(3) NOT NULL,
  expires_at TIMESTAMPTZ,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wallet_public_key, idempotency_key)
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES marketplace_entries(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_usd NUMERIC(14,2) NOT NULL CHECK (unit_price_usd >= 0),
  line_total_usd NUMERIC(14,2) NOT NULL CHECK (line_total_usd >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, property_id)
);

CREATE TABLE IF NOT EXISTS payment_attempts (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_intent_id TEXT,
  status payment_attempt_status NOT NULL DEFAULT 'initiated',
  amount_usd NUMERIC(14,2) NOT NULL CHECK (amount_usd >= 0),
  currency CHAR(3) NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  client_secret TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS carts_wallet_status_idx
  ON carts(wallet_public_key, status);

CREATE UNIQUE INDEX IF NOT EXISTS carts_wallet_active_unique_idx
  ON carts(wallet_public_key)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS cart_items_cart_id_idx
  ON cart_items(cart_id);

CREATE INDEX IF NOT EXISTS orders_wallet_status_idx
  ON orders(wallet_public_key, status);

CREATE INDEX IF NOT EXISTS orders_expires_at_idx
  ON orders(expires_at);

CREATE INDEX IF NOT EXISTS payment_attempts_order_id_idx
  ON payment_attempts(order_id);

CREATE INDEX IF NOT EXISTS payment_attempts_provider_intent_id_idx
  ON payment_attempts(provider_intent_id);

DROP TRIGGER IF EXISTS carts_set_updated_at ON carts;
CREATE TRIGGER carts_set_updated_at
BEFORE UPDATE ON carts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

DROP TRIGGER IF EXISTS cart_items_set_updated_at ON cart_items;
CREATE TRIGGER cart_items_set_updated_at
BEFORE UPDATE ON cart_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

DROP TRIGGER IF EXISTS orders_set_updated_at ON orders;
CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

DROP TRIGGER IF EXISTS order_items_set_updated_at ON order_items;
CREATE TRIGGER order_items_set_updated_at
BEFORE UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

DROP TRIGGER IF EXISTS payment_attempts_set_updated_at ON payment_attempts;
CREATE TRIGGER payment_attempts_set_updated_at
BEFORE UPDATE ON payment_attempts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();
