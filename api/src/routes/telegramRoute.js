// src/routes/telegramRoute.js
const express = require("express");
const router = express.Router();
const { sendOrderNotification } = require("../services/telegramService");

router.get("/telegram-msg", async (req, res) => {
  try {
    await sendOrderNotification(); // appelé SANS order → message simple
    res.json({ ok: true, message: "Notification Telegram envoyée" });
  } catch (err) {
    console.error(
      "Erreur sendOrderNotification:",
      err.response?.data || err.message
    );
    res.status(500).json({
      ok: false,
      message: "Erreur envoi Telegram",
      details: err.response?.data || err.message,
    });
  }
});

module.exports = router;
