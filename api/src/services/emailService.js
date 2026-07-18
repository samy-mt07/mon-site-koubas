// src/services/emailService.js
const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// ⚠️ Remplace par ton domaine une fois vérifié sur Resend (Dashboard → Domains).
// En attendant la vérification DNS, "onboarding@resend.dev" fonctionne pour tester.
const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";

function assertReady() {
  if (!resend) {
    console.error("RESEND_API_KEY manquant — email non envoyé");
    return false;
  }
  return true;
}

/**
 * Envoie le code de vérification à 6 chiffres lors de l'inscription.
 */
async function sendVerificationEmail(to, code) {
  if (!assertReady()) return;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111;">Confirme ton adresse email</h2>
      <p style="color: #444; font-size: 15px;">
        Voici ton code de vérification. Il expire dans 15 minutes.
      </p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; background: #f4f4f4; padding: 16px 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
        ${code}
      </div>
      <p style="color: #888; font-size: 13px;">
        Si tu n'es pas à l'origine de cette demande, ignore cet email.
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Ton code de vérification",
      html,
    });
    console.log("Email de vérification envoyé à", to);
  } catch (err) {
    console.error("Erreur envoi email de vérification:", err.message);
    throw err;
  }
}

/**
 * Envoie la confirmation de commande après un paiement réussi.
 * `order` attendu : { id, total_cents, created_at, items: [{name, quantity, unit_price_cents}],
 *                      shipping: { fullName, address1, apartment, city, postalCode, country } }
 */
async function sendOrderConfirmationEmail(to, order) {
  if (!assertReady()) return;

  const total = (order.total_cents / 100).toFixed(2);

  const itemsHtml = order.items
    .map((it) => {
      const price = (it.unit_price_cents / 100).toFixed(2);
      return `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${it.name}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: center;">x${it.quantity}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${price}$</td>
        </tr>
      `;
    })
    .join("");

  const addressLine = [
    order.shipping?.address1,
    order.shipping?.apartment,
    order.shipping?.city,
    order.shipping?.postalCode,
    order.shipping?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111;">Commande confirmée ✅</h2>
      <p style="color: #444; font-size: 15px;">
        Merci pour ta commande #${order.id} ! Voici le récapitulatif :
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr>
            <th style="text-align: left; padding-bottom: 8px; border-bottom: 2px solid #111;">Article</th>
            <th style="text-align: center; padding-bottom: 8px; border-bottom: 2px solid #111;">Qté</th>
            <th style="text-align: right; padding-bottom: 8px; border-bottom: 2px solid #111;">Prix</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <p style="text-align: right; font-size: 18px; font-weight: bold; margin: 16px 0;">
        Total : ${total}$
      </p>

      <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <strong>Livraison à :</strong><br/>
        ${order.shipping?.fullName || ""}<br/>
        ${addressLine}<br/>
        ${order.shipping?.phone || ""}
      </div>

      <p style="color: #888; font-size: 13px;">
        Tu peux suivre ta commande dans ton espace "Mes commandes".
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Confirmation de ta commande #${order.id}`,
      html,
    });
    console.log("Email de confirmation envoyé à", to);
  } catch (err) {
    console.error("Erreur envoi email de confirmation:", err.message);
    throw err;
  }
}

module.exports = {
  sendVerificationEmail,
  sendOrderConfirmationEmail,
};