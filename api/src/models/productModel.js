// src/models/productModel.js
const pool = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const IMAGES_DIR = path.join(__dirname, "../../../front/public/images");

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("INVALID_FILE_TYPE"));
    }
    cb(null, true);
  },
});
// Diminue le stock d'un produit (si assez de stock)
async function decreaseStock(productId, quantity, client = pool) {
  const query = `
    UPDATE products
    SET stock_quantity = stock_quantity - $1
    WHERE id = $2 AND stock_quantity >= $1
    RETURNING id, name, stock_quantity
  `;
  const values = [quantity, productId];

  const result = await client.query(query, values);
  return result.rows[0] || null; // null = pas assez de stock
}

module.exports = {
  decreaseStock,
  upload,
};