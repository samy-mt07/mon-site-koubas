const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const pool = require("../config/db");
const authMiddleware = require("../middlewares/authMiddleware");
const telegramService = require("../services/telegramService");
const { sendOrderConfirmationEmail } = require("../services/emailService");

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/**
 * Charge une commande payée pour l'email de confirmation.
 * Même source que loadOrderForTelegram (telegramService.js) pour l'adresse :
 * les colonnes shipping_* sont directement sur orders, il n'y a pas d'autre
 * table pour ça.
 */
async function loadOrderForConfirmationEmail(orderId) {
  const orderRes = await pool.query(
    `
    SELECT
      o.id,
      o.total_cents,
      o.shipping_full_name,
      o.shipping_address1,
      o.shipping_apartment,
      o.shipping_city,
      o.shipping_province,
      o.shipping_postal_code,
      o.shipping_country,
      u.email
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE o.id = $1
    `,
    [orderId]
  );

  if (orderRes.rows.length === 0) return null;

  const o = orderRes.rows[0];

  const itemsRes = await pool.query(
    `
    SELECT
      COALESCE(p.name, 'Unknown product') AS name,
      oi.quantity,
      oi.unit_price_cents
    FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = $1
    ORDER BY oi.id ASC
    `,
    [orderId]
  );

  const items = itemsRes.rows.map((r) => ({
    name: r.name,
    quantity: Number(r.quantity),
    price: (Number(r.unit_price_cents) / 100).toFixed(2),
  }));

  const addressLine = [o.shipping_address1, o.shipping_apartment]
    .filter(Boolean)
    .join(", ");

  const shippingAddress = [
    o.shipping_full_name,
    addressLine,
    [o.shipping_city, o.shipping_province, o.shipping_postal_code]
      .filter(Boolean)
      .join(" "),
    o.shipping_country,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    email: o.email,
    order: {
      id: Number(o.id),
      items,
      total: (Number(o.total_cents) / 100).toFixed(2),
      shippingAddress,
    },
  };
}

router.post("/create-session", authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    const { cartItems, shipping } = req.body;
    const userId = req.user.id;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "EMPTY_CART" });
    }

    if (
      !shipping ||
      !shipping.fullName ||
      !shipping.phone ||
      !shipping.address1 ||
      !shipping.city ||
      !shipping.postalCode
    ) {
      return res.status(400).json({ error: "MISSING_SHIPPING_INFO" });
    }

    await client.query("BEGIN");

    // Charger les produits
    const productIds = cartItems.map((i) => i.id);
    const productsRes = await client.query(
      `SELECT * FROM products WHERE id = ANY($1::bigint[]) AND is_active = true`,
      [productIds]
    );

    if (productsRes.rows.length !== cartItems.length) {
      throw new Error("INVALID_PRODUCTS");
    }

    // Calcul du total
    let totalCents = 0;
    const itemsMap = new Map();

    for (const product of productsRes.rows) {
      const item = cartItems.find((i) => Number(i.id) === Number(product.id));

      if (!item) {
        throw new Error(`CART_ITEM_NOT_FOUND_FOR_PRODUCT_${product.id}`);
      }

      if (!item.quantity || Number(item.quantity) <= 0) {
        throw new Error(`INVALID_QUANTITY_FOR_PRODUCT_${product.id}`);
      }

      const subtotal = product.price_cents * item.quantity;
      totalCents += subtotal;

      itemsMap.set(product.id, {
        product,
        quantity: item.quantity,
        subtotal,
      });
    }

    // Créer la commande
    const orderRes = await client.query(
      `
      INSERT INTO orders (
        user_id,
        total_cents,
        status,
        shipping_full_name,
        shipping_phone,
        shipping_address1,
        shipping_apartment,
        shipping_city,
        shipping_postal_code,
        shipping_country,
        shipping_status
      )
      VALUES ($1,$2,'pending',$3,$4,$5,$6,$7,$8,$9,'pending_shipment')
      RETURNING *
      `,
      [
        userId,
        totalCents,
        shipping.fullName,
        shipping.phone,
        shipping.address1,
        shipping.apartment || null,
        shipping.city,
        shipping.postalCode,
        shipping.country || "Canada",
      ]
    );

    const order = orderRes.rows[0];

    // Créer les order_items
    for (const { product, quantity, subtotal } of itemsMap.values()) {
      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          quantity,
          unit_price_cents,
          subtotal_cents
        )
        VALUES ($1,$2,$3,$4,$5)
        `,
        [order.id, product.id, quantity, product.price_cents, subtotal]
      );
    }

    // Créer le shipment (UniUni → pending)
    await client.query(
      `
      INSERT INTO shipments (order_id, carrier, status)
      VALUES ($1,'uniuni','pending')
      `,
      [order.id]
    );

    if (!stripe) {
      throw new Error("STRIPE_NOT_CONFIGURED");
    }

    // Stripe session — idempotency key basée sur order.id pour éviter
    // les doubles sessions si le front retry (timeout réseau, double-click, etc.)
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: productsRes.rows.map((p) => {
          const item = cartItems.find((i) => Number(i.id) === Number(p.id));

          if (!item) {
            throw new Error(`CART_ITEM_NOT_FOUND_FOR_PRODUCT_${p.id}`);
          }

          if (!item.quantity || Number(item.quantity) <= 0) {
            throw new Error(`INVALID_QUANTITY_FOR_PRODUCT_${p.id}`);
          }

          return {
            price_data: {
              currency: "cad",
              product_data: { name: p.name },
              unit_amount: p.price_cents,
            },
            quantity: Number(item.quantity),
          };
        }),
        success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/cancel`,
        metadata: {
          order_id: order.id.toString(),
          user_id: userId.toString(),
        },
      },
      {
        idempotencyKey: `checkout-order-${order.id}`,
      }
    );

    await client.query("COMMIT");

    res.json({ url: session.url });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Checkout error:", err);
    res.status(500).json({ error: "CHECKOUT_FAILED" });
  } finally {
    client.release();
  }
});

