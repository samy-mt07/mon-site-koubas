// src/models/productModel.js
const pool = require("../config/db");

// Diminue le stock d'un produit (si assez de stock)
async function decreaseStock(productId, quantity) {
  const query = `
    UPDATE products
    SET stock_quantity = stock_quantity - $1
    WHERE id = $2 AND stock_quantity >= $1
    RETURNING id, name, stock_quantity
  `;
  const values = [quantity, productId];

  const result = await pool.query(query, values);
  return result.rows[0] || null; // null = pas assez de stock
}

module.exports = {
  decreaseStock,
};
