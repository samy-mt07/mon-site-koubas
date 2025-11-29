// api/src/routes/order.route.js
const express = require("express");
const { checkout } = require("../controllers/orderController");

const router = express.Router();

// POST /api/orders/checkout
router.post("/checkout", checkout);

module.exports = router;
