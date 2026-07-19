// src/services/emailService.js
//
// Centralise tous les envois d'email du site via Resend.
// Nécessite RESEND_API_KEY dans api/.env
//
// npm install resend

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = 'noreply@aurassens.shop'; // domaine vérifié sur Resend (aurassens.shop, sans .com)
const FROM_NAME = 'aurassens-Koubas'; // ← ajuste si le nom du site est différent

/**
 * Envoie le code de vérification à 6 chiffres à l'inscription.
 * @param {string} to - email du destinataire
 * @param {string} code - code à 6 chiffres
 */
async function sendVerificationEmail(to, code) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111;">Vérifie ton adresse email</h2>
      <p style="color: #444; font-size: 15px;">
        Voici ton code de vérification. Il expire dans 15 minutes.
      </p>
      <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111;">${code}</span>
      </div>
      <p style="color: #888; font-size: 13px;">
        Si tu n'as pas créé de compte, ignore cet email.
      </p>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_ADDRESS}>`,
      to,
      subject: 'Ton code de vérification',
      html,
    });
    return result;
  } catch (err) {
    console.warn('[emailService] Échec envoi email de vérification:', err.message);
    throw err; // on relance ici — contrairement à la confirmation de commande,
               // le flow d'inscription dépend de cet envoi
  }
}

/**
 * Envoie l'email de confirmation de commande après paiement réussi.
 * @param {string} to - email du destinataire
 * @param {object} order - { id, items: [{name, quantity, price}], total, shippingAddress }
 */
async function sendOrderConfirmationEmail(to, order) {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0; color: #333;">${item.name}</td>
        <td style="padding: 8px 0; color: #333; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px 0; color: #333; text-align: right;">${item.price} $</td>
      </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111;">Merci pour ta commande !</h2>
      <p style="color: #444; font-size: 15px;">
        Commande <strong>#${order.id}</strong> confirmée.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <thead>
          <tr style="border-bottom: 2px solid #eee;">
            <th style="text-align: left; padding-bottom: 8px; color: #888; font-size: 13px;">Article</th>
            <th style="text-align: center; padding-bottom: 8px; color: #888; font-size: 13px;">Qté</th>
            <th style="text-align: right; padding-bottom: 8px; color: #888; font-size: 13px;">Prix</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="text-align: right; font-size: 18px; font-weight: bold; color: #111; margin-bottom: 24px;">
        Total : ${order.total} $
      </div>

      <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px; color: #888; font-size: 13px;">Adresse de livraison</p>
        <p style="margin: 0; color: #333; font-size: 14px;">${order.shippingAddress}</p>
      </div>

      <a href="https://yourdomain.com/mes-commandes"
         style="display: inline-block; background: #111; color: #fff; text-decoration: none;
                padding: 12px 20px; border-radius: 6px; font-size: 14px;">
        Voir mes commandes
      </a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_ADDRESS}>`,
      to,
      subject: `Confirmation de ta commande #${order.id}`,
      html,
    });
    return result;
  } catch (err) {
    // Ici on ne relance PAS l'erreur — même pattern que l'appel Telegram existant :
    // un échec d'email ne doit jamais faire échouer le webhook Stripe.
    console.warn('[emailService] Échec envoi confirmation de commande:', err.message);
    return null;
  }
}

module.exports = {
  sendVerificationEmail,
  sendOrderConfirmationEmail,
};