/**
 * GET /api/checkout/invoice/:sessionId
 * Confirmation rapide côté client après redirect Stripe.
 * Reste utile pour l'UX (afficher direct "commande confirmée"),
 * mais N'EST PLUS la source de vérité — c'est le webhook qui l'est.
 */
router.get("/invoice/:sessionId", async (req, res) => {
  try {
    const sessionId = String(req.params.sessionId || "").trim();

    if (!stripe) {
      return res.status(503).json({ error: "STRIPE_NOT_CONFIGURED" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({
        error: "PAYMENT_NOT_COMPLETED",
        payment_status: session.payment_status,
      });
    }

    const orderId = Number(session.metadata?.order_id);
    if (!orderId) {
      return res.status(400).json({ error: "MISSING_ORDER_ID_IN_METADATA" });
    }

    // On ne fait plus l'update ici — le webhook s'en charge déjà
    // (ou s'en chargera dans les secondes qui suivent). On lit juste l'état.
    const orderRes = await pool.query(`SELECT status FROM orders WHERE id=$1`, [orderId]);

    res.json({
      status: "ok",
      orderId,
      orderStatus: orderRes.rows[0]?.status || "pending",
    });
  } catch (err) {
    console.error("Invoice error:", err);
    return res.status(500).json({ error: "INVOICE_FAILED" });
  }
});

/**
 * POST /api/checkout/webhook
 * Source de vérité pour la confirmation de paiement.
 * ⚠️ Doit recevoir le RAW body (pas express.json()) — voir app.js.
 */
router.post("/webhook", async (req, res) => {
    console.log("🔔 WEBHOOK HIT"); // ← ajoute ça en tout premier

  if (!stripe) {
    return res.status(503).send("STRIPE_NOT_CONFIGURED");
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // doit être le raw Buffer, pas du JSON parsé
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type !== "checkout.session.completed") {
    // On accuse réception mais on ignore les events qu'on ne traite pas
    return res.json({ received: true });
  }

  const session = event.data.object;
  const client = await pool.connect();

  try {
    const orderId = Number(session.metadata?.order_id);
    if (!orderId) {
      console.error("Webhook: MISSING_ORDER_ID_IN_METADATA", session.id);
      return res.status(400).send("MISSING_ORDER_ID_IN_METADATA");
    }

    await client.query("BEGIN");

    // Anti-double: si déjà payé -> on renvoie ok sans rien refaire
    const existingPayment = await client.query(
      `SELECT id FROM payments WHERE provider='stripe' AND provider_payment_id=$1 LIMIT 1`,
      [session.payment_intent]
    );

    if (existingPayment.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.json({ received: true, alreadyProcessed: true });
    }

    await client.query(`UPDATE orders SET status='paid' WHERE id=$1`, [orderId]);

    await client.query(
      `
      INSERT INTO payments (
        order_id,
        amount_cents,
        provider,
        provider_payment_id,
        status
      )
      VALUES ($1,$2,'stripe',$3,'succeeded')
      `,
      [orderId, Number(session.amount_total || 0), session.payment_intent]
    );

    await client.query("COMMIT");
    console.log("✅ Webhook: payment saved, calling Telegram for order", orderId); // ← ajoute ça


    try {
      await telegramService.sendOrderNotification(orderId);
    } catch (e) {
      console.warn("Telegram notification failed:", e.message);
    }

    try {
      const confirmation = await loadOrderForConfirmationEmail(orderId);
      if (confirmation) {
        await sendOrderConfirmationEmail(confirmation.email, confirmation.order);
      }
    } catch (e) {
      console.warn("Order confirmation email failed:", e.message);
    }

    res.json({ received: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Webhook handler error:", err);
    res.status(500).send("WEBHOOK_HANDLER_FAILED");
  } finally {
    client.release();
  }
});

module.exports = router;