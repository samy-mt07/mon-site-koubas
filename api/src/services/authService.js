

// api/src/services/authService.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const { createUser, getUserByEmail } = require("../models/userModel");

const JWT_SECRET = config.jwt.secret;

// REGISTER
async function registerUser({ full_name, email, password }) {
  if (!full_name || !email || !password) {
    throw new Error("MISSING_FIELDS");
  }

  if (password.length < 8) {
    throw new Error("PASSWORD_TOO_SHORT");
  }

  // Vérifie si email existe
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("EMAIL_ALREADY_USED");
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Créer user → ton modèle créer l'utilisateur SANS is_admin donc on fait comme avant
  const user = await createUser(full_name, email, password_hash);

  // IMPORTANT : si colonne is_admin existe, on le renvoie, sinon false
  user.is_admin = user.is_admin ?? false;

  // Construire le payload complet du token
  const payload = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    created_at: user.created_at,
    is_admin: user.is_admin, 
  };

  // Générer token
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

  delete user.password_hash;

  return { user: payload, token };
}


if (!JWT_SECRET) {
  throw new Error("JWT_SECRET non défini dans le .env");
}

async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new Error("MISSING_FIELDS");
  }

  //  On cherche l'utilisateur par email
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  //  On vérifie le mot de passe
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // 3️ On s'assure que is_admin est bien un booléen
  // (si dans la BD c'est NULL → false)
  user.is_admin = user.is_admin ?? false;

  // 4️ Payload qui sera dans le token ET renvoyé au front
  const payload = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    created_at: user.created_at,
    is_admin: user.is_admin, //  très important
  };

// 5️Générer le token JWT
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

  // 6️ On enlève le hash avant de renvoyer l'utilisateur
  delete user.password_hash;

  return { user: payload, token };
}

//  UN SEUL EXPORT PROPRE ICI :
module.exports = {
  registerUser,
  loginUser,
};


//--------------------------------------------

// // api/src/services/telegramService.js
// const axios = require("axios");
// const pool = require("../config/db");

// function getTelegramCreds() {
//   const token = process.env.TELEGRAM_BOT_TOKEN
//     ? process.env.TELEGRAM_BOT_TOKEN.trim()
//     : null;

//   const chatId = process.env.TELEGRAM_CHAT_ID
//     ? process.env.TELEGRAM_CHAT_ID.trim()
//     : null;

//   return { token, chatId };
// }

// async function sendTelegramMessage(text) {
//   const { token, chatId } = getTelegramCreds();

//   console.log("Telegram TOKEN present ?", !!token);
//   console.log("Telegram CHAT_ID:", chatId);

//   if (!token || !chatId) {
//     console.error("TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant");
//     return;
//   }

//   // ⚠️ Pas besoin de parse_mode Markdown ici (ton message n'utilise pas du vrai Markdown)
//   await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
//     chat_id: chatId,
//     text,
//   });
// }

// async function loadOrderForTelegram(orderId) {
//   // 1) Order + user
//   const orderRes = await pool.query(
//     `
//     SELECT
//       o.id,
//       o.total_cents,
//       o.created_at,
//       u.full_name,
//       u.email
//     FROM orders o
//     JOIN users u ON u.id = o.user_id
//     WHERE o.id = $1
//     `,
//     [orderId]
//   );

//   if (orderRes.rows.length === 0) return null;

//   const o = orderRes.rows[0];

//   // 2) Items
//   const itemsRes = await pool.query(
//     `
//     SELECT
//       COALESCE(p.name, 'Unknown product') AS name,
//       oi.quantity,
//       oi.unit_price_cents
//     FROM order_items oi
//     LEFT JOIN products p ON p.id = oi.product_id
//     WHERE oi.order_id = $1
//     ORDER BY oi.id ASC
//     `,
//     [orderId]
//   );

//   const items = itemsRes.rows.map((r) => ({
//     name: r.name,
//     quantity: Number(r.quantity),
//     unit_price_cents: Number(r.unit_price_cents),
//   }));

//   return {
//     id: Number(o.id),
//     total_cents: Number(o.total_cents),
//     created_at: o.created_at,
//     user: { full_name: o.full_name, email: o.email },
//     items,
//   };
// }

// async function sendOrderNotification(orderId) {
//   // ✅ Test sans orderId
//   if (!orderId) {
//     await sendTelegramMessage("🔥 Test notif KOUBAS depuis le backend !");
//     console.log("Réponse Telegram (test): OK");
//     return;
//   }

//   const order = await loadOrderForTelegram(orderId);

//   if (!order) {
//     await sendTelegramMessage(
//       `🛒 Nouvelle commande\nOrder #${orderId}\n⚠️ Impossible de charger les détails depuis la DB.`
//     );
//     console.log("Réponse Telegram (order fallback): OK");
//     return;
//   }

//   const total = (order.total_cents / 100).toFixed(2);

//   const itemsText =
//     order.items.length > 0
//       ? order.items
//           .map((it) => {
//             const price = (it.unit_price_cents / 100).toFixed(2);
//             return `• ${it.name} x${it.quantity} (${price}$)`;
//           })
//           .join("\n")
//       : "(aucun article)";

//   const message =
//     `🛒 Nouvelle commande\n` +
//     `Order: #${order.id}\n` +
//     `Client: ${order.user.full_name}\n` +
//     `Email: ${order.user.email}\n` +
//     `Total: ${total}$\n` +
//     `\n📦 Articles:\n${itemsText}\n` +
//     `\n🕒 Date: ${new Date(order.created_at).toLocaleString("fr-CA")}`;

//   try {
//     await sendTelegramMessage(message);
//     console.log("Réponse Telegram (order): OK");
//   } catch (err) {
//     console.error("Erreur envoi Telegram :", err.response?.data || err.message);
//   }
// }

// module.exports = {
//   sendOrderNotification,
// };
