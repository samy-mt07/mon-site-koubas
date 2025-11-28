// src/controllers/healthController.js
const pool = require("../config/db");

async function healthCheck(req, res) {
  try {
    const result = await pool.query("SELECT NOW() AS now");

    res.json({
      status: "ok",
      dbTime: result.rows[0].now,
    });
  } catch (err) {
    console.error("Erreur dans healthCheck :", err);
    res.status(500).json({
      status: "error",
      message: "DB not reachable",
    });
  }
}

module.exports = { healthCheck };
