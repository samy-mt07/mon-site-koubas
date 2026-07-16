# UniUni Decoupling — 2026-07-16

Part of tonight's pre-production backend lockdown. This documents exactly what changed to
take UniUni out of the live request path, what was deliberately left alone, what the
resulting shipments backlog means, and a reconnection plan for a future session.

## What changed

One line, in `api/.env`:

```diff
- UNIUNI_WORKER_ENABLED=true
+ UNIUNI_WORKER_ENABLED=false
```

No source file was touched. In particular:

- `api/src/workers/uninuiWorker.js` — unchanged
- `api/src/integrations/uniuni/uniuniClient.js` — unchanged
- `api/src/integrations/uniuni/uniuniService.js` — unchanged
- `api/src/integrations/uniuni/uniuniMapper.js` — unchanged
- `shipments` table / schema — unchanged
- The checkout flow (`api/src/routes/chekoutRoutes.js`) still inserts a `shipments` row
  (`carrier='uniuni'`, `status='pending'`) for every order, exactly as before.

## Why this is enough to fully isolate UniUni

Grepped `api/src` for every file that imports `uniuniService`, `uniuniClient`, or
`uniuniMapper`. The only hit outside the `integrations/uniuni/` folder itself is
`api/src/workers/uninuiWorker.js`. No route or controller calls the UniUni service
directly. `api/src/index.js` only calls `startUniUniWorker()` when
`UNIUNI_WORKER_ENABLED === "true"`, and `startUniUniWorker()` re-checks the same flag
itself before starting its `setInterval`. So flipping that one env var is a complete kill
switch — there is exactly one gated entry point into UniUni, and it's now closed.

## Verification performed

- Restarted the server with `UNIUNI_WORKER_ENABLED=false`. Startup log no longer prints
  `[UniUniWorker] started (interval=...)` — the worker never spins up.
- Called the real Stripe checkout flow (`POST /api/checkout/create-session`) — it still
  created a `shipments` row (`id=2`) with `status='pending'`, `external_shipment_id` NULL,
  same as always.
- Left the server running and re-checked its log afterward — zero `[UniUniWorker]` lines,
  zero outbound calls to UniUni.

## What the pending-shipments backlog means

Every order created through the real checkout flow gets a `shipments` row the moment the
order is created — this happens in the same DB transaction, independent of whether the
UniUni worker is running. With the worker disabled, these rows simply accumulate,
untouched:

```
 id | order_id | status  | order_status |          created_at
----+----------+---------+--------------+-------------------------------
  1 |        1 | pending | pending      | 2026-07-16 17:33:11.997749-04
  2 |        2 | pending | pending      | 2026-07-16 18:43:20.821154-04
```

This is the intended design, not a leak: the worker's pickup query
(`uninuiWorker.js` → `processOnePendingShipment`) is exactly
`WHERE carrier='uniuni' AND status='pending' AND order.status='paid'`, using
`FOR UPDATE SKIP LOCKED`. `shipments` doubles as a durable work queue. Note both rows
above are attached to orders still in `status='pending'` (never paid, since this was
testing) — so even with the worker re-enabled, neither would be picked up yet. The queue
only drains orders that actually got paid.

## Reconnection plan (for a future session — not done tonight)

1. **Re-verify the sandbox token.** `UNIUNI_ACCESS_TOKEN` was confirmed valid tonight via
   a direct `POST /shipments/create` to the sandbox (distinguishable from an
   invalid-token response — see below) — but tokens can be rotated/revoked, so re-check
   before trusting it in a later session.
2. **Resolve the sandbox address-validation error** (see next section) before assuming a
   test run proves the pipeline works end to end.
3. **Close the `shipping_email` gap.** `orders` has no `shipping_email` column, so
   `uniuniMapper.js`'s `recipient.email` falls back to `"test@example.com"` for *every*
   order, real or not. Fixing this needs a schema change (new column + wiring it through
   checkout) — explicitly out of scope tonight per the no-schema-changes rule.
4. Set `UNIUNI_WORKER_ENABLED=true` in `api/.env`.
5. Restart the server; confirm the log shows `[UniUniWorker] started (interval=...)`.
6. `UNIUNI_AUTO_PURCHASE` and `UNIUNI_AUTO_LABEL` are both currently unset (default
   `false`) — decide those separately before enabling, since they trigger real
   label-purchase actions on UniUni's side, not just draft creation.
7. Test against a single paid order first (not the whole backlog blind) and watch
   `shipments.last_error` / `orders.shipping_status` before trusting it unattended.

## Mapper vs. code comment — a discrepancy worth knowing about

`uninuiWorker.js` carries this comment above the `createShipment` call:

> 🔥 NOTE PROD : Aujourd'hui le mapper UniUni utilise une adresse statique. En
> production: on doit prendre l'adresse du client au checkout et l'envoyer à UniUni.

Reading `uniuniMapper.js` directly, this appears stale: it already reads
`order.shipping_full_name`, `shipping_phone`, `shipping_address1`, `shipping_city`,
`shipping_province`, `shipping_postal_code`, and `shipping_country` off the order row,
falling back to a static address only when a field is empty. Orders created through the
real Stripe checkout (`chekoutRoutes.js`) always populate those fields — they're required
at checkout — so real orders should already reach UniUni with real shipping data. Worth
confirming with a real end-to-end order before fully trusting this, but the code doesn't
match the comment's claim as written.

## UniUni sandbox address error — findings from live testing tonight

A direct `POST` to `https://api-sandbox.ship.uniuni.com/client/shipments/create` using
the exact static fallback address (`2455 Meadowvale Blvd`, Montreal, QC, `H2X 1Y4`, CA)
returned:

```json
{"message":"No available postage type: The address is not valid, please check the address information","code":1009,"data":null}
```

Ruled out tonight:
- **Token validity** — a deliberately garbage token gets a different, distinct message
  (`"Invalid or revoked access token"`). The real token clearly authenticates.
- **Postage type** — tried both `STANDARD` and the `.env`-configured `OTHER`, identical
  error either way.
- **Postal code formatting** — with and without the space (`H2X 1Y4` vs `H2X1Y4`),
  identical error.

Not yet tested, and the most likely lead: **`2455 Meadowvale Blvd` is a real street in
Mississauga, Ontario — not Montreal, Quebec.** The static fallback pairs a real Ontario
civic address with a Quebec city/province, which a geocoding-backed validator would
reject as inconsistent. Try a real, internally-consistent address (ideally one entered by
an actual customer at checkout, per the mapper's real intent) before concluding the
sandbox account itself is misconfigured.

## Files touched tonight (UniUni-related)

- `api/.env` — `UNIUNI_WORKER_ENABLED`: `true` → `false`

That's the entire diff. `api/src/workers/`, `api/src/integrations/uniuni/`, and the
`shipments` table were not modified.
