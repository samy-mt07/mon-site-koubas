const pool = require("../config/db");

async function getAllProducts(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, name, description, price_cents, image_url, is_active, stock_quantity, created_at
             FROM products
             WHERE is_active = TRUE
             ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur getAllProducts :", err);
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const {
      name,
      description,
      price_cents,
      image_url,
      is_active = true,
    } = req.body;

    if (!name || !price_cents) {
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
    console.error("Erreur createProduct :", err);
    next(err);
  }
}

module.exports = { getAllProducts, createProduct };
