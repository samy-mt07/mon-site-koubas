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