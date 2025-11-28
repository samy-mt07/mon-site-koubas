// src/routes/product.route.js
const express = require("express");
const { getAllProducts } = require("../controllers/productController");

const router = express.Router();

// GET /api/products
router.get("/products", getAllProducts);

module.exports = router;
