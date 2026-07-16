# Project: mon-site-koubas — perfume diffuser e-commerce site

Repo: https://github.com/samy-mt07/mon-site-koubas (branch: `dev`)

## What this is
An e-commerce site selling perfume diffusers. This is NOT a project starting from scratch — real code already exists for auth, cart, checkout, payments, and delivery. Read the existing code before making changes. Do not re-architect or rewrite working systems unless explicitly asked.

## Tech stack (confirmed from the repo)
- **Frontend**: `front/` — Vite + React 19 (plain JSX, NOT Next.js — no app router, no server components). Uses `react-router-dom`, `react-bootstrap`/`bootstrap` for UI, `axios` for HTTP. Last touched ~5 days ago, so this is the most recently active part of the codebase.
- **Backend**: `api/` — Node.js + Express 5. Uses `pg` (raw PostgreSQL client, no ORM), `jsonwebtoken` + `bcrypt`/`bcryptjs` for auth, `stripe`, `axios` (for UniUni + Telegram HTTP calls), `dotenv`.
- **Database**: PostgreSQL. Schema lives in `api/sql/schema.sql`. Tables: `users` (has `is_admin` flag), `products`, `orders` (has `shipping_*` columns + `shipping_status`), `order_items`, `payments`, `shipments` (tracks UniUni carrier status).
- **Payments**: Stripe Checkout Sessions.
- **Delivery**: UniUni API (`api/src/integrations/uniuni/`), driven by a background worker.
- **Notifications**: Telegram bot, sends the owner a message per order.

## The REAL order flow (as implemented in code — read this carefully, it's more complex than "checkout → done")

1. User can browse products without an account.
2. User adds to cart (frontend cart state).
3. **Checkout — real path**: `POST /api/checkout/create-session` (in `api/src/routes/chekoutRoutes.js`, note the typo in the filename) does the following in one DB transaction:
   - Creates the `orders` row with `status = 'pending'` and the shipping address fields.
   - Creates `order_items` rows.
   - Creates a `shipments` row with `carrier = 'uniuni'`, `status = 'pending'` (NOT yet sent to UniUni).
   - Creates a real Stripe Checkout Session and returns its URL.
4. User pays on Stripe's hosted page, gets redirected to `success_url` (`{FRONTEND_URL}/success?session_id=...`).
5. The success page must call `GET /api/checkout/invoice/:sessionId`, which:
   - Verifies the session with Stripe (`payment_status === 'paid'`).
   - Updates `orders.status = 'paid'`.
   - Inserts a `payments` row (`provider = 'stripe'`, `status = 'succeeded'`).
   - Sends the Telegram order notification (`telegramService.sendOrderNotification`).
6. **Separately**, a background worker (`api/src/workers/uniuniWorker.js`) polls the DB every `UNIUNI_WORKER_INTERVAL_MS` (default 15s) — only runs if `UNIUNI_WORKER_ENABLED=true`. It picks one `shipments` row where `status = 'pending'` AND the parent order is `status = 'paid'`, then calls the UniUni API to create a draft shipment, and (if `UNIUNI_AUTO_PURCHASE`/`UNIUNI_AUTO_LABEL` are enabled) purchases the label automatically. This is async and decoupled from the checkout request itself — UniUni is NOT called synchronously at checkout.

## ⚠️ Known issues found in the code (flag these, don't silently "fix" without confirming with the owner)

1. **The cart/checkout button on the frontend does NOT call the real Stripe flow.** In `front/src/components/layout/Navbar.jsx`, the cart button currently calls `POST /api/orders/checkout` — a separate, older endpoint (`api/src/controllers/orderController.js` → `api/src/routes/order.route.js`) that:
   - Creates a **fake/mock payment** (`provider: "mock-provider"`, `status: "succeeded"`) without ever touching Stripe.
   - Marks the order `status = 'paid'` immediately.
   - Sends hardcoded placeholder shipping info ("Client", "1 rue de test", etc.) instead of real customer data.
   - Has **no auth middleware** attached in the route file, though the controller checks `req.user` internally.
   This looks like leftover test/dev code. The real, working Stripe flow (`/api/checkout/create-session`) exists in the backend but the frontend isn't wired to it yet. **This is very likely the actual next task**, not a "finished" checkout.

2. **Hardcoded DB password fallback** in `api/src/config/env.js`: `password: process.env.PGPASSWORD || "263674"`. This is a real secret sitting in a public GitHub repo. Should be removed (no hardcoded fallback for secrets) regardless of whether it's still the live password.

3. **UniUni shipments use a static/hardcoded address**, not the customer's real shipping address entered at checkout — there's a French comment in `uniuniWorker.js` itself flagging this as a pre-production TODO (`uniuniMapper.js` is where the address mapping happens).

4. `.env` is properly gitignored in both `api/` and `front/` — no real secrets are committed. But per the owner: this project hasn't been actively worked on in ~6 months, so treat current `.env` values (Stripe keys, UniUni token, Telegram token, DB creds) as **possibly stale/expired** until verified.

## Environment variables the backend expects (from reading the code — verify actual values with the owner)
- `PORT` (default 4000)
- `JWT_SECRET`
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
- `STRIPE_SECRET_KEY`
- `FRONTEND_URL` (used for Stripe success/cancel redirect URLs)
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `UNIUNI_BASE_URL`, `UNIUNI_ACCESS_TOKEN`
- `UNIUNI_WORKER_ENABLED`, `UNIUNI_WORKER_INTERVAL_MS`, `UNIUNI_AUTO_PURCHASE`, `UNIUNI_AUTO_LABEL`, `UNIUNI_STEP_MAX_ATTEMPTS`, `UNIUNI_STEP_RETRY_DELAY_MS`

## What's NOT done yet / next steps
> Paste your FocusTasks to-do list items here, one by one, so Claude Code knows the actual build order. Given what the code shows, wiring the frontend to the real `/api/checkout/create-session` + `/api/checkout/success` flow (instead of the mock endpoint) is likely priority #1 — confirm with the owner before assuming.
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Working instructions for Claude Code
- Always read relevant existing files before writing new code — don't assume, verify in the codebase.
- Don't modify the Stripe → invoice → UniUni worker flow unless the task explicitly requires it.
- Before "fixing" the mock checkout endpoint or the hardcoded password, confirm with the owner what they want done — don't silently delete/replace code.
- Ask before introducing new libraries/frameworks not already in use.
- Keep changes scoped to the task at hand; flag (but don't silently fix) unrelated issues you notice.
