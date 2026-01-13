-- USERS
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    price_cents     INTEGER NOT NULL CHECK (price_cents >= 0),
    image_url       TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) ON DELETE CASCADE,
    total_cents     INTEGER NOT NULL CHECK (total_cents >= 0),
    status          VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT orders_status_check CHECK (status IN ('pending', 'paid', 'cancelled'))
);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id            BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id          BIGINT NOT NULL REFERENCES products(id),
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents    INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    subtotal_cents      INTEGER NOT NULL CHECK (subtotal_cents >= 0)
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id                BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount_cents            INTEGER NOT NULL CHECK (amount_cents >= 0),
    provider                VARCHAR(100) NOT NULL,
    provider_payment_id     VARCHAR(255),
    status                  VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT payments_status_check CHECK (
        status IN ('pending', 'succeeded', 'failed')
    )
);

ALTER TABLE orders
ADD COLUMN shipping_full_name   TEXT NOT NULL DEFAULT '',
ADD COLUMN shipping_phone       TEXT NOT NULL DEFAULT '',
ADD COLUMN shipping_address1    TEXT NOT NULL DEFAULT '',
ADD COLUMN shipping_apartment   TEXT DEFAULT NULL,
ADD COLUMN shipping_city        TEXT NOT NULL DEFAULT '',
ADD COLUMN shipping_postal_code TEXT NOT NULL DEFAULT '',
ADD COLUMN shipping_country     TEXT NOT NULL DEFAULT 'Canada',
ADD COLUMN shipping_status      TEXT NOT NULL DEFAULT 'pending_shipment';

CREATE TABLE shipments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL,                -- ex: 'uniuni'
  service_code TEXT,                    -- optionnel, selon la doc UniUni
  external_shipment_id TEXT,            -- ID côté UniUni
  tracking_number TEXT,
  label_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, created, in_transit, delivered, failed...
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

;


CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_shipments_order_id ON shipments(order_id);
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;


ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_province TEXT NOT NULL DEFAULT 'QC';
