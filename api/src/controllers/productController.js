const pool = require("../config/db");

async function getAllProducts(res, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, name, description, price_cents, image_url, is_active, created_at
             FROM products
             WHERE is_active = TRUE
             ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur getAllProducts :", err);
    next(err); // sera géré par errorHandler
  }
}

module.exports = { getAllProducts };
