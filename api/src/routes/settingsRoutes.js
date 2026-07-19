// src/routes/settingsRoutes.js
const express = require("express");
const router = express.Router();
const { getFreeDelivery } = require("../services/settingsStore");

// GET /api/settings — public
router.get("/", (req, res) => {
  res.json({ freeDelivery: getFreeDelivery() });
});

module.exports = router;
