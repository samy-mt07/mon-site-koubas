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

module.exports = router;
