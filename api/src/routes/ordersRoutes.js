const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middlewares/authMiddleware");

// GET /api/orders/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const ordersRes = await pool.query(
      `
      SELECT
        id,
        status,
        total_cents,
        created_at,
        shipping_status,
        shipping_full_name,
        shipping_phone,
        shipping_address1,
        shipping_apartment,
        shipping_city,
        shipping_province,
        shipping_postal_code,
        shipping_country
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    const orders = ordersRes.rows;

    if (orders.length === 0) {
      return res.json([]);
    }

    const orderIds = orders.map((o) => o.id);

    const itemsRes = await pool.query(
      `
      SELECT
        oi.order_id,
        COALESCE(p.name, 'Produit indisponible') AS name,
        oi.quantity,
        oi.unit_price_cents,
        oi.subtotal_cents
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ANY($1::bigint[])
      ORDER BY oi.id ASC
      `,
      [orderIds]
    );

    const itemsByOrderId = new Map();
    for (const item of itemsRes.rows) {
      const list = itemsByOrderId.get(item.order_id) || [];
      list.push({
        name: item.name,
        quantity: Number(item.quantity),
        unit_price_cents: Number(item.unit_price_cents),
        subtotal_cents: Number(item.subtotal_cents),
      });
      itemsByOrderId.set(item.order_id, list);
    }

    const result = orders.map((o) => ({
      id: o.id,
      status: o.status,
      total_cents: Number(o.total_cents),
      created_at: o.created_at,
      shipping_status: o.shipping_status,
      shippingAddress: {
        fullName: o.shipping_full_name,
        phone: o.shipping_phone,
        address1: o.shipping_address1,
        apartment: o.shipping_apartment,
        city: o.shipping_city,
        province: o.shipping_province,
        postalCode: o.shipping_postal_code,
        country: o.shipping_country,
      },
      items: itemsByOrderId.get(o.id) || [],
    }));

    res.json(result);
  } catch (err) {
    console.error("GET /orders/me error:", err);
    res.status(500).json({ error: "ORDERS_FETCH_FAILED" });
  }
});

module.exports = router;
