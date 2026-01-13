
// api/src/services/telegramService.js
const axios = require("axios");
const pool = require("../config/db");

function getTelegramCreds() {
  const token = process.env.TELEGRAM_BOT_TOKEN
    ? process.env.TELEGRAM_BOT_TOKEN.trim()
    : null;

  const chatId = process.env.TELEGRAM_CHAT_ID
    ? process.env.TELEGRAM_CHAT_ID.trim()
    : null;

  return { token, chatId };
}

async function sendTelegramMessage(text) {
  const { token, chatId } = getTelegramCreds();

  console.log("Telegram TOKEN present ?", !!token);
  console.log("Telegram CHAT_ID:", chatId);

  if (!token || !chatId) {
    console.error("TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant");
    return;
  }

  // ⚠️ Pas besoin de parse_mode Markdown ici (ton message n'utilise pas du vrai Markdown)
  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text,
  });
}

async function loadOrderForTelegram(orderId) {
  // 1) Order + user
  const orderRes = await pool.query(
    `
    SELECT
      o.id,
      o.total_cents,
      o.created_at,
      u.full_name,
      u.email
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE o.id = $1
    `,
    [orderId]
  );

  if (orderRes.rows.length === 0) return null;

  const o = orderRes.rows[0];

  // 2) Items
  const itemsRes = await pool.query(
    `
    SELECT
      COALESCE(p.name, 'Unknown product') AS name,
      oi.quantity,
      oi.unit_price_cents
    FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = $1
    ORDER BY oi.id ASC
    `,
    [orderId]
  );

  const items = itemsRes.rows.map((r) => ({
    name: r.name,
    quantity: Number(r.quantity),
    unit_price_cents: Number(r.unit_price_cents),
  }));

  return {
    id: Number(o.id),
    total_cents: Number(o.total_cents),
    created_at: o.created_at,
    user: { full_name: o.full_name, email: o.email },
    items,
  };
}

async function sendOrderNotification(orderId) {
  // ✅ Test sans orderId
  if (!orderId) {
    await sendTelegramMessage("🔥 Test notif KOUBAS depuis le backend !");
    console.log("Réponse Telegram (test): OK");
    return;
  }

  const order = await loadOrderForTelegram(orderId);

  if (!order) {
    await sendTelegramMessage(
      `🛒 Nouvelle commande\nOrder #${orderId}\n⚠️ Impossible de charger les détails depuis la DB.`
    );
    console.log("Réponse Telegram (order fallback): OK");
    return;
  }

  const total = (order.total_cents / 100).toFixed(2);

  const itemsText =
    order.items.length > 0
      ? order.items
          .map((it) => {
            const price = (it.unit_price_cents / 100).toFixed(2);
            return `• ${it.name} x${it.quantity} (${price}$)`;
          })
          .join("\n")
      : "(aucun article)";

  const message =
    `🛒 Nouvelle commande\n` +
    `Order: #${order.id}\n` +
    `Client: ${order.user.full_name}\n` +
    `Email: ${order.user.email}\n` +
    `Total: ${total}$\n` +
    `\n📦 Articles:\n${itemsText}\n` +
    `\n🕒 Date: ${new Date(order.created_at).toLocaleString("fr-CA")}`;

  try {
    await sendTelegramMessage(message);
    console.log("Réponse Telegram (order): OK");
  } catch (err) {
    console.error("Erreur envoi Telegram :", err.response?.data || err.message);
  }
}

module.exports = {
  sendOrderNotification,
};
