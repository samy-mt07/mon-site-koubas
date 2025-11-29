const pool = require("../config/db");

async function decreaseStock(productId, quantity) {
  const query = `
    UPDATE products
    SET stock_quantity = stock_quantity - $1
    WHERE id = $2 AND stock_quantity >= $1
    RETURNING id, name, stock_quantity
  `;

  const result = await pool.query(query, [quantity, productId]);

  // si aucune ligne retournée = stock insuffisant
  return result.rows[0] || null;
}

module.exports = {
  decreaseStock,
};
