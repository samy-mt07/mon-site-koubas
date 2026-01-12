// api/src/services/telegramService.js
const axios = require("axios");

async function sendOrderNotification(order) {
  const rawToken = process.env.TELEGRAM_BOT_TOKEN;
  const rawChatId = process.env.TELEGRAM_CHAT_ID;

  const token = rawToken ? rawToken.trim() : null;
  const chatId = rawChatId ? rawChatId.trim() : null;

  console.log("Telegram TOKEN present ?", !!token);
  console.log("Telegram CHAT_ID:", chatId);

  if (!token || !chatId) {
    console.error("TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant");
    return;
  }

  // Si on appelle sans order (ex: test), on fait un message simple
  if (!order) {
    const testMessage = "🔥 Test notif KOUBAS depuis le backend (sans order) !";

    const res = await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id: chatId,
        text: testMessage,
      }
    );

    console.log("Réponse Telegram (test):", res.data);
    return;
  }

  // ------- Cas normal avec une commande -------
  // const itemsLines = order.items
  //   .map(
  //     (item) => `• ${item.name} x${item.quantity} — ${item.price.toFixed(2)} $`
  //   )
  //   .join("\n");

  const items = Array.isArray(order.items) ? order.items : [];

  const itemsText = items
    .map((it) => `• ${it.name} x${it.quantity} (${it.price}$)`)
    .join("\n");

  //   const message = `
  // 📦 *Nouvelle commande KOUBAS validée !*

  // 👤 Client : ${order.user.full_name} (${order.user.email})
  // 💰 Total : ${order.total.toFixed(2)} $
  // 🛒 Articles :
  // ${itemsLines}

  // 🕒 Date : ${new Date().toLocaleString("fr-CA")}
  // `;

  const message =
    `🛒 Nouvelle commande\n` +
    `Client: ${order.user?.full_name || "N/A"}\n` +
    `Email: ${order.user?.email || "N/A"}\n` +
    `Total: ${order.total || 0}$\n` +
    (items.length
      ? `\n📦 Articles:\n${itemsText}`
      : `\n📦 Articles: (non fournis)`);
  try {
    const res = await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }
    );
    console.log("Réponse Telegram (order):");
  } catch (err) {
    console.error("Erreur envoi Telegram :", err.response?.data || err.message);
  }
}

module.exports = {
  sendOrderNotification,
};
