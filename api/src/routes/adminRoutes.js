const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adMiddleware");

// GET /api/admin/orders
router.get("/orders", auth, admin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.id,
             o.total_cents,
             o.status,
             o.created_at,
             u.full_name,
             u.email
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("ADMIN orders error:", err);
    res.status(500).json({ error: "DB_ERROR" });
  }
});

// POST /api/admin/products
router.post("/products", auth, admin, async (req, res) => {
  try {
    const {
      name,
      description,
      price_cents,
      image_url,
      is_active = true,
    } = req.body;

    if (!name || price_cents === undefined || price_cents === null) {
      return res.status(400).json({ error: "NAME_AND_PRICE_REQUIRED" });
    }

    const parsedPrice = Number(price_cents);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: "INVALID_PRICE" });
    }

    const result = await pool.query(
      `
        INSERT INTO products (name, description, price_cents, image_url, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, description, price_cents, image_url, is_active, created_at
      `,
      [name, description || null, parsedPrice, image_url || null, is_active]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("ADMIN create product error:", err);
    res.status(500).json({ error: "DB_ERROR" });
  }
});

module.exports = router;
