const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { getMe } = require("../controllers/userController");

console.log("authMiddleware type =", typeof authMiddleware);
console.log("getMe type =", typeof getMe);

// GET /users/me
router.get("/me", authMiddleware, getMe);

module.exports = router;
