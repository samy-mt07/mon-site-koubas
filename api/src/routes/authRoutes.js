const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const validateUser = require("../middlewares/validateUser");
const { register, login, logout } = authController;

// POST /auth/register
router.post("/register", validateUser, register);

// POST /auth/login
router.post("/login", login);

// POST /auth/logout
router.post("/logout", logout);

module.exports = router;
