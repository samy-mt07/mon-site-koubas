// src/routes/checkoutRoutes.js
const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const authMiddleware = require("../middlewares/authMiddleware");
const { decreaseStock } = require("../models/productModel");
const pool = require("../config/db");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-session", authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    // items = [{ name, price, quantity }], price en dollars (ex: 24.99)

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "NO_ITEMS" });
    }

    const lineItems = items.map((item) => {
      return {
        price_data: {
          currency: "cad", // ou "usd"
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100), // 24.99 => 2499
        },
        quantity: item.quantity,
      };
    });
    console.log("SUCCESS URL =", process.env.STRIPE_SUCCESS_URL);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      customer_email: req.user.email, // optionnel, si tu as l'email dans le token
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error", err);
    res.status(500).json({ error: "STRIPE_ERROR" });
  }
});

// GET /api/checkout/invoice/:sessionId
// -> crée la commande, order_items, payment et diminue le stock
router.get("/invoice/:sessionId", authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // 1) Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ error: "PAYMENT_NOT_PAID" });
    }

    // 2) Vérifier si un paiement existe déjà pour cette session
    const paymentCheck = await pool.query(
      "SELECT * FROM payments WHERE provider = 'stripe' AND provider_payment_id = $1",
      [sessionId]
    );

    let order;
    let items = [];

    if (paymentCheck.rows.length > 0) {
      // Paiement existe déjà -> on récupère juste la commande + items
      const existingPayment = paymentCheck.rows[0];

      const orderResult = await pool.query(
        "SELECT * FROM orders WHERE id = $1",
        [existingPayment.order_id]
      );
      order = orderResult.rows[0];

      const itemsResult = await pool.query(
        "SELECT * FROM order_items WHERE order_id = $1",
        [order.id]
      );
      items = itemsResult.rows;

      return res.json({ order, items });
    }

    // 3) Récupérer les lignes Stripe
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 100,
    });

    const totalCents = session.amount_total;
    const userId = req.user.id;

    // 4) Créer la commande
    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, total_cents, status)
       VALUES ($1, $2, 'paid')
       RETURNING id, user_id, total_cents, status, created_at`,
      [userId, totalCents]
    );
    order = orderResult.rows[0];

    // 5) Créer les order_items et diminuer le stock
    for (const li of lineItems.data) {
      const quantity = li.quantity;
      const subtotalCents = li.amount_subtotal;
      const unitPriceCents = Math.round(subtotalCents / quantity);
      const productName = li.description; // le name défini dans create-session

      // retrouver le produit par son nom
      const productResult = await pool.query(
        "SELECT id FROM products WHERE name = $1 LIMIT 1",
        [productName]
      );

      let productId = null;

      if (productResult.rows.length > 0) {
        productId = productResult.rows[0].id;

        // 🔥 décrémenter le stock
        const updated = await decreaseStock(productId, quantity);
        if (!updated) {
          console.error(
            "Stock insuffisant pour le produit",
            productId,
            productName
          );
          // ici on log seulement; tu peux plus tard gérer mieux
        }
      }

      // insérer la ligne de commande
      const itemResult = await pool.query(
        `INSERT INTO order_items
          (order_id, product_id, quantity, unit_price_cents, subtotal_cents)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, product_id, quantity, unit_price_cents, subtotal_cents`,
        [order.id, productId, quantity, unitPriceCents, subtotalCents]
      );

      items.push(itemResult.rows[0]);
    }

    // 6) Enregistrer le paiement
    await pool.query(
      `INSERT INTO payments
        (order_id, amount_cents, provider, provider_payment_id, status)
       VALUES ($1, $2, 'stripe', $3, 'succeeded')`,
      [order.id, totalCents, sessionId]
    );

    return res.json({ order, items });
  } catch (err) {
    console.error("Invoice error", err);
    return res.status(500).json({ error: "INVOICE_ERROR" });
  }
});

module.exports = router;
