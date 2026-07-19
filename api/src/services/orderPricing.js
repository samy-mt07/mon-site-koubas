// src/services/orderPricing.js
const pool = require("../config/db");
const { getFreeDelivery } = require("./settingsStore");

const SHIPPING_FEE_CENTS = 599;

/**
 * Calcule le sous-total, les frais de livraison et le total d'une commande
 * à partir du panier envoyé par le client. Utilisée à la fois par l'aperçu
 * (/checkout/preview) et par la création de session Stripe (/checkout/create-session)
 * pour que les deux ne puissent jamais diverger.
 *
 * `client` est optionnel : passer le client de transaction du checkout pour
 * que la lecture des produits participe au même verrouillage/rollback ;
 * sinon on retombe sur le pool global (cas de l'aperçu, purement en lecture).
 */
async function calculateOrderTotals(cartItems, address, client = pool) {
  if (!cartItems || cartItems.length === 0) {
    throw Object.assign(new Error("Empty cart"), { code: "EMPTY_CART" });
  }

  const productIds = cartItems.map((i) => i.id);
  const productsRes = await client.query(
    `SELECT * FROM products WHERE id = ANY($1::bigint[]) AND is_active = true`,
    [productIds]
  );

  if (productsRes.rows.length !== cartItems.length) {
    throw Object.assign(new Error("Invalid products"), { code: "INVALID_PRODUCTS" });
  }

  let subtotal = 0;
  const items = [];

  for (const product of productsRes.rows) {
    const item = cartItems.find((i) => Number(i.id) === Number(product.id));

    if (!item || !item.quantity || Number(item.quantity) <= 0) {
      throw Object.assign(new Error(`Invalid quantity for product ${product.id}`), {
        code: "INVALID_QUANTITY",
        productId: product.id,
      });
    }

    const quantity = Number(item.quantity);
    const itemSubtotal = product.price_cents * quantity;
    subtotal += itemSubtotal;

    items.push({ product, quantity, subtotal: itemSubtotal });
  }

  const freeDelivery = getFreeDelivery();
  const deliveryFee = freeDelivery ? 0 : SHIPPING_FEE_CENTS;
  const total = subtotal + deliveryFee;

  return { subtotal, deliveryFee, total, freeDelivery, items };
}

module.exports = { calculateOrderTotals, SHIPPING_FEE_CENTS };
