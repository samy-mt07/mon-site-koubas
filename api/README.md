# Backend Documentation

## Overview

This backend is an Express.js API connected to PostgreSQL. It supports user authentication, product management, order creation, checkout integration with Stripe, admin endpoints, Telegram notifications, and an optional UniUni shipment worker.

## Run Instructions

1. Install dependencies:
   ```bash
   cd /home/samy/mon-site-koubas/api
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. The server listens on `http://localhost:${process.env.PORT || 4000}` by default.

## Environment Variables

The backend uses `dotenv` and expects these variables:

- `PORT` - API port (default `4000`)
- `JWT_SECRET` - secret key for JWT signing

PostgreSQL connection:
- `PGHOST`
- `PGPORT`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`

Stripe & frontend URLs:
- `STRIPE_SECRET_KEY`
- `FRONTEND_URL`

UniUni shipment worker:
- `UNIUNI_WORKER_ENABLED` - set `true` to start worker
- `UNIUNI_BASE_URL`
- `UNIUNI_ACCESS_TOKEN`
- `UNIUNI_AUTO_PURCHASE` - optional `true`
- `UNIUNI_AUTO_LABEL` - optional `true`
- `UNIUNI_STEP_MAX_ATTEMPTS` - optional, default `3`
- `UNIUNI_STEP_RETRY_DELAY_MS` - optional, default `2500`

Telegram notifications:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## Application Structure

- `src/index.js` - server entry point
- `src/app.js` - Express application setup
- `src/config/env.js` - environment configuration
- `src/config/db.js` - PostgreSQL pool initialization
- `src/routes/` - route definitions
- `src/controllers/` - request handlers
- `src/middlewares/` - auth and validation middleware
- `src/models/` - database helpers
- `src/integrations/uniuni/` - UniUni shipment integration
- `src/workers/uninuiWorker.js` - background worker for shipment processing

## Routes

### Health

- `GET /api/health`
  - Checks database connectivity
  - Controller: `src/controllers/healthController.js`

### Authentication

- `POST /api/auth/register`
  - Registers a new user
  - Validates `full_name`, `email`, `password`
  - Middleware: `src/middlewares/validateUser.js`
  - Controller: `src/controllers/authController.js`

- `POST /api/auth/login`
  - Logs in a user
  - Returns `user` and `token`

- `POST /api/auth/logout`
  - Returns a logout confirmation message

### User

- `GET /api/users/me`
  - Returns authenticated user info from JWT
  - Middleware: `src/middlewares/authMiddleware.js`

### Products

- `GET /api/products`
  - Returns active products
  - Controller: `src/controllers/productController.js`

- `POST /api/products`
  - Creates a new product
  - Protected by auth and admin middleware
  - `src/middlewares/authMiddleware.js`
  - `src/middlewares/adMiddleware.js`

- `POST /api/admin/products`
  - Also creates a new product
  - Protected by auth and admin middleware
  - Controller logic is in `src/routes/adminRoutes.js`

### Orders

- `POST /api/orders/checkout`
  - Creates an order, payment record, and shipment record
  - Uses `src/controllers/orderController.js`
  - Requires authenticated user
  - Expects request body with `customer`, `cart`, `shipping`
  - Marks order as `paid` and shipment as `pending`

### Checkout / Stripe

- `POST /api/checkout/create-session`
  - Creates an order in the database and a Stripe Checkout session
  - Requires authenticated user
  - Expects `cartItems` and `shipping`
  - Creates `orders`, `order_items`, `shipments`
  - Returns `url` for Stripe checkout

- `GET /api/checkout/invoice/:sessionId`
  - Validates Stripe session payment status
  - Marks order as `paid`
  - Inserts Stripe payment record
  - Sends Telegram notification via `src/services/telegramService.js`

### Admin

- `GET /api/admin/orders`
  - Returns a list of all orders with customer info
  - Protected by auth + admin middleware

### Telegram (test)

- `GET /api/telegram-msg`
  - Sends a test Telegram notification
  - Uses `src/services/telegramService.js`

## Middleware

### `src/middlewares/authMiddleware.js`

- Reads `Authorization: Bearer <token>` header
- Verifies JWT using `JWT_SECRET`
- Loads user from database via `src/models/userModel.js`
- Attaches `req.user`
- Returns `401` if missing/invalid token or user not found

### `src/middlewares/adMiddleware.js`

- Checks `req.user.is_admin`
- Accepts `true`, `1`, or `'true'`
- Returns `403` if the user is not admin

### `src/middlewares/validateUser.js`

- Validates registration payload
- `full_name`: 3-20 alphanumeric chars
- `email`: valid email format
- `password`: min 8 chars, uppercase, lowercase, digit, special char

### `src/middlewares/errorHandler.js`

- Catches unhandled errors and returns `500`

## Data Model

Generated schema lives in `api/sql/schema.sql`.

### `users`
- `id`
- `full_name`
- `email`
- `password_hash`
- `created_at`
- `is_admin`

### `products`
- `id`
- `name`
- `description`
- `price_cents`
- `image_url`
- `is_active`
- `created_at`

### `orders`
- `id`
- `user_id`
- `total_cents`
- `status`
- `created_at`
- `shipping_full_name`
- `shipping_phone`
- `shipping_address1`
- `shipping_apartment`
- `shipping_city`
- `shipping_postal_code`
- `shipping_country`
- `shipping_status`
- `shipping_province`

### `order_items`
- `id`
- `order_id`
- `product_id`
- `quantity`
- `unit_price_cents`
- `subtotal_cents`

### `payments`
- `id`
- `order_id`
- `amount_cents`
- `provider`
- `provider_payment_id`
- `status`
- `created_at`

### `shipments`
- `id`
- `order_id`
- `carrier`
- `service_code`
- `external_shipment_id`
- `tracking_number`
- `label_url`
- `status`
- `last_error`
- `created_at`
- `updated_at`

## UniUni Integration

- `src/integrations/uniuni/uniuniClient.js` - Axios client for UniUni API
- `src/integrations/uniuni/uniuniMapper.js` - maps order data to UniUni payload
- `src/integrations/uniuni/uniuniService.js` - creates shipments, purchases shipments, retrieves labels
- `src/workers/uninuiWorker.js` - background worker that processes pending shipments when `UNIUNI_WORKER_ENABLED=true`

The worker:
- finds pending UniUni shipments for paid orders
- creates a shipment draft in UniUni
- optionally purchases shipment if `UNIUNI_AUTO_PURCHASE=true`
- optionally retrieves a label if `UNIUNI_AUTO_LABEL=true`
- updates DB status fields in `shipments` and `orders`

## Notes

- The backend combines a Stripe checkout flow and a separate `orderController` checkout flow.
- `src/models/productModel.js` contains a stock helper currently not used by routes.
- Admin endpoints require `is_admin` on the authenticated user record.

## Useful Files

- `src/app.js` - Express app and route mounting
- `src/index.js` - server startup and worker launch
- `src/config/db.js` - PostgreSQL pool
- `api/sql/schema.sql` - database schema
