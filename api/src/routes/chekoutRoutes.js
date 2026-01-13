const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const pool = require("../config/db");
const authMiddleware = require("../middlewares/authMiddleware");
const telegramService = require("../services/telegramService");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/checkout/create-session
 * - crée order
 * - crée order_items
 * - crée shipment (pending)
 * - crée session Stripe
 */
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

    // 1️⃣ Charger les produits
    const productIds = cartItems.map((i) => i.id);
    const productsRes = await client.query(
      `SELECT * FROM products WHERE id = ANY($1::bigint[]) AND is_active = true`,
      [productIds]
    );

    if (productsRes.rows.length !== cartItems.length) {
      throw new Error("INVALID_PRODUCTS");
    }

    // 2️⃣ Calcul du total
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

    // 3️⃣ Créer la commande
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

    // 4️⃣ Créer les order_items
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

    // 5️⃣ Créer le shipment (UniUni → pending)
    await client.query(
      `
      INSERT INTO shipments (order_id, carrier, status)
      VALUES ($1,'uniuni','pending')
      `,
      [order.id]
    );

    // 6️⃣ Stripe session
    const session = await stripe.checkout.sessions.create({
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
    });

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



router.get("/invoice/:sessionId", async (req, res) => {
  const client = await pool.connect();

  try {
    const sessionId = String(req.params.sessionId || "").trim();

    // 1) Stripe: récupérer la session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({
        error: "PAYMENT_NOT_COMPLETED",
        payment_status: session.payment_status,
      });
    }

    // 2) metadata
    const orderId = Number(session.metadata?.order_id);
    if (!orderId) {
      return res.status(400).json({ error: "MISSING_ORDER_ID_IN_METADATA" });
    }

    await client.query("BEGIN");

    // 3) Anti-double: si déjà payé -> on renvoie ok
    const existingPayment = await client.query(
      `SELECT id FROM payments WHERE provider='stripe' AND provider_payment_id=$1 LIMIT 1`,
      [session.payment_intent]
    );

    if (existingPayment.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.json({ status: "ok", orderId, alreadyProcessed: true });
    }

    // 4) Update order
    await client.query(`UPDATE orders SET status='paid' WHERE id=$1`, [orderId]);

    // 5) Insert payment
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

// 🔔 Telegram
try {
  await telegramService.sendOrderNotification(orderId);
} catch (e) {
  console.warn("Telegram notification failed:", e.message);
}

res.json({ status: "ok", orderId });

  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}

    console.error("Invoice error:", err);

    return res.status(500).json({
      error: "INVOICE_FAILED",
      message: err.message,
      code: err.code,
      type: err.type,
    });
  } finally {
    client.release();
  }
});



module.exports = router;
