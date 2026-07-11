// src/routes/product.route.js
const express = require("express");
const { getAllProducts, createProduct } = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adMiddleware");

const router = express.Router();

// GET /api/products
router.get("/products", getAllProducts);

// POST /api/products (admin only)
router.post("/products", authMiddleware, adminMiddleware, createProduct);

module.exports = router;
