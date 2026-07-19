const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adMiddleware");
const { upload } = require("../models/productModel");
const { setFreeDelivery } = require("../services/settingsStore");

// GET /api/admin/orders
router.get("/orders", auth, admin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.id,
             o.total_cents,
             o.status,
             o.created_at,
             u.full_name,
             u.email,
             o.shipping_full_name,
             o.shipping_phone,
             o.shipping_address1,
             o.shipping_apartment,
             o.shipping_city,
             o.shipping_postal_code,
             o.shipping_country,
             o.shipping_province,
             o.shipping_status
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
      stock_quantity,
    } = req.body;

    if (!name || price_cents === undefined || price_cents === null) {
      return res.status(400).json({ error: "NAME_AND_PRICE_REQUIRED" });
    }

    const parsedPrice = Number(price_cents);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: "INVALID_PRICE" });
    }

    let parsedStock = 0;
    if (stock_quantity !== undefined && stock_quantity !== null && stock_quantity !== "") {
      parsedStock = Number(stock_quantity);
      if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ error: "INVALID_STOCK_QUANTITY" });
      }
    }

    const result = await pool.query(
      `
        INSERT INTO products (name, description, price_cents, image_url, is_active, stock_quantity)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, description, price_cents, image_url, is_active, stock_quantity, created_at
      `,
      [name, description || null, parsedPrice, image_url || null, is_active, parsedStock]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("ADMIN create product error:", err);
    res.status(500).json({ error: "DB_ERROR" });
  }
});

// POST /api/admin/upload
router.post("/upload", auth, admin, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "NO_FILE" });
  }
  res.status(201).json({ image_url: `/images/${req.file.filename}` });
});


// DELETE /api/admin/orders/:id
router.delete("/orders/:id", auth, admin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM orders WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "ORDER_NOT_FOUND" });
    }

    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error("ADMIN delete order error:", err);
    res.status(500).json({ error: "DB_ERROR" });
  }
});

// GET /api/admin/products
router.get("/products", auth, admin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description, price_cents, image_url, is_active, stock_quantity, created_at
      FROM products
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("ADMIN list products error:", err);
    res.status(500).json({ error: "DB_ERROR" });
  }
});

// PUT /api/admin/products/:id
router.put("/products/:id", auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price_cents, image_url, is_active, stock_quantity } = req.body;

    if (!name || price_cents === undefined || price_cents === null) {
      return res.status(400).json({ error: "NAME_AND_PRICE_REQUIRED" });
    }

    const parsedPrice = Number(price_cents);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: "INVALID_PRICE" });
    }

    let parsedStock = 0;
    if (stock_quantity !== undefined && stock_quantity !== null && stock_quantity !== "") {
      parsedStock = Number(stock_quantity);
      if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ error: "INVALID_STOCK_QUANTITY" });
      }
    }

    const result = await pool.query(
      `
        UPDATE products
        SET name = $1, description = $2, price_cents = $3, image_url = $4, is_active = $5, stock_quantity = $6
        WHERE id = $7
        RETURNING id, name, description, price_cents, image_url, is_active, stock_quantity, created_at
      `,
      [name, description || null, parsedPrice, image_url || null, is_active, parsedStock, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "PRODUCT_NOT_FOUND" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("ADMIN update product error:", err);
    res.status(500).json({ error: "DB_ERROR" });
  }
});

// DELETE /api/admin/products/:id
router.delete("/products/:id", auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM products WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "PRODUCT_NOT_FOUND" });
    }
    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error("ADMIN delete product error:", err);
    res.status(500).json({ error: "DB_ERROR" });
  }
});

// PATCH /api/admin/settings/free-delivery
router.patch("/settings/free-delivery", auth, admin, (req, res) => {
  const { enabled } = req.body;

  if (typeof enabled !== "boolean") {
    return res.status(400).json({ error: "INVALID_ENABLED_VALUE" });
  }

  const freeDelivery = setFreeDelivery(enabled);
  res.json({ freeDelivery });
});

module.exports = router;
