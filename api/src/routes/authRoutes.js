const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const validateUser = require("../middlewares/validateUser");
const passport = require("../config/passport");
const { register, login, logout, verifyEmail, resendCode, googleCallback } =
  authController;

// POST /auth/register
router.post("/register", validateUser, register);

// POST /auth/login
router.post("/login", login);

// POST /auth/logout
router.post("/logout", logout);

// POST /auth/verify-email
router.post("/verify-email", verifyEmail);

// POST /auth/resend-code
router.post("/resend-code", resendCode);

// GET /auth/google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// GET /auth/google/callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/?googleAuthError=1`,
  }),
  googleCallback
);

module.exports = router;